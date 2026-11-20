"""Checks for the export to the React app's static data folder (apps/project-finance/data)."""

from __future__ import annotations

import importlib.util
import json
import re
import sys
from pathlib import Path

import pytest

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
APP_TYPES = ROOT / "apps" / "project-finance" / "src" / "types.ts"

spec = importlib.util.spec_from_file_location("pf_build_app", HERE.parent / "build.py")
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)

FIXED_TS = "2026-01-01T00:00:00+00:00"


@pytest.fixture(scope="module")
def app() -> dict:
    return build.app_export(build.build(build.SEED, generated_at=FIXED_TS))


@pytest.fixture(scope="module")
def viewers(app) -> list[dict]:
    return app["index.json"]["viewers"]


# ---------------------------------------------------------------- a small parser for the TS types we use


def split_top(s: str, sep: str) -> list[str]:
    out, depth, cur, quote = [], 0, "", False
    for ch in s:
        if ch == '"':
            quote = not quote
        elif not quote and ch in "{[(<":
            depth += 1
        elif not quote and ch in "}])>":
            depth -= 1
        if ch == sep and depth == 0 and not quote:
            out.append(cur)
            cur = ""
        else:
            cur += ch
    out.append(cur)
    return [x.strip() for x in out if x.strip()]


def parse_type(t: str):
    t = " ".join(t.split())
    alts = split_top(t, "|")
    if len(alts) > 1:
        return ("union", [parse_type(a) for a in alts])
    if t.endswith("[]"):
        return ("array", parse_type(t[:-2]))
    if t.startswith("(") and t.endswith(")"):
        return parse_type(t[1:-1])
    if t.startswith("{"):
        return ("object", parse_fields(t[1:-1]))
    if t.startswith("["):
        return ("tuple", [parse_type(x) for x in split_top(t[1:-1], ",")])
    if t.startswith("Partial<"):
        return parse_type(t[8:-1])
    if t.startswith("Record<"):
        return ("record", parse_type(split_top(t[7:-1], ",")[1]))
    if t.startswith('"'):
        return ("literal", t.strip('"'))
    return ("name", t)


def parse_fields(body: str) -> dict[str, tuple[object, bool]]:
    fields = {}
    for part in split_top(body.replace("\n", ";"), ";"):
        m = re.match(r"(\w+)(\?)?\s*:\s*(.+)$", part, re.S)
        if m:
            fields[m.group(1)] = (parse_type(m.group(3)), bool(m.group(2)))
    return fields


def load_types() -> tuple[dict, dict]:
    src = re.sub(r"/\*.*?\*/", "", re.sub(r"//[^\n]*", "", APP_TYPES.read_text(encoding="utf-8")), flags=re.S)
    ifaces, aliases = {}, {}
    for m in re.finditer(r"export interface (\w+)\s*\{", src):
        i, depth = m.end(), 1
        while depth:
            depth += {"{": 1, "}": -1}.get(src[i], 0)
            i += 1
        ifaces[m.group(1)] = ("object", parse_fields(src[m.end():i - 1]))
    for name, body in re.findall(r"export type (\w+)\s*=\s*([^;]+);", src):
        aliases[name] = parse_type(body)
    return ifaces, aliases


def check(value, node, types, path: str, relax: frozenset = frozenset()) -> None:
    ifaces, aliases = types
    kind, arg = node
    if kind == "union":
        errs = []
        for alt in arg:
            try:
                check(value, alt, types, path, relax)
                return
            except AssertionError as e:
                errs.append(str(e))
        raise AssertionError(f"{path}: {value!r:.80} matches none of the alternatives ({errs[0]})")
    if kind == "literal":
        assert value == arg, f"{path}: {value!r} != {arg!r}"
    elif kind == "array":
        assert isinstance(value, list), f"{path}: not a list"
        for i, v in enumerate(value):
            check(v, arg, types, f"{path}[{i}]", relax)
    elif kind == "tuple":
        assert isinstance(value, list) and len(value) == len(arg), f"{path}: not a {len(arg)}-tuple"
        for i, (v, t) in enumerate(zip(value, arg)):
            check(v, t, types, f"{path}[{i}]", relax)
    elif kind == "record":
        assert isinstance(value, dict), f"{path}: not an object"
        for k, v in value.items():
            check(v, arg, types, f"{path}.{k}", relax)
    elif kind == "object":
        assert isinstance(value, dict), f"{path}: not an object"
        required = {k for k, (_, opt) in arg.items() if not opt and f"{path.split('[')[0]}.{k}" not in relax}
        assert required <= set(value), f"{path}: missing {sorted(required - set(value))}"
        assert set(value) <= set(arg), f"{path}: extra keys {sorted(set(value) - set(arg))}"
        for k, v in value.items():
            check(v, arg[k][0], types, f"{path}.{k}", relax)
    elif arg == "null":
        assert value is None, f"{path}: not null"
    elif arg == "string":
        assert isinstance(value, str), f"{path}: {value!r} is not a string"
    elif arg == "number":
        assert isinstance(value, (int, float)) and not isinstance(value, bool), f"{path}: {value!r} is not a number"
    elif arg == "boolean":
        assert isinstance(value, bool), f"{path}: not a boolean"
    elif arg in ifaces:
        check(value, ifaces[arg], types, arg, relax)
    elif arg in aliases:
        check(value, aliases[arg], types, path, relax)
    else:
        raise AssertionError(f"{path}: unknown type {arg}")


# ---------------------------------------------------------------- contract


def test_files_match_app_types(app, viewers):
    types = load_types()
    ifaces, aliases = types
    assert {"Snapshot", "Project", "ExceptionRow", "Health", "Viewer", "CatalogEntry", "ProjectDetail"} <= set(ifaces)
    assert set(app["index.json"]) == {"meta", "viewers"}
    for v in viewers:
        check(v, ("name", "Viewer"), types, "Viewer")
        # The delivery audience gets no billing position (see test_ad_files_have_no_billing).
        relax = frozenset({"Project.billing"}) if v["role"] == "AD" else frozenset()
        check(app[v["file"]], ("name", "Snapshot"), types, "Snapshot", relax)
    for name, rows in app.items():
        if name.startswith("detail/") and name != "detail/index.json":
            check(rows, ("record", ("name", "ProjectDetail")), types, name)
    used = {e["rule"] for e in app["all.json"]["exceptions"]}
    assert used == {lit for _, lit in aliases["RuleId"][1]}


def test_roles_match_the_app(viewers):
    roles = {v["role"] for v in viewers}
    assert roles == {"Platform owner", "CFA", "CFM", "Director", "Group Director", "AD"}
    owners = [v for v in viewers if v["role"] == "Platform owner"]
    assert [v["key"] for v in owners] == ["all"]  # Home picks the only finance-ops viewer automatically
    assert len({v["key"] for v in viewers}) == len(viewers)
    for v in viewers:
        assert re.fullmatch(r"[a-z0-9-]+\.json", v["file"]) and v["file"] == v["key"] + ".json"


def test_detail_index_points_at_chunks(app):
    idx = app["detail/index.json"]
    assert set(idx) == {p["id"] for p in app["all.json"]["projects"]}
    for pid, chunk in idx.items():
        assert pid in app[f"detail/{chunk}"]


# ---------------------------------------------------------------- scope


def test_per_viewer_scope(app, viewers):
    everything = app["all.json"]["projects"]
    field = {"CFA": "cfa", "CFM": "cfm", "AD": "ad"}
    directors = {name: clients for key, name, role in build.VIEWERS if role == "director"
                 for k, clients in build.DIRECTORS.items() if k == key}
    for v in viewers:
        snap = app[v["file"]]
        assert snap["meta"]["viewer"] == {"key": v["key"], "name": v["name"], "role": v["role"]}
        if v["role"] in field:
            want = [p for p in everything if p[field[v["role"]]] == v["name"]]
        elif v["role"] == "Director":
            want = [p for p in everything if p["client_name"] in directors[v["name"]]]
        else:
            want = everything
        assert [p["id"] for p in snap["projects"]] == [p["id"] for p in want], v["key"]
        assert v["projects"] == len(want) > 0
        assert v["clients"] == sorted({p["client_name"] for p in want})
        ids = {p["id"] for p in want}
        assert {e["project_id"] for e in snap["exceptions"]} <= ids
        assert len(snap["exceptions"]) == sum(e["project_id"] in ids for e in app["all.json"]["exceptions"])
        assert all(set(c["clients"]) & set(v["clients"]) for c in snap["catalog"]) or v["role"] == "Platform owner"
        assert (snap["health"] is not None) == (v["role"] in ("Platform owner", "CFM", "CFA"))
    assert len(app["all.json"]["catalog"]) > max(len(app[v["file"]]["catalog"]) for v in viewers if v["key"] != "all")


def test_ad_files_have_no_billing(app, viewers):
    ads = [v for v in viewers if v["role"] == "AD"]
    assert ads
    for v in ads:
        text = json.dumps(app[v["file"]]["projects"])
        assert '"billing"' not in text and '"unbilled"' not in text
    for v in viewers:
        if v["role"] != "AD":
            assert all("billing" in p and "unbilled" in p for p in app[v["file"]]["projects"])


def test_exceptions_carry_owner_names(app):
    for e in app["all.json"]["exceptions"]:
        assert e["owner"] == (e["cfa"] or e["cfm"])
        assert e["owner_role"] == ("CFA" if e["cfa"] else "CFM")
    names = {n for _, n, _ in build.VIEWERS}
    for p in app["all.json"]["projects"]:
        assert all(p[f] is None or p[f] in names for f in ("cfa", "cfm", "ad"))
        assert p["budget_source"] in ("tracker", "erp")


def test_health_has_the_planted_rejection(app):
    h = app["all.json"]["health"]
    rejected = [s for s in h["sources"] if s["status"] != "accepted"]
    assert len(rejected) == 1 and "missing column" in rejected[0]["status"]
    assert len(h["trackers"]) == len(build.CLIENTS)
    rec = h["reconciliation"][0]
    assert rec["actual"] == sum(rec["causes"].values()) and rec["causes"]["unexplained"] > 0
    assert {"rolebook_rows", "rolebook_ad_blank", "projects_without_cfa"} <= set(h["role_gaps"])
    ids = [c["id"] for c in app["all.json"]["catalog"]]
    assert len(set(ids)) == len(ids) and all(re.fullmatch(r"[0-9a-f]{12}", i) for i in ids)


# ---------------------------------------------------------------- privacy, determinism, size

sys.path.insert(0, str(ROOT / "scripts"))
import site_lint  # noqa: E402


def test_no_private_names_in_app_data(app):
    terms = site_lint.private_terms()
    if not terms:
        pytest.skip("no private terms configured (scripts/private_terms.local.txt or SITE_LINT_PRIVATE_TERMS)")
    texts = dict(build.dump_app(app))
    for f in sorted(build.APP_OUT.rglob("*")):
        if f.is_file():
            texts[str(f.relative_to(ROOT))] = f.read_text(encoding="utf-8")
    # Only file names go in the failure message, so the terms never reach a CI log.
    leaked = [name for name, text in texts.items() if site_lint.lint_private(name, [("p", text)], terms)]
    assert leaked == [], "private name in these files"


def test_app_export_deterministic():
    a = build.dump_app(build.app_export(build.build(build.SEED, generated_at=FIXED_TS)))
    b = build.dump_app(build.app_export(build.build(build.SEED, generated_at=FIXED_TS)))
    assert a == b
    c = build.dump_app(build.app_export(build.build(build.SEED + 1, generated_at=FIXED_TS)))
    assert c != a


def test_written_app_data_matches_build():
    out = build.APP_OUT
    if not (out / "index.json").exists():
        pytest.skip("app data not built yet")
    stamp = json.loads((out / "index.json").read_text(encoding="utf-8"))["meta"]["exportedAt"]
    fresh = build.dump_app(build.app_export(build.build(build.SEED, generated_at=stamp)))
    written = {f.relative_to(out).as_posix(): f.read_text(encoding="utf-8") for f in out.rglob("*.json")}
    assert written == fresh, "apps/project-finance/data is stale: run python projects/project-finance/build.py"
    assert sum(len(t.encode("utf-8")) for t in written.values()) < 3 * 1024 * 1024
