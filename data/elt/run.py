"""ELT: raw sources -> raw schema -> staging -> marts.

Sources (document collections)
  files    (default) the generated JSONL in data/out/raw/mongo
  mongo    MONGODB_URI, database analytics_raw (load it with data/loaders/load_mongo.py)

Targets
  duckdb   (default) data/out/analytics.duckdb - zero-setup local run
  postgres DATABASE_URL_OWNER (Neon). Grants SELECT on marts to app_reader.

The loader flattens Mongo documents into relational raw tables (what an
Airbyte/Fivetran normalisation step would do); every transformation after that
is plain SQL in sql/ so it runs unchanged on DuckDB and Postgres.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "out" / "raw"
FLAT = ROOT / "data" / "out" / "flat"
SQL_DIR = Path(__file__).resolve().parent / "sql"
DUCKDB_PATH = ROOT / "data" / "out" / "analytics.duckdb"


def _jsonl(path: Path):
    with path.open(encoding="utf-8") as fh:
        for line in fh:
            yield json.loads(line)


class Docs:
    """Reads one document collection from the generated files or from MongoDB."""

    def __init__(self, source: str, db_name: str = "analytics_raw"):
        self.source = source
        self.db = None
        if source == "mongo":
            from pymongo import MongoClient

            uri = os.environ.get("MONGODB_URI")
            if not uri or "<db_password>" in uri:
                raise SystemExit("MONGODB_URI is not set (or still has <db_password>) in .env.local")
            self.db = MongoClient(uri, serverSelectionTimeoutMS=10_000)[db_name]

    def __call__(self, collection: str):
        if self.db is None:
            yield from _jsonl(RAW / "mongo" / f"{collection}.jsonl")
            return
        n = 0
        for doc in self.db[collection].find({}, batch_size=5000):
            n += 1
            yield doc
        if n == 0:
            raise SystemExit(f"mongo collection '{collection}' is empty; run data/loaders/load_mongo.py first")


def _get(doc, *keys):
    for k in keys:
        if doc is None:
            return None
        doc = doc.get(k)
    return doc


# ---------------------------------------------------------------- flatteners
# table -> (source file, columns with SQL types, row function)
def _crop_story(doc):
    n_applied = next((i["kg"] for i in doc["inputs"] if i["nutrient"] == "N"), None)
    n_removed = next((i["kg"] for i in doc["inputs"] if i["nutrient"] == "N_removed"), None)
    return [
        doc["_id"], doc["field_id"], doc["campaign"], doc["program_id"], doc["crop"],
        _get(doc, "area", "planted_ha"), _get(doc, "area", "harvested_ha"), _get(doc, "harvest", "production_t"),
        n_applied, n_removed, doc["practices"]["no_till"], doc["practices"]["cover_crop"], doc["practices"]["crop_rotation"],
        _get(doc, "footprint", "kgco2e"), doc["status"], _get(doc, "signature", "signed_at"), _get(doc, "signature", "anchor_tx_hash"),
        _get(doc, "form", "required_total"), _get(doc, "form", "required_filled"), doc["data_origin"],
    ]


TABLES = {
    "producers": ("mongo/producers", [
        ("producer_id", "varchar"), ("size_band", "varchar"), ("preferred_channel", "varchar"), ("country", "varchar"),
        ("admin1", "varchar"), ("onboarded_at", "varchar"), ("program_id", "varchar"), ("data_origin", "varchar"),
    ], lambda d: [d["_id"], d["size_band"], d["contact"]["preferred_channel"], d["location"]["country"], d["location"]["admin1"], d["onboarded_at"], d["programs"][0], d["data_origin"]]),
    "fields": ("mongo/fields", [
        ("field_id", "varchar"), ("producer_id", "varchar"), ("geom_geojson", "varchar"), ("area_ha", "double precision"),
        ("country", "varchar"), ("admin1", "varchar"), ("admin2", "varchar"), ("biome", "varchar"), ("geometry_valid", "boolean"), ("data_origin", "varchar"),
    ], lambda d: [d["_id"], d["producer_id"], json.dumps(d["geometry"]), d["area_ha"], d["admin"]["country"], d["admin"]["admin1"], d["admin"]["admin2"], d["biome"], d["geometry_valid"], d["data_origin"]]),
    "crop_stories": ("mongo/crop_stories", [
        ("field_season_id", "varchar"), ("field_id", "varchar"), ("campaign", "varchar"), ("program_id", "varchar"), ("crop", "varchar"),
        ("planted_ha", "double precision"), ("harvested_ha", "double precision"), ("production_t", "double precision"),
        ("n_applied_kg", "double precision"), ("n_removed_kg", "double precision"), ("no_till", "boolean"), ("cover_crop", "boolean"), ("crop_rotation", "boolean"),
        ("kgco2e", "double precision"), ("status", "varchar"), ("signed_at", "varchar"), ("anchor_tx_hash", "varchar"),
        ("required_total", "integer"), ("required_filled", "integer"), ("data_origin", "varchar"),
    ], _crop_story),
    "satellite_alerts": ("mongo/satellite_alerts", [
        ("alert_id", "varchar"), ("field_id", "varchar"), ("alert_type", "varchar"), ("severity", "varchar"), ("detected_at", "varchar"),
        ("resolved_at", "varchar"), ("resolution", "varchar"), ("source", "varchar"), ("data_origin", "varchar"),
    ], lambda d: [d["_id"], d["field_id"], d["type"], d["severity"], d["detected_at"], _get(d, "resolution", "resolved_at"), _get(d, "resolution", "outcome"), d["source"], d["data_origin"]]),
    "form_dispatches": ("mongo/form_dispatches", [
        ("dispatch_id", "varchar"), ("producer_id", "varchar"), ("program_id", "varchar"), ("form_type", "varchar"), ("channel", "varchar"),
        ("sent_at", "varchar"), ("responded_at", "varchar"), ("data_origin", "varchar"),
    ], lambda d: [d["_id"], d["producer_id"], d["program_id"], d["form_type"], d["channel"], d["sent_at"], _get(d, "response", "responded_at"), d["data_origin"]]),
}
# Relational sources load as-is (column order from the first row).
PG_TABLES = ["standards", "clients", "campaigns", "programs", "program_standards", "luc_assessments", "compliance_evaluations", "inspections", "lots", "lot_origins"]
PG_TYPES = {
    "area_ha": "double precision", "volume_t": "double precision", "converted_ha_after_cutoff": "double precision", "cost_usd": "double precision",
    "is_latest": "boolean", "segregated": "boolean", "qr_scans": "integer", "missing_requirements": "integer",
}


def flatten(docs: Docs) -> dict[str, list[tuple[str, str]]]:
    """Write one CSV per raw table; return {table: [(col, type)]}."""
    FLAT.mkdir(parents=True, exist_ok=True)
    schemas: dict[str, list[tuple[str, str]]] = {}
    for table, (src, cols, fn) in TABLES.items():
        with (FLAT / f"{table}.csv").open("w", newline="", encoding="utf-8") as fh:
            w = csv.writer(fh)
            w.writerow([c for c, _ in cols])
            for doc in docs(src.removeprefix("mongo/")):
                w.writerow(["" if v is None else v for v in fn(doc)])
        schemas[table] = cols
    for table in PG_TABLES:
        rows = list(_jsonl(RAW / f"pg/{table}.jsonl"))
        cols = list(rows[0].keys())
        with (FLAT / f"{table}.csv").open("w", newline="", encoding="utf-8") as fh:
            w = csv.writer(fh)
            w.writerow(cols)
            for r in rows:
                w.writerow(["" if r[c] is None else r[c] for c in cols])
        schemas[table] = [(c, PG_TYPES.get(c, "varchar")) for c in cols]
    return schemas


def sql_files() -> list[Path]:
    return sorted(SQL_DIR.glob("*.sql"))


def split_sql(text: str) -> list[str]:
    stmts, buf = [], []
    for line in text.splitlines():
        if line.strip().startswith("--"):
            continue
        buf.append(line)
        if line.rstrip().endswith(";"):
            stmts.append("\n".join(buf).strip().rstrip(";"))
            buf = []
    if "".join(buf).strip():
        stmts.append("\n".join(buf).strip())
    return [s for s in stmts if s]


# ---------------------------------------------------------------- targets
def run_duckdb(schemas) -> None:
    import duckdb

    DUCKDB_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp = DUCKDB_PATH.with_suffix(".building.duckdb")
    tmp.unlink(missing_ok=True)
    con = duckdb.connect(str(tmp))
    for s in ("raw", "staging", "marts"):
        con.execute(f"create schema {s}")
    for table, cols in schemas.items():
        coldefs = ", ".join(f"{c} {t}" for c, t in cols)
        con.execute(f"create table raw.{table} ({coldefs})")
        types = "{" + ", ".join(f"'{c}': '{t.upper()}'" for c, t in cols) + "}"
        con.execute(f"insert into raw.{table} select * from read_csv('{(FLAT / f'{table}.csv').as_posix()}', header=true, columns={types}, nullstr='')")
    for f in sql_files():
        for stmt in split_sql(f.read_text(encoding="utf-8")):
            con.execute(stmt)
    con.close()
    DUCKDB_PATH.unlink(missing_ok=True)
    tmp.rename(DUCKDB_PATH)


def run_postgres(schemas) -> None:
    import psycopg

    url = os.environ.get("DATABASE_URL_OWNER")
    if not url:
        raise SystemExit("DATABASE_URL_OWNER is not set in .env.local")
    with psycopg.connect(url, autocommit=True) as con:
        for s in ("raw", "staging", "marts"):
            con.execute(f"drop schema if exists {s} cascade")
            con.execute(f"create schema {s}")
        for table, cols in schemas.items():
            coldefs = ", ".join(f"{c} {t}" for c, t in cols)
            con.execute(f"create table raw.{table} ({coldefs})")
            with con.cursor() as cur, (FLAT / f"{table}.csv").open(encoding="utf-8") as fh:
                with cur.copy(f"copy raw.{table} from stdin with (format csv, header true, null '')") as cp:
                    while chunk := fh.read(1 << 20):
                        cp.write(chunk)
        for f in sql_files():
            for stmt in split_sql(f.read_text(encoding="utf-8")):
                con.execute(stmt)
        # read-only role for the query engine (created in setup; ignore if absent)
        try:
            con.execute("grant usage on schema marts to app_reader")
            con.execute("grant select on all tables in schema marts to app_reader")
        except psycopg.Error as e:  # role may not exist yet
            print(f"warning: could not grant to app_reader: {e}")


def main() -> None:
    from dotenv import load_dotenv

    load_dotenv(ROOT / ".env.local")
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", choices=["files", "mongo"], default="files", help="where the document collections come from")
    ap.add_argument("--target", choices=["duckdb", "postgres"], default="duckdb")
    a = ap.parse_args()
    t0 = time.time()
    schemas = flatten(Docs(a.source))
    print(f"extracted documents from {a.source}")
    if a.target == "duckdb":
        run_duckdb(schemas)
        print(f"built {DUCKDB_PATH} in {time.time() - t0:.1f}s")
    else:
        run_postgres(schemas)
        print(f"built postgres marts in {time.time() - t0:.1f}s")


if __name__ == "__main__":
    main()
