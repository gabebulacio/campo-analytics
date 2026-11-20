#!/usr/bin/env python3
"""Anti-slop validator for gabrielbulacio.com.

Reads the pages `next build` rendered (apps/web/.next/server/app/**/*.html) plus the CSS and
TSX sources, and fails on the tells that make a consulting site read as unreviewed output:
filler vocabulary, templated rhetoric, numbers nobody can trace, missing page basics and
decoration nobody chose. Rule ids, evidence and false positives are in
docs/consulting/anti-slop.md.

  python scripts/site_lint.py              # lint the last build
  python scripts/site_lint.py --json       # machine-readable findings
  python scripts/site_lint.py --text FILE  # lint a draft (markdown or plain text) before it is a page

Exit 0 = no BLOCK findings, 1 = at least one BLOCK, 2 = nothing to lint (run `npm run build`).
It flags concrete defects, not "sounds like AI": no detector is reliable enough to judge
authorship, least of all for a non-native writer, so every rule names a fix.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "apps" / "web"
BUILD = WEB / ".next" / "server" / "app"
CLAIMS = WEB / "content" / "claims.json"

BLOCK, WARN = "block", "warn"


@dataclass
class Finding:
    rule: str
    severity: str
    where: str
    text: str
    fix: str


# ---- Copy rules -------------------------------------------------------------------------
# Ids follow docs/consulting/anti-slop.md. (id, pattern, severity, fix, hero):
# BLOCK = no legitimate use on this site; WARN = fine in context, look at it. hero=True escalates a
# WARN to BLOCK in the <title>, the meta description and the h1, where a buyer decides to stay.
# Finance and statistics words (leverage, robust, comprehensive) stay WARN: they have literal uses.
VOCAB: list[tuple[str, str, str, str, bool]] = [
    ("L1", r"i hope this helps|certainly!|great question|as an ai\b|as of my (last )?knowledge|let me know if you|here'?s (a|an|the) (revised|updated|polished) version", BLOCK, "chatbot residue: delete", False),
    ("L2", r"\[(client|company|your|insert)[^\]]*\]|lorem ipsum|acme (corp|inc)\b|john doe|jane doe|xx%|\bTODO\b|\bTBD\b|coming soon", BLOCK, "unfinished copy: write it or remove the section", False),
    ("L3", r"plays? a (crucial|pivotal|vital|key|significant) role|stands as|serves as a|(a|is a) testament to|underscores? the (importance|need)|setting the stage|paving the way|indelible|in an era of", WARN, "say what it does, not how much it matters", True),
    ("L4", r"delv(e|es|ing)|underscor(e|es|ing)|showcas(e|es|ing)|meticulous(ly)?|intricat(e|acies)|commendable|tapestry|testament|pivotal|vibrant|garner(s|ed)?|bolster(s|ed)?|interplay|realm", WARN, "plain verb or cut (3+ distinct on a page blocks)", True),
    ("L5", r"seamless(ly)?|unlock(s|ing)?|unleash(es|ing)?|empower(s|ing)?|elevat(e|es|ing)|supercharg\w*|revolutioni[sz]\w*|game[- ]chang\w*|synerg\w*|holistic|transformative|next[- ]level|effortless(ly)?|paradigm shift", WARN, "name the result and its size", True),
    ("L7", r"best[- ]in[- ]class|world[- ]class|industry[- ]leading|market[- ]leading|cutting[- ]edge|state[- ]of[- ]the[- ]art|unparalleled|unrivall?ed|top[- ]tier|leading provider|next[- ]generation", BLOCK, "drop the superlative or prove it", False),
    ("L8", r"countless|myriad|a plethora of|a (wide|broad) (range|array|variety) of|a host of|numerous|many (companies|organi[sz]ations|clients|businesses)|significantly|dramatically|substantially|drastically", WARN, "give the count, the list or the measured number", True),
    ("L10", r"ai[- ](powered|driven|first|native)|powered by (ai|genai|llms?)|harness(ing)? (the power of )?ai|ai transformation|intelligent automation|harness(ing)? the power", WARN, "name the model, what it does and how it is evaluated", True),
    ("L11", r"actionable insights?|data[- ]driven (decisions?|insights?)|end[- ]to[- ]end (solutions?|services)|tailored solutions?|digital transformation|unlock (the )?value", WARN, "name the deliverable or the decision", True),
    ("L12", r"in today'?s|ever[- ](evolving|changing)|fast[- ]paced (world|environment)|it'?s (important|worth) (to note|noting)|at its core|let'?s (dive|break it down|explore)|dive into|deep dive|in a nutshell|whether you'?re (a|an)\b|look no further|imagine (a world|if)|navigat(e|ing) the complexit", BLOCK, "cut the throat-clearing; start with the claim", False),
    ("L13", r"leverag(e|es|ing)|robust(ly)?|crucial|vital|comprehensive|landscape|journey|ecosystem|streamlin(e|es|ing)|foster(s|ing)?|innovative|stunning|sleek|passionate", WARN, "fine when literal; otherwise a plain word", False),
]
VOCAB_RE = [(rid, re.compile(rf"(?<!\w)(?:{p})", re.I), sev, fix, hero) for rid, p, sev, fix, hero in VOCAB]  # (?<!\w), not \b: L2 starts with "["
DENSITY_RULE = "L4"  # one of these words is noise; three distinct ones on a page is the signal (Kobak et al.)

STRUCTURE: list[tuple[str, re.Pattern[str], str, str]] = [
    ("T1", re.compile(r"\bnot (just|only|merely|simply)\b[^.;:]{1,80}?\bbut( also)?\b|\bisn'?t (just )?about [^.]{1,60}\. ?(it'?s|this is) about\b", re.I), BLOCK, "state the one claim you can back"),
    ("T1b", re.compile(r"\b(it'?s|this is|that'?s) not (about )?\w+[^.;]{0,40}[,;.] ?(it'?s|this is|that'?s)\b", re.I), WARN, "'X, not Y' in one clause, or drop the contrast"),
    ("T4", re.compile(r", (highlighting|underscoring|emphasi[sz]ing|reflecting|showcasing|fostering|empowering|paving the way|contributing to)\b", re.I), WARN, "end the sentence; state the consequence as its own claim"),
    ("T6", re.compile(r"\b(here'?s (the thing|why|how|what)|the (bottom line|best part|truth is)|make no mistake)\b", re.I), BLOCK, "cut the setup line"),
    ("T7", re.compile(r"\b(in (conclusion|summary)|to (sum up|summari[sz]e|wrap up))\b", re.I), BLOCK, "end on a decision or a next step, not a recap"),
    ("T8", re.compile(r"\b(furthermore|moreover|additionally|notably|importantly)\b,", re.I), WARN, "join with 'and', or start a new sentence"),
]
EMOJI = re.compile("[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0001F000-\U0001F2FF\U0001F900-\U0001F9FF]")
# Numbers that need provenance: percentages, money, multipliers, unit-suffixed figures and bare counts.
NUMBER = re.compile(
    r"(?<![\w.#/-])("
    r"[$€£]\s?\d[\d,]*(?:\.\d+)?\s?[KMB]?"
    r"|\d[\d,]*(?:\.\d+)?\s?(?:%|pp\b|x\b|×|ms\b|s\b|h\b|hours?\b|days?\b|weeks?\b|K\b|M\b)"
    r"|\d[\d,]*(?:\.\d+)?"
    r")(?![\w])"
)
ORDINAL_OR_YEAR = re.compile(r"^(1[5-9]\d\d|20\d\d)$")
TITLE_STOP = {"a", "an", "and", "as", "at", "by", "for", "from", "in", "into", "of", "on", "or", "the", "to", "vs", "with"}

BLOCK_TAGS = {"p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "dt", "dd", "td", "th", "figcaption",
              "blockquote", "summary", "label", "button", "title", "caption"}
SKIP_TAGS = {"script", "style", "noscript", "svg", "template", "code", "pre"}


class Page(HTMLParser):
    """Collects text blocks, headings, images and the head metadata of one rendered page."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.blocks: list[tuple[str, str]] = []  # (tag, text)
        self.headings: list[int] = []
        self.imgs_without_alt = 0
        self.meta: dict[str, str] = {}
        self.lang = ""
        self.title = ""
        self._stack: list[tuple[str, list[str]]] = []
        self._skip = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = {k: v or "" for k, v in attrs}
        if tag == "html":
            self.lang = a.get("lang", "")
        if tag == "meta":
            key = a.get("name") or a.get("property")
            if key:
                self.meta[key] = a.get("content", "")
        if tag == "img" and "alt" not in a:
            self.imgs_without_alt += 1
        if tag in SKIP_TAGS:
            self._skip += 1
        if re.fullmatch(r"h[1-6]", tag):
            self.headings.append(int(tag[1]))
        if tag in BLOCK_TAGS:
            self._stack.append((tag, []))
        if tag == "br" and self._stack:
            self._stack[-1][1].append(" ")

    def handle_endtag(self, tag: str) -> None:
        if tag in SKIP_TAGS and self._skip:
            self._skip -= 1
        if tag in BLOCK_TAGS and self._stack and self._stack[-1][0] == tag:
            t, parts = self._stack.pop()
            text = re.sub(r"\s+", " ", "".join(parts)).strip()
            if t == "title":
                self.title = text
            elif text:
                self.blocks.append((t, text))
                if self._stack:  # nested blocks: don't count the text twice in the parent
                    self._stack[-1][1].append(" ")

    def handle_data(self, data: str) -> None:
        if not self._skip and self._stack:
            self._stack[-1][1].append(data)


def is_title_case(s: str) -> bool:
    words = [w for w in re.findall(r"[A-Za-z][\w'-]*", s)]
    content = [w for w in words if w.lower() not in TITLE_STOP]
    return len(content) >= 4 and all(w[0].isupper() for w in content)


def lint_text(where: str, tag: str, text: str, allow: list[dict]) -> list[Finding]:
    out: list[Finding] = []

    def allowed(match: str) -> bool:
        return any(a["phrase"].lower() == match.lower() and a.get("near", "").lower() in text.lower() for a in allow)

    hero_tag = tag in {"h1", "title", "meta"}
    for rid, rx, sev, fix, hero in VOCAB_RE:
        for m in rx.finditer(text):
            if not allowed(m.group(0)):
                out.append(Finding(rid, BLOCK if hero and hero_tag else sev, where, f"'{m.group(0)}' in: {text[:140]}", fix))
    for rid, rx, sev, fix in STRUCTURE:
        for m in rx.finditer(text):
            if not allowed(m.group(0)):
                out.append(Finding(rid, sev, where, f"'{m.group(0)}' in: {text[:140]}", fix))
    dashes = 0 if text.strip() in {"—", "–", "-"} else text.count("—")  # a lone dash is an empty cell
    if dashes >= 2:
        out.append(Finding("T2", BLOCK, where, f"{dashes} em dashes in: {text[:140]}", "split into sentences; a colon for a reason, a comma for an aside"))
    elif dashes == 1:
        out.append(Finding("T2", WARN, where, f"em dash in: {text[:140]}", "colon, comma or full stop reads plainer"))
    if EMOJI.search(text):
        out.append(Finding("T11", BLOCK, where, f"emoji in: {text[:140]}", "remove; use the icon set or words"))
    if re.search(r"[A-Za-z)\]\"']!(\s|$)", text):  # sentence-final only: `!=` and code are not prose
        out.append(Finding("T14", WARN, where, f"exclamation mark in: {text[:140]}", "let the claim carry it"))
    if tag.startswith("h"):
        if text.rstrip().endswith("?"):
            out.append(Finding("T5", BLOCK if tag == "h1" else WARN, where, f"question heading: {text}", "state the answer as the heading"))
        if is_title_case(text):
            out.append(Finding("T9", WARN, where, f"Title Case heading: {text}", "sentence case"))
    return out


def lint_numbers(route: str, tag: str, text: str, context: str, claims: list[dict], seen: set[str]) -> list[Finding]:
    """`context` is the block plus its neighbours: a stat's value and label are often a <dt>/<dd> pair."""
    out: list[Finding] = []
    if tag in {"title", "meta"}:
        return out
    for m in NUMBER.finditer(text):
        tok = m.group(1).strip()
        if ORDINAL_OR_YEAR.match(tok) or re.fullmatch(r"\d{1,2}(st|nd|rd|th)", text[m.start():m.end() + 2]):
            continue
        hit = next(
            (c for c in claims
             if route in c["pages"] and c["value"] == tok and c.get("near", "").lower() in context.lower()),
            None,
        )
        if hit:
            seen.add(hit["id"])
        else:
            out.append(Finding("C01", BLOCK, route, f"'{tok}' has no claim in content/claims.json: {text[:140]}",
                               "add a claim with its source and how to verify it, or cut the number"))
    return out


PRIVATE_TERMS_FILE = ROOT / "scripts" / "private_terms.local.txt"


def norm(term: str) -> str:
    return " ".join(term.lower().split())


def private_terms() -> set[str]:
    """P01's list lives outside the repo: a git-ignored local file or a CI secret. A hash list in a public repo
    is reversible by guessing short names, so the repo holds nothing about them."""
    import os

    raw = os.environ.get("SITE_LINT_PRIVATE_TERMS", "")
    if PRIVATE_TERMS_FILE.exists():
        raw += "\n" + PRIVATE_TERMS_FILE.read_text(encoding="utf-8")
    return {norm(t) for t in raw.splitlines() if t.strip() and not t.lstrip().startswith("#")}


def lint_private(route: str, blocks: list[tuple[str, str]], terms: set[str]) -> list[Finding]:
    """P01: names that must never appear (employer, clients, internal systems)."""
    out: list[Finding] = []
    if not terms:
        return out
    for _, text in blocks:
        words = [w.strip(".'-") for w in re.findall(r"[\w&'.-]+", text.lower())]
        grams = {" ".join(words[i:i + n]) for n in (1, 2, 3) for i in range(len(words) - n + 1)}
        for g in grams:
            if g in terms:
                out.append(Finding("P01", BLOCK, route, "private name on this page (not printed, so logs stay clean)", "remove it; describe by role or a fictional name"))
    return out


def lint_page(route: str, page: Page, cfg: dict, seen: set[str]) -> list[Finding]:
    out: list[Finding] = []
    if any(route == p or (p.endswith("*") and route.startswith(p[:-1])) for p in cfg.get("private_pages", [])):
        out += lint_private(route, [("title", page.title), ("meta", page.meta.get("description", ""))] + page.blocks,
                            cfg.get("_terms", set()))
    if not page.lang:
        out.append(Finding("M01", BLOCK, route, "<html> has no lang", "set lang"))
    if not page.title:
        out.append(Finding("M02", BLOCK, route, "no <title>", "set metadata.title"))
    if not page.meta.get("description"):
        out.append(Finding("M03", BLOCK, route, "no meta description", "set metadata.description: who it is for and what they get"))
    if not page.meta.get("og:image"):
        out.append(Finding("M04", WARN, route, "no og:image", "add opengraph-image so shared links show a preview"))
    h1 = page.headings.count(1)
    if h1 != 1:  # 0 can mean the heading renders client-side; still worth a look
        out.append(Finding("M05", BLOCK if h1 > 1 else WARN, route, f"{h1} <h1> elements in the server HTML", "exactly one h1 per page, rendered on the server"))
    for prev, cur in zip(page.headings, page.headings[1:]):
        if cur > prev + 1:
            out.append(Finding("M06", WARN, route, f"heading jumps h{prev} to h{cur}", "don't skip levels"))
            break
    if page.imgs_without_alt:
        out.append(Finding("M07", BLOCK, route, f"{page.imgs_without_alt} <img> without alt", "alt text, or alt=\"\" if decorative"))
    allow = cfg.get("allow", [])
    provenance = any(route == p or (p.endswith("*") and route.startswith(p[:-1])) for p in cfg.get("provenance_pages", []))
    blocks = [("title", page.title), ("meta", page.meta.get("description", ""))] + page.blocks
    for i, (tag, text) in enumerate(blocks):
        out += lint_text(route, tag, text, allow)
        if provenance:
            context = " ".join(t for _, t in blocks[max(i - 1, 0):i + 2])
            out += lint_numbers(route, tag, text, context, cfg.get("claims", []), seen)
    strong = {f.text.split("'")[1].lower() for f in out if f.rule == DENSITY_RULE}
    if len(strong) >= 3:
        out.append(Finding(DENSITY_RULE, BLOCK, route, f"{len(strong)} distinct strong-signal words: {', '.join(sorted(strong))}", "rewrite those sentences plainly"))
    return out


# ---- Design rules (source) --------------------------------------------------------------
DESIGN: list[tuple[str, re.Pattern[str], str, str, tuple[str, ...]]] = [
    ("D2", re.compile(r"(linear|radial|conic)-gradient\("), WARN, "gradient: flat token colour unless it encodes data", (".css",)),
    ("D3", re.compile(r"background-clip\s*:\s*text|bg-clip-text"), WARN, "gradient text: solid ink", (".css", ".tsx")),
    ("D4", re.compile(r"backdrop-filter\s*:\s*[^;]*blur|box-shadow\s*:[^;]*\b([3-9]\d|\d{3,})px"), WARN, "glass blur or glow: solid surface, --e-1/--e-2 only", (".css",)),
    ("T11", EMOJI, BLOCK, "emoji in source: lucide icon or words", (".tsx", ".ts")),
    ("D10", re.compile(r"\b(animate-bounce|typewriter|marquee)\b"), WARN, "decorative motion", (".tsx", ".css")),
]
SCAFFOLD_FILES = ("next.svg", "vercel.svg", "file.svg", "globe.svg", "window.svg")
SCAFFOLD_TEXT = re.compile(r"Create Next App|Get started by editing|Generated by create next app")


def lint_sources() -> list[Finding]:
    out: list[Finding] = []
    for name in SCAFFOLD_FILES:
        if (WEB / "public" / name).exists():
            out.append(Finding("D1", BLOCK, f"apps/web/public/{name}", "create-next-app leftover", "delete it"))
    for base in ("app", "components", "lib"):
        for f in sorted((WEB / base).rglob("*")):
            if f.suffix not in {".css", ".tsx", ".ts"}:
                continue
            for i, line in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
                if "slop-ok:" in line:  # deliberate, with the reason written on the line
                    continue
                if SCAFFOLD_TEXT.search(line):
                    out.append(Finding("D1", BLOCK, f"{f.relative_to(ROOT).as_posix()}:{i}", line.strip()[:120], "scaffold text: replace"))
                for rid, rx, sev, fix, exts in DESIGN:
                    if f.suffix in exts and rx.search(line):
                        out.append(Finding(rid, sev, f"{f.relative_to(ROOT).as_posix()}:{i}", line.strip()[:120], fix))
    return out


def lint_static_apps(cfg: dict) -> list[Finding]:
    """Client-rendered sub-apps (static_apps in claims.json) have no server HTML to read, so their sources, data and
    built bundle are scanned instead: P01 on everything, the BLOCK copy rules on their own source text."""
    out: list[Finding] = []
    terms = cfg.get("_terms", set())
    for app in cfg.get("static_apps", []):
        for rel in (app["src"], app.get("data"), app.get("dist")):
            if not rel or not (ROOT / rel).exists():
                continue
            for f in sorted((ROOT / rel).rglob("*")):
                if not f.is_file() or f.suffix not in {".ts", ".tsx", ".json", ".js", ".html", ".css", ".md"}:
                    continue
                if rel == app.get("dist") and f.suffix == ".js":
                    continue  # bundled vendor code (file-format tokens); our own text is scanned in src and data
                text = f.read_text(encoding="utf-8", errors="ignore")
                where = f.relative_to(ROOT).as_posix()
                if lint_private(where, [("p", text)], terms):
                    out.append(Finding("P01", BLOCK, where, "private name in this file", "remove it; describe by role or a fictional name"))
                if rel == app["src"] and f.suffix in {".ts", ".tsx"}:
                    for i, line in enumerate(text.splitlines(), 1):
                        for x in lint_text(f"{where}:{i}", "p", line, cfg.get("allow", [])):
                            if x.severity == BLOCK and x.rule not in {"T14"}:
                                out.append(x)
    return out


def route_of(html: Path) -> str:
    rel = html.relative_to(BUILD).with_suffix("").as_posix()
    if rel in {"index", "page"}:
        return "/"
    return "/" + re.sub(r"/(index|page)$", "", rel)


def main(argv: list[str]) -> int:
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8")  # Windows defaults to cp1252, which hides em dashes and emoji
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--text", type=Path, help="lint a draft file instead of the build")
    ap.add_argument("--warn", action="store_true", help="also print WARN findings (always in --json)")
    args = ap.parse_args(argv)

    cfg = json.loads(CLAIMS.read_text(encoding="utf-8")) if CLAIMS.exists() else {}
    cfg["_terms"] = private_terms()
    findings: list[Finding] = []
    if not cfg["_terms"] and (cfg.get("private_pages") or cfg.get("static_apps")):
        findings.append(Finding("P00", WARN, "scripts/private_terms.local.txt", "no private terms configured; P01 did not run",
                                "create the local file, or set SITE_LINT_PRIVATE_TERMS in CI"))
    seen: set[str] = set()

    if args.text:
        terms = cfg["_terms"]
        for i, line in enumerate(args.text.read_text(encoding="utf-8").splitlines(), 1):
            tag = "h2" if line.startswith("#") else "p"
            findings += lint_text(f"{args.text.name}:{i}", tag, line.lstrip("# "), cfg.get("allow", []))
            findings += lint_private(f"{args.text.name}:{i}", [(tag, line)], terms)
    else:
        pages = sorted(p for p in BUILD.rglob("*.html") if not p.name.startswith("_")) if BUILD.exists() else []
        if not pages:
            print("site lint: no rendered pages; run `npm run build` in apps/web first", file=sys.stderr)
            return 2
        for html in pages:
            p = Page()
            p.feed(html.read_text(encoding="utf-8"))
            findings += lint_page(route_of(html), p, cfg, seen)
        findings += lint_sources()
        findings += lint_static_apps(cfg)
        linted = {route_of(h) for h in pages}
        for c in cfg.get("claims", []):
            if c["id"] not in seen and any(pg in linted for pg in c["pages"]):
                findings.append(Finding("C02", WARN, ",".join(c["pages"]), f"claim {c['id']} ({c['value']}) not found on its page",
                                        "remove the stale claim or fix 'near'"))

    blocks = [f for f in findings if f.severity == BLOCK]
    if args.json:
        print(json.dumps([asdict(f) for f in findings], indent=2, ensure_ascii=False))
    else:
        shown = findings if args.warn else blocks
        for f in sorted(shown, key=lambda f: (f.severity != BLOCK, f.where, f.rule)):
            print(f"{f.severity.upper():5} {f.rule} {f.where}  {f.text}\n      fix: {f.fix}")
        warns = len(findings) - len(blocks)
        print(f"site lint: {len(blocks)} block, {warns} warn" + ("" if args.warn else " (--warn to list)"))
    return 1 if blocks else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
