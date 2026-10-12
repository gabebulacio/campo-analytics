"""Compiler: determinism (snapshots), >= 30 hand-written plans execute, ratio-of-sums vs reference SQL."""

import hashlib
from pathlib import Path

import pytest
import yaml
from app.compiler import compile_plan
from app.executor import execute
from app.plan import Filter, QueryPlan, plan_from_yaml
from app.validator import validate

HERE = Path(__file__).resolve().parent
SNAP = HERE / "snapshots"


def _plans():
    out = []
    for spec in yaml.safe_load((HERE / "plans.yaml").read_text(encoding="utf-8")):
        between = spec.pop("op_between", False)
        p = plan_from_yaml(spec)
        if between:
            p.filters = [Filter(dimension=f.dimension, op="between", values=f.values) for f in p.filters]
        out.append(p)
    return out


PLANS = _plans()


def test_at_least_30_plans():
    assert len(PLANS) >= 30


@pytest.mark.parametrize("i", range(len(PLANS)))
def test_plan_validates_compiles_and_runs(sl, i):
    v = validate(sl, PLANS[i])
    assert v.ok, ([e.message for e in v.errors], v.clarification)
    q = compile_plan(sl, v.plan)
    res = execute(q.sql, q.params, q.display_sql)
    assert res.columns == q.columns
    assert res.rows, "expected rows from synthetic data"


@pytest.mark.parametrize("i", range(len(PLANS)))
def test_compiler_is_deterministic_and_matches_snapshot(sl, i):
    p = validate(sl, PLANS[i]).plan
    a, b = compile_plan(sl, p), compile_plan(sl, p.model_copy(deep=True))
    assert a.display_sql == b.display_sql and a.params == b.params
    SNAP.mkdir(exist_ok=True)
    key = hashlib.sha1(p.model_dump_json().encode()).hexdigest()[:12]
    f = SNAP / f"plan_{i:02d}_{key}.sql"
    if not f.exists():  # first run records the snapshot; later runs must match byte for byte
        f.write_text(a.display_sql, encoding="utf-8")
    assert f.read_text(encoding="utf-8") == a.display_sql


def _one(sql):
    return execute(sql, []).rows


def test_compliance_rate_is_ratio_of_counts(sl):
    p = QueryPlan(metrics=["compliance_rate"], dimensions=[], filters=[Filter(dimension="standard", values=["EUDR"])])
    q = compile_plan(sl, p)
    got = execute(q.sql, q.params).rows[0][0]
    ref = _one("""select count(distinct case when compliance_status = 'compliant' then field_season_id end) * 1.0
                         / count(distinct case when compliance_status <> 'not_applicable' then field_season_id end)
                  from marts.fct_compliance_evaluation where standard_id = 'EUDR'""")[0][0]
    assert got == pytest.approx(ref, rel=1e-9)


def test_emissions_intensity_is_ratio_of_sums_not_avg_of_ratios(sl):
    p = QueryPlan(metrics=["emissions_intensity"])
    got = execute(compile_plan(sl, p).sql, []).rows[0][0]
    ref = _one("""select sum(emissions_kgco2e) / sum(production_t) from marts.fct_field_season
                  where emissions_kgco2e is not null and production_t > 0""")[0][0]
    avg_of_ratios = _one("""select avg(emissions_kgco2e / production_t) from marts.fct_field_season
                            where emissions_kgco2e is not null and production_t > 0""")[0][0]
    assert got == pytest.approx(ref, rel=1e-9)
    assert abs(got - avg_of_ratios) > 1e-6  # the trap the semantic layer avoids


def test_assessed_hectares_counts_each_field_once(sl):
    p = QueryPlan(metrics=["assessed_hectares"], filters=[Filter(dimension="standard", values=["EUDR"])])
    q = compile_plan(sl, p)
    got = execute(q.sql, q.params).rows[0][0]
    ref = _one("""select sum(area_ha) from marts.dim_field where field_id in (
                    select field_id from marts.fct_luc_assessment where is_latest and standard_id = 'EUDR')""")[0][0]
    assert got == pytest.approx(float(ref), rel=1e-9)


def test_breakdown_reconciles_with_total(sl):
    by = execute(compile_plan(sl, QueryPlan(metrics=["planted_hectares"], dimensions=["crop"])).sql, []).rows
    tot = execute(compile_plan(sl, QueryPlan(metrics=["planted_hectares"])).sql, []).rows[0][0]
    assert sum(r[1] for r in by) == pytest.approx(tot, rel=1e-9)


def test_unreachable_filter_is_not_applied_to_denominator(sl):
    """compliant_volume_share: the standard filters the numerator only; total volume is the denominator."""
    p = QueryPlan(metrics=["compliant_volume_share", "traced_volume_t"], filters=[Filter(dimension="standard", values=["EUDR"])])
    q = compile_plan(sl, p)
    assert "standard.standard_id in ($1)" in q.sql
    row = execute(q.sql, q.params).rows[0]
    total = _one("select sum(volume_t) from marts.fct_lot")[0][0]
    assert row[1] == pytest.approx(total)
