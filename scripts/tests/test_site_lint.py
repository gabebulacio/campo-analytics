"""The validator must catch seeded slop and pass the site's real copy. Run: python -m pytest -q scripts/tests"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import site_lint as sl  # noqa: E402

CFG = {
    "provenance_pages": ["/"],
    "claims": [{"id": "c.acc", "value": "98%", "near": "correct results", "pages": ["/"]}],
    "allow": [],
}


def page(body: str, head: str = '<title>T</title><meta name="description" content="d"><meta property="og:image" content="x">') -> sl.Page:
    p = sl.Page()
    p.feed(f'<html lang="en"><head>{head}</head><body><h1>Name</h1>{body}</body></html>')
    return p


def rules(body: str, **kw) -> set[tuple[str, str]]:
    return {(f.rule, f.severity) for f in sl.lint_page("/", page(body, **kw), CFG, set())}


@pytest.mark.parametrize(
    "copy, rule",
    [
        ("World-class analytics for every team.", "L7"),
        ("In today's fast-paced world, data matters.", "L12"),
        ("I hope this helps your reporting.", "L1"),
        ("Trusted by [Client Name] and others.", "L2"),
        ("Not just dashboards, but decisions.", "T1"),
        ("Here's the thing: data matters.", "T6"),
        ("In conclusion, governance pays.", "T7"),
        ("Fast — simple — done.", "T2"),
        ("Ship faster \U0001F680", "T11"),
        ("Cut reporting time by 40%.", "C01"),
    ],
)
def test_seeded_slop_blocks(copy, rule):
    assert (rule, sl.BLOCK) in rules(f"<p>{copy}</p>")


def test_finance_words_only_warn_in_body():
    r = rules("<p>Leverage ratios need a robust, comprehensive reconciliation.</p>")
    assert ("L13", sl.WARN) in r and not {x for x in r if x[1] == sl.BLOCK}


def test_hero_escalates_marketese():
    assert ("L5", sl.BLOCK) in {(f.rule, f.severity) for f in sl.lint_text("/", "h1", "Unlock your data", [])}
    assert ("L5", sl.WARN) in {(f.rule, f.severity) for f in sl.lint_text("/", "p", "Unlock your data", [])}


def test_strong_vocabulary_blocks_only_in_a_cluster():
    one = rules("<p>A pivotal metric.</p>")
    three = rules("<p>A pivotal metric.</p><p>We delve deeper.</p><p>A vibrant team.</p>")
    assert ("L4", sl.BLOCK) not in one and ("L4", sl.BLOCK) in three


def test_code_exclamation_is_not_prose():
    assert not sl.lint_text("/", "p", "Filter where status != 'done'", [])


def test_real_copy_passes():
    body = (
        "<p>I build semantic layers and the checks that prove them. Thresholds are set with Finance, not guessed.</p>"
        "<dl><div><dt>98%</dt><dd>correct results, 77 questions</dd></div></dl>"
    )
    found = {r for r in rules(body) if r[1] == sl.BLOCK}
    # 77 has no claim in this test config, so it is the only block
    assert found == {("C01", sl.BLOCK)}
    assert not {r for r in rules("<p>I build semantic layers.</p><dl><dt>98%</dt><dd>correct results</dd></dl>") if r[1] == sl.BLOCK}


def test_years_centuries_and_empty_cells_are_not_findings():
    assert not rules("<p>An 1806 census, 17th and 18th century records, since 2023.</p><table><tr><td>—</td></tr></table>")


def test_page_basics():
    r = rules("<h1>Second</h1><img src=x>", head="")
    assert {("M02", sl.BLOCK), ("M03", sl.BLOCK), ("M05", sl.BLOCK), ("M07", sl.BLOCK)} <= r


def test_headings():
    r = rules("<h2>Why Choose Our Data Consulting Services?</h2>")
    assert ("T5", sl.WARN) in r and ("T9", sl.WARN) in r


def test_allowlist_needs_matching_context():
    cfg = {**CFG, "allow": [{"phrase": "deep dive", "near": "Deep Dive workshop (2 days)", "reason": "named product"}]}
    ok = sl.lint_text("/", "p", "The Deep Dive workshop (2 days) maps your model.", cfg["allow"])
    bad = sl.lint_text("/", "p", "Let me do a deep dive on your data.", cfg["allow"])
    assert not ok and bad


def test_private_names_block_only_on_private_pages():
    cfg = {"private_pages": ["/projects/x*"], "_terms": {"acme holdings"}}
    hit = sl.lint_page("/projects/x/case", page("<p>Built for Acme  Holdings finance.</p>"), cfg, set())
    home = sl.lint_page("/", page("<p>Built for Acme Holdings finance.</p>"), cfg, set())
    clean = sl.lint_page("/projects/x", page("<p>Built for a shared finance team.</p>"), cfg, set())
    assert any(f.rule == "P01" for f in hit)
    assert not any(f.rule == "P01" for f in home + clean)


def test_static_app_sources_are_scanned(tmp_path, monkeypatch):
    src = tmp_path / "app" / "src"
    src.mkdir(parents=True)
    (src / "copy.ts").write_text('export const T = "Built for Acme Holdings. World-class insights.";\n', encoding="utf-8")
    (src / "ok.ts").write_text('export const T = "Built for a shared finance team.";\n', encoding="utf-8")
    monkeypatch.setattr(sl, "ROOT", tmp_path)
    cfg = {"_terms": {"acme holdings"}, "static_apps": [{"src": "app/src"}]}
    found = {(f.rule, f.where.split(":")[0]) for f in sl.lint_static_apps(cfg)}
    assert ("P01", "app/src/copy.ts") in found and ("L7", "app/src/copy.ts") in found
    assert not any(w.endswith("ok.ts") for _, w in found)


def test_private_terms_come_from_outside_the_repo(tmp_path, monkeypatch):
    f = tmp_path / "terms.txt"
    f.write_text("# comment\nAcme  Holdings\n", encoding="utf-8")
    monkeypatch.setattr(sl, "PRIVATE_TERMS_FILE", f)
    monkeypatch.setenv("SITE_LINT_PRIVATE_TERMS", "Globex")
    assert sl.private_terms() == {"acme holdings", "globex"}
