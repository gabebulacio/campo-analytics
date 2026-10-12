"""Data quality: row counts, uniqueness, referential integrity, geometry, size budget, lineage tags."""

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "services" / "pipeline"))

from app import semantic  # noqa: E402
from app.config import settings  # noqa: E402

duckdb = pytest.importorskip("duckdb")
if not settings.duckdb_path.exists():
    pytest.skip("run python tasks.py seed first", allow_module_level=True)

SL = semantic.get()
CON = duckdb.connect(str(settings.duckdb_path), read_only=True)


def q(sql):
    return CON.execute(sql).fetchall()


@pytest.mark.parametrize("ent", list(SL.entities))
def test_entity_tables_exist_and_have_rows(ent):
    assert q(f"select count(*) from {SL.entities[ent].table}")[0][0] > 0


@pytest.mark.parametrize("ent", list(SL.entities))
def test_primary_keys_unique(ent):
    e = SL.entities[ent]
    pk = ", ".join(e.primary_key)
    dupes = q(f"select count(*) from (select {pk}, count(*) c from {e.table} group by {pk} having count(*) > 1)")[0][0]
    assert dupes == 0


@pytest.mark.parametrize("rel", SL.relationships, ids=lambda r: f"{r.from_entity}.{r.from_col}->{r.to_entity}")
def test_referential_integrity(rel):
    f, t = SL.entities[rel.from_entity], SL.entities[rel.to_entity]
    orphans = q(f"""select count(*) from {f.table} a where a.{rel.from_col} is not null
                    and not exists (select 1 from {t.table} b where b.{rel.to_col} = a.{rel.from_col})""")[0][0]
    assert orphans == 0


def test_entity_columns_exist_in_marts():
    for e in SL.entities.values():
        schema, table = e.table.split(".")
        cols = {r[0] for r in q(f"select column_name from information_schema.columns where table_schema='{schema}' and table_name='{table}'")}
        for c in e.columns:
            if c == "geom":
                assert "geom_geojson" in cols
                continue
            assert c in cols, f"{e.table}.{c} missing"


def test_geometry_validity_flag_is_mostly_true_with_planted_invalids():
    share = q("select avg(case when geometry_valid then 1.0 else 0 end) from marts.dim_field")[0][0]
    assert 0.95 < share < 1.0


def test_every_row_has_data_origin():
    for t in ["dim_field", "fct_field_season", "fct_lot", "fct_satellite_alert", "fct_luc_assessment"]:
        assert q(f"select count(*) from marts.{t} where data_origin is null")[0][0] == 0


def test_size_budget():
    mb = settings.duckdb_path.stat().st_size / 1e6
    assert mb < 300, f"local db {mb:.0f} MB exceeds the 300 MB free-tier budget"


def test_luc_result_is_computed_from_conversion_area():
    # conversion_detected only when converted area >= 0.5 ha (rule in the generator; flags are computed, not assigned)
    bad = q("select count(*) from marts.fct_luc_assessment where is_latest and luc_result = 'conversion_detected' and converted_ha_after_cutoff < 0.5")[0][0]
    assert bad == 0


def test_planted_anomaly_present_origin_over_attributed():
    rows = q("""select l.lot_id from marts.fct_lot l join marts.bridge_lot_field_season o using (lot_id)
                group by l.lot_id, l.volume_t having sum(o.volume_t) > l.volume_t""")
    assert rows, "expected the PRG-11 double-attribution anomaly for result checks to catch"
