"""Checks for the synthetic Project Finance build: planted == found, contract shape, metric identities."""

from __future__ import annotations

import importlib.util
import json
import re
import sys
from pathlib import Path

import pytest

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
TYPES = HERE.parent / "snapshot.types.ts"

spec = importlib.util.spec_from_file_location("pf_build", HERE.parent / "build.py")
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)

FIXED_TS = "2026-01-01T00:00:00+00:00"


@pytest.fixture(scope="module")
def snap() -> dict:
    return build.build(build.SEED, generated_at=FIXED_TS)


@pytest.fixture(scope="module")
def projects(snap) -> dict:
    return {p["id"]: p for p in snap["projects"]}


# ---------------------------------------------------------------- contract (parsed from types.ts)


def ts_unions() -> dict[str, set[str]]:
    src = TYPES.read_text(encoding="utf-8")
    out = {}
    for name, body in re.findall(r"export type (\w+)\s*=\s*([^;]+);", src):
        out[name] = set(re.findall(r'"([^"]+)"', body))
    return out


def ts_interfaces() -> dict[str, dict[str, tuple[str, bool]]]:
    src = re.sub(r"//[^\n]*", "", TYPES.read_text(encoding="utf-8"))
    out = {}
    for name, body in re.findall(r"export interface (\w+)\s*\{(.*?)\n\}", src, re.S):
        if name == "Snapshot":
            continue
        fields = {}
        for key, opt, typ in re.findall(r"^\s+(\w+)(\?)?:\s*([^;]+);", body, re.M):
            fields[key] = (typ.strip(), bool(opt))
        out[name] = fields
    return out


def check_type(value, typ: str, unions: dict[str, set[str]]) -> bool:
    alts = [t.strip() for t in typ.split("|")]
    for t in alts:
        if t == "null" and value is None:
            return True
        if t == "string" and isinstance(value, str):
            return True
        if t == "number" and isinstance(value, (int, float)) and not isinstance(value, bool):
            return True
        if t == "boolean" and isinstance(value, bool):
            return True
        if t.endswith("[]") and isinstance(value, list):
            return all(check_type(v, t[:-2], unions) for v in value)
        if t.startswith('"') and value == t.strip('"'):
            return True
        if t in unions and value in unions[t]:
            return True
    return False


def check_obj(obj: dict, iface: str, ifaces, unions) -> None:
    fields = ifaces[iface]
    required = {k for k, (_, opt) in fields.items() if not opt}
    assert required <= set(obj), f"{iface} missing {required - set(obj)}"
    assert set(obj) <= set(fields), f"{iface} extra keys {set(obj) - set(fields)}"
    for k, v in obj.items():
        assert check_type(v, fields[k][0], unions), f"{iface}.{k} = {v!r} is not {fields[k][0]}"


def test_contract(snap):
    unions, ifaces = ts_unions(), ts_interfaces()
    assert set(ifaces) >= {"Rule", "Project", "Exception", "Viewer", "Source"}
    out = json.loads(build.dump(snap))
    assert set(out) == {"meta", "rules", "viewers", "projects", "exceptions", "health", "planted"}
    assert set(out["meta"]) == {"generated_at", "seed", "as_of", "poc_month", "year"}
    assert isinstance(out["meta"]["seed"], int) and isinstance(out["meta"]["year"], int)
    assert re.fullmatch(r"\d{4}-\d{2}", out["meta"]["poc_month"])
    for name, rows in [("Rule", out["rules"]), ("Viewer", out["viewers"]), ("Project", out["projects"]),
                       ("Exception", out["exceptions"]), ("Source", out["health"]["sources"])]:
        assert rows, name
        for r in rows:
            check_obj(r, name, ifaces, unions)
    h = out["health"]
    assert set(h) == {"sources", "parse", "reconciliation", "unassigned"}
    assert set(h["parse"]) == {"tracker_rows", "revised_parsed", "pct_parsed"}
    assert set(h["reconciliation"]) == {"projects", "matched", "explained", "for_review"}
    assert set(h["unassigned"]) == {"analyst", "manager", "account"}
    assert all(isinstance(v, (int, float)) for d in (h["parse"], h["reconciliation"], h["unassigned"]) for v in d.values())
    assert set(out["planted"]) == unions["RuleId"]
    assert [r["id"] for r in out["rules"]] == list(build.RULE_IDS)
    assert [r["n"] for r in out["rules"]] == list(range(1, 12))
    assert [r["id"] for r in out["rules"] if r["hidden"]] == ["billed_ahead"]
    for p in out["projects"]:
        assert len(p["fee_by_month"]) == 12
        assert (p["budget_source"] == "tracker") <= p["in_tracker"]


# ---------------------------------------------------------------- planted vs found


def test_found_equals_planted(snap):
    for rule, v in snap["planted"].items():
        assert 3 <= v["planted"] <= 20, rule
        assert v["found"] == v["planted"], rule
        hit_ids = {e["project_id"] for e in snap["exceptions"] if e["rule"] == rule}
        assert hit_ids == set(snap["_planted_ids"][rule]), rule


def test_one_exception_per_rule_and_project(snap, projects):
    keys = [(e["rule"], e["project_id"]) for e in snap["exceptions"]]
    assert len(keys) == len(set(keys))
    for e in snap["exceptions"]:
        assert e["project_id"] in projects
        p = projects[e["project_id"]]
        assert e["owner"] == (p["analyst"] or p["manager"])
        assert e["amount"] >= 0 and e["detail"]


def test_schema_drift_rejected(snap):
    rejected = [s for s in snap["health"]["sources"] if s["status"] == "rejected"]
    assert len(rejected) == 1 and "missing column" in rejected[0]["reason"]
    assert {s["kind"] for s in snap["health"]["sources"]} == {"erp", "tracker", "directory"}


# ---------------------------------------------------------------- metric identities


def test_committed_and_remaining(snap):
    for p in snap["projects"]:
        assert p["committed"] == pytest.approx(p["fee_actuals"] + p["oop_actuals"] + p["open_po"], abs=0.011)
        assert p["remaining"] == pytest.approx(p["revised"] - p["committed"], abs=0.011)
        assert p["unbilled"] == pytest.approx(p["fee_actuals"] + p["oop_actuals"] - p["billing"], abs=0.011)
        assert p["unapproved_fee"] <= p["fee_actuals"] + 0.01
        if p["budget_source"] == "erp":
            assert p["revised"] == p["erp_budget"]


def test_ratios_from_sums(snap):
    for p in snap["projects"]:
        assert p["burn"] == pytest.approx(p["committed"] / p["revised"], abs=1e-4)
        assert p["fee_burn"] == pytest.approx(p["fee_actuals"] / p["revised_fee"], abs=1e-4)
    # Portfolio burn is a ratio of sums, which differs from the mean of project burns.
    ps = snap["projects"]
    portfolio = sum(p["committed"] for p in ps) / sum(p["revised"] for p in ps)
    assert 0 < portfolio < 1.5
    assert portfolio != pytest.approx(sum(p["burn"] for p in ps) / len(ps), abs=1e-6)


def test_fee_by_month_from_time_entries():
    # Fee by month sums 2026 time entries; where ERP labour reconciles, all entries sum to fee actuals.
    gen = build.generate(build.SEED)
    data, _, parse = build.load(gen["files"])
    projects, _, extra = build.compute(data, parse)
    for p in projects:
        hrs = extra[p["id"]]["hours"]
        in_year = sum(h["Fee Amount"] for h in hrs if h["Date"].startswith("2026"))
        assert sum(p["fee_by_month"]) == pytest.approx(in_year, abs=0.05)
        approved = sum(h["Fee Amount"] for h in hrs if h["Status"] == "Approved")
        if hrs and abs(approved - (p["fee_actuals"] - p["unapproved_fee"])) <= 0.01:
            assert sum(h["Fee Amount"] for h in hrs) == pytest.approx(p["fee_actuals"], abs=0.05)


def test_parse_and_reconciliation(snap):
    parse, rec = snap["health"]["parse"], snap["health"]["reconciliation"]
    assert 0 < parse["pct_parsed"] < 1 and 0 < parse["revised_parsed"] <= 1
    assert rec["matched"] + rec["explained"] + rec["for_review"] == rec["projects"]
    assert rec["matched"] > rec["projects"] * 0.8 and rec["explained"] > 0 and rec["for_review"] > 0


# ---------------------------------------------------------------- scope


def test_scope(snap):
    ps = snap["projects"]
    clients = {p["client"] for p in ps}
    roles = {v["role"] for v in snap["viewers"]}
    assert roles == {"analyst", "manager", "director", "account", "ops"} and 12 <= len(snap["viewers"]) <= 16
    keys = {v["key"] for v in snap["viewers"]}
    for p in ps:
        for f in ("analyst", "manager", "account"):
            assert p[f] is None or p[f] in keys
    for v in snap["viewers"]:
        if v["role"] in ("director", "ops"):
            seen = [p for p in ps if p["client"] in v["clients"]]
            assert v["clients"] and set(v["clients"]) <= clients
        else:
            seen = [p for p in ps if p[v["role"]] == v["key"]]
            assert sorted({p["client"] for p in seen}) == v["clients"]
            assert all(p[v["role"]] == v["key"] for p in seen)
        assert seen, v["key"]
    assert {c for v in snap["viewers"] if v["role"] == "ops" for c in v["clients"]} == clients
    un = snap["health"]["unassigned"]
    assert un["analyst"] == sum(p["analyst"] is None for p in ps) > 0
    assert any(e["owner"] is None for e in snap["exceptions"]) or un["manager"] > 0


# ---------------------------------------------------------------- privacy + determinism

# Names that must never appear (employer, its clients, internal systems) are not in the repo: the same loader as
# scripts/site_lint.py rule P01 reads them from a git-ignored local file or the SITE_LINT_PRIVATE_TERMS secret.
sys.path.insert(0, str(ROOT / "scripts"))
import site_lint  # noqa: E402


def test_no_private_names(snap):
    terms = site_lint.private_terms()
    if not terms:
        pytest.skip("no private terms configured (scripts/private_terms.local.txt or SITE_LINT_PRIVATE_TERMS)")
    texts = {"snapshot": build.dump(snap)}
    for f in ("build.py", "README.md"):
        texts[f] = (HERE.parent / f).read_text(encoding="utf-8")
    # Only file names go in the failure message, so the terms never reach a CI log.
    leaked = [name for name, text in texts.items() if site_lint.lint_private(name, [("p", text)], terms)]
    assert leaked == [], "private name in these files"


def test_deterministic():
    a = build.dump(build.build(build.SEED, generated_at=FIXED_TS))
    b = build.dump(build.build(build.SEED, generated_at=FIXED_TS))
    assert a == b
    c = build.dump(build.build(build.SEED + 1, generated_at=FIXED_TS))
    assert c != a


def test_written_snapshot_matches_build():
    out = build.OUT
    if not out.exists():
        pytest.skip("snapshot not built yet")
    written = json.loads(out.read_text(encoding="utf-8"))
    fresh = json.loads(build.dump(build.build(written["meta"]["seed"], generated_at=written["meta"]["generated_at"])))
    assert written == fresh, "snapshot.json is stale: run python projects/project-finance/build.py"
    assert out.stat().st_size < 600 * 1024
