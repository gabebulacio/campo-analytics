"""Synthetic build for the Project Finance Checks dashboard.

Generates raw exports (ERP project summary, hours, OOP, PO lines, per-client trackers,
people directory) with a fixed seed, plants a known number of anomalies per rule,
then computes every project metric from the raw rows and runs the 11 rules
independently. Writes projects/project-finance/snapshot.json
in the shape of snapshot.types.ts next to it, and the React app's
static data folder apps/project-finance/data (index.json, one snapshot per viewer,
detail/index.json + detail/<client>.json) in the shape of apps/project-finance/src/types.ts.

  python projects/project-finance/build.py [--seed 2026] [--out path] [--app-out dir]

Standard library only. Every name and figure is made up.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import random
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent / "snapshot.json"
SEED = 2026
YEAR = 2026
AS_OF = date(2026, 11, 16)
POC_MONTH = "2026-10"
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
POC_COL = f"{MONTHS[int(POC_MONTH[5:]) - 1]}-{str(YEAR)[2:]}"  # "Oct-26"
PREV_COL = f"{MONTHS[int(POC_MONTH[5:]) - 2]}-{str(YEAR)[2:]}"  # "Sep-26"
STALE_DAYS = 7
DONE = {"Closed", "Complete"}

# ---------------------------------------------------------------- reference data

RULES = [
    ("near_cap", "Close to budget cap", "critical",
     "Fee burn is 90% or more and % complete is under 80%",
     "Agree re-phasing or a budget change with the account director", False),
    ("over_sow", "Spend over revised SOW", "critical",
     "Committed spend (fee + OOP + open POs) exceeds the revised SOW",
     "Confirm an approved scope change, or move the time to the right project", False),
    ("zero_rate", "Billable time with no rate", "critical",
     "Billable hours were booked at a $0 rate",
     "Ask the ERP admin to fix the contract rate, then re-rate the entries", False),
    ("missing_tracker", "In the ERP, not in a tracker", "serious",
     "A live project has spend but no row in its client tracker",
     "Add the job to the tracker, or mark it out of scope", False),
    ("sow_vs_erp", "Revised SOW differs from ERP budget", "serious",
     "Tracker revised SOW and ERP budget differ by more than $1 and more than 1%, and the project is not done",
     "Load the approved budget in the ERP, or correct the tracker", False),
    ("implausible_budget", "Implausible ERP budget", "serious",
     "ERP budget is more than 10x the tracker SOW, or more than $10M on one project",
     "Raise with the finance manager; likely a keying error", False),
    ("closed_moving", "Closed project still moving", "serious",
     "Project is closed or complete but has unapproved time or open POs",
     "Clear the open items, or reopen the project", False),
    ("stale_unapproved", "Unapproved time older than 7 days", "warning",
     "Time is submitted or returned and older than 7 days at the extract date",
     "Chase the approver", False),
    ("pct_down", "% complete went down", "warning",
     "% complete is lower than last month, which reverses revenue",
     "Record the reason before month-end sign-off", False),
    ("oop_mismatch", "OOP billable differs from actual", "warning",
     "Billable and actual OOP amounts differ by more than $0.01",
     "Review the markup or pass-through rule", False),
    ("billed_ahead", "Billed ahead of delivery", "warning",
     "Billing to date exceeds actuals by more than 5% and more than $100",
     "Threshold pending: Finance to set the rule per contract type", True),
]
RULE_IDS = [r[0] for r in RULES]

# Planted anomalies per rule: each on its own project, so hits never overlap by construction.
PLANT_COUNTS = {
    "near_cap": 9, "over_sow": 14, "zero_rate": 6, "missing_tracker": 12, "sow_vs_erp": 18,
    "implausible_budget": 4, "closed_moving": 5, "stale_unapproved": 20, "pct_down": 8,
    "oop_mismatch": 3, "billed_ahead": 11,
}

# client -> (projects, tracker family, products)
CLIENTS = {
    "Northwind Health": (58, "standard", ["Veloria", "Corvanta", "Lumiset"]),
    "Contoso Labs": (40, "standard", ["Brevix", "Nalutra"]),
    "Fabrikam Foods": (38, "standard", ["Harvest Crunch", "Oatwise", "Sunmeadow"]),
    "Tailspin Retail": (24, "compact", ["Tailspin Rewards", "Skyline Outlet"]),
}
WORKSTREAMS = [
    "Brand campaign", "Digital refresh", "Field materials", "Conference support", "Always-on social",
    "Market research", "Website build", "Launch planning", "Retainer", "Content hub", "Sales training",
    "Packaging update", "CRM journeys", "Media planning",
]

VIEWERS = [
    ("a-lena", "Lena Marsh", "analyst"), ("a-omar", "Omar Reyes", "analyst"),
    ("a-priya", "Priya Natarajan", "analyst"), ("a-tomas", "Tomas Ferreira", "analyst"),
    ("a-hana", "Hana Kowalski", "analyst"),
    ("m-grace", "Grace Okafor", "manager"), ("m-diego", "Diego Lindqvist", "manager"),
    ("m-ruth", "Ruth Abernathy", "manager"),
    ("d-simon", "Simon Achterberg", "director"), ("d-ines", "Ines Moreau", "director"),
    ("acc-marta", "Marta Velasco", "account"), ("acc-kofi", "Kofi Mensah", "account"),
    ("acc-julia", "Julia Brandt", "account"),
    ("o-sam", "Sam Whitlock", "ops"),
]
ANALYSTS = {"Northwind Health": ["a-lena", "a-omar"], "Contoso Labs": ["a-priya"],
            "Fabrikam Foods": ["a-tomas"], "Tailspin Retail": ["a-hana"]}
MANAGERS = {"Northwind Health": "m-grace", "Contoso Labs": "m-grace",
            "Fabrikam Foods": "m-diego", "Tailspin Retail": "m-ruth"}
ACCOUNTS = {"Northwind Health": "acc-marta", "Contoso Labs": "acc-kofi",
            "Fabrikam Foods": "acc-kofi", "Tailspin Retail": "acc-julia"}
DIRECTORS = {"d-simon": ["Contoso Labs", "Northwind Health"], "d-ines": ["Fabrikam Foods", "Tailspin Retail"]}

WORKERS = [f"Worker {i:02d}" for i in range(1, 41)]
SUPPLIERS = ["Bluefin Print Co", "Northgate Studios", "Pixelwell Media", "Riverbend Events",
             "Quartzline Research", "Harbor Translation", "Lakeside Logistics"]

# Required columns per source: the schema contract checked on read.
SCHEMA = {
    "summary": ["Project ID", "Project Name", "Client", "Product", "Status", "Start Date", "End Date",
                "Labour Budget", "OOP Budget", "Total Budget", "Labour Actuals", "OOP Actuals",
                "Open POs", "Billing", "Analyst", "Manager", "Account Director"],
    "hours": ["Project ID", "Worker", "Date", "Hours", "Billable", "Rate", "Fee Amount", "Status", "Approved On"],
    "oop": ["Project ID", "Transaction", "Date", "Supplier", "Actual Amount", "Billable Amount"],
    "po": ["Project ID", "PO Number", "Line", "Supplier", "Status", "Amount", "Received", "Remaining"],
    "directory": ["Key", "Name", "Role", "Clients"],
}
TRACKER_FAMILIES = {
    "standard": ["Job", "Job Name", "Revised Fee", "Revised OOP", "Revised Total"] + [f"{m}-26" for m in MONTHS],
    "compact": ["Job Number", "Description", "Fee", "OOP", "Total SOW"],
}


def money(x: float) -> float:
    return round(x + 0.0, 2)


def iso(d: date) -> str:
    return d.isoformat()


# ---------------------------------------------------------------- generator


def plan_projects(rng: random.Random) -> list[dict]:
    """Project specs with the anomaly (if any) each one carries."""
    specs = []
    n = 0
    for client, (count, family, products) in CLIENTS.items():
        for _ in range(count):
            n += 1
            specs.append({"id": f"PRJ-{n:04d}", "client": client, "family": family,
                          "product": rng.choice(products), "plant": None, "tweak": None})
    order = list(range(len(specs)))
    rng.shuffle(order)
    free = order[:]

    def take(rule: str, k: int, ok) -> None:
        picked = [i for i in free if ok(specs[i])][:k]
        if len(picked) < k:
            raise SystemExit(f"cannot place {k} plants for {rule}")
        for i in picked:
            specs[i]["plant"] = rule
            free.remove(i)

    std = lambda s: s["family"] == "standard"  # noqa: E731
    take("near_cap", PLANT_COUNTS["near_cap"], std)
    take("pct_down", PLANT_COUNTS["pct_down"], std)
    for rule in RULE_IDS:
        if rule not in ("near_cap", "pct_down"):
            take(rule, PLANT_COUNTS[rule], lambda s: True)
    # Clean edge cases and data-quality tweaks, on projects with no plant.
    for tweak, k in [("not_started", 3), ("revised_tbc", 2), ("done_diff", 3), ("recon_explained", 4),
                     ("recon_review", 4), ("small_diff", 4)]:
        for i in free[:k]:
            specs[i]["tweak"] = tweak
        free = free[k:]
    return specs


def assign_people(specs: list[dict], rng: random.Random) -> None:
    for s in specs:
        s["analyst"] = rng.choice(ANALYSTS[s["client"]])
        s["manager"] = MANAGERS[s["client"]]
        s["account"] = ACCOUNTS[s["client"]]
    ids = list(range(len(specs)))
    rng.shuffle(ids)
    for i in ids[:7]:
        specs[i]["analyst"] = None
    specs[ids[0]]["manager"] = None  # no analyst and no manager: the exception has no owner
    specs[ids[20]]["manager"] = None
    for i in ids[30:33]:
        specs[i]["account"] = None


def gen_dates(rng: random.Random, done: bool) -> tuple[date, date]:
    if done:
        start = date(2025, 9, 1) + timedelta(days=rng.randint(0, 200))
        end = start + timedelta(days=rng.randint(120, 300))
        end = min(end, AS_OF - timedelta(days=rng.randint(10, 60)))
        end = max(end, date(2026, 2, 1))
        return start, end
    start = date(2025, 8, 1) + timedelta(days=rng.randint(0, 400))
    start = min(start, date(2026, 9, 1))
    end = max(start + timedelta(days=rng.randint(180, 420)), AS_OF + timedelta(days=30))
    return start, end


def split(rng: random.Random, total: float, n: int) -> list[float]:
    w = [rng.uniform(0.4, 1.6) for _ in range(n)]
    s = sum(w)
    return [total * x / s for x in w]


def rand_date(rng: random.Random, lo: date, hi: date) -> date:
    if hi <= lo:
        return lo
    return lo + timedelta(days=rng.randint(0, (hi - lo).days))


def generate(seed: int) -> dict:
    rng = random.Random(seed)
    specs = plan_projects(rng)
    assign_people(specs, rng)

    summary, hours, oop, po = [], [], [], []
    trackers: dict[str, list[dict]] = defaultdict(list)
    planted: dict[str, list[str]] = {r: [] for r in RULE_IDS}
    names_used: set[str] = set()

    for s in specs:
        p, tw, pid = s["plant"], s["tweak"], s["id"]
        if p:
            planted[p].append(pid)
        # status
        if p in ("closed_moving", "implausible_budget") or tw == "done_diff":
            status = rng.choice(["Closed", "Complete"])
        elif p in ("stale_unapproved", "near_cap", "pct_down", "sow_vs_erp", "zero_rate") or tw:
            status = "Active"
        else:
            status = rng.choices(["Active", "On Hold", "Complete", "Closed"], [78, 8, 8, 6])[0]
        done = status in DONE
        start, end = gen_dates(rng, done)
        in_tracker = p != "missing_tracker" and tw != "not_started"

        # revised SOW (tracker values)
        total = money(rng.choice([1, 1, 2, 3, 5, 8]) * rng.uniform(30_000, 220_000))
        fee_share = rng.uniform(0.62, 0.92)
        rfee = money(total * fee_share)
        roop = money(total - rfee)

        # targets as shares of the revised values
        pct = round(rng.uniform(0.15, 0.95), 2) if not done else 1.0
        fee_burn = min(0.82, max(0.05, pct * rng.uniform(0.85, 1.05)))
        if done:
            fee_burn = rng.uniform(0.6, 0.82)
        oop_share, po_share = rng.uniform(0.2, 0.6), rng.uniform(0.0, 0.25)
        pct_prev = round(max(0.0, pct - rng.choice([0, 0, 0.05, 0.1, 0.15])), 2)
        if p == "near_cap":
            pct = round(rng.uniform(0.3, 0.72), 2)
            pct_prev = round(pct - 0.05, 2)
            fee_burn = rng.uniform(0.92, 0.98)
        elif p == "pct_down":
            pct = min(pct, 0.8)
            pct_prev = round(pct + rng.choice([0.05, 0.1, 0.15]), 2)
        elif p == "over_sow":
            if s["family"] == "standard" and rng.random() < 0.5:
                pct = round(rng.uniform(0.85, 0.98), 2)
                pct_prev = round(pct - 0.03, 2)
                fee_burn = rng.uniform(1.08, 1.25)
                need = (1 - fee_burn * fee_share) / (1 - fee_share)  # OOP share that brings spend to the SOW
                oop_share = max(0.1, need + rng.uniform(0.08, 0.3))
            else:  # OOP over-run on a normal fee burn
                po_share = rng.uniform(0.0, 0.1)
                oop_share = (1 - fee_burn * fee_share) / (1 - fee_share) * rng.uniform(1.15, 1.6)
        if s["family"] == "compact":
            pct = pct_prev = None

        fee_target = rfee * fee_burn
        oop_target = roop * oop_share
        po_target = roop * po_share
        if tw == "not_started":
            fee_target = oop_target = po_target = 0.0

        # time entries
        rates = [rng.choice([95, 120, 145, 170, 210, 260]) for _ in range(4)]
        unappr_share = 0.0 if done else rng.uniform(0.0, 0.06)
        if p == "closed_moving" and rng.random() < 0.6:
            unappr_share = rng.uniform(0.03, 0.08)
        if p == "stale_unapproved":
            unappr_share = rng.uniform(0.04, 0.12)
        n_entries = 0 if fee_target == 0 else rng.randint(14, 40)
        entry_lo = max(start, date(YEAR - 1, 7, 1))
        entry_hi = min(end, AS_OF)
        fees = split(rng, fee_target, n_entries) if n_entries else []
        n_unappr = max(1, round(n_entries * unappr_share)) if unappr_share else 0
        n_zero = rng.randint(1, 3) if p == "zero_rate" else 0
        explained_left = rng.randint(1, 2) if tw == "recon_explained" else 0
        for k, f in enumerate(fees):
            rate = rng.choice(rates)
            hrs = round(f / rate, 2)
            st, d, appr_on = "Approved", rand_date(rng, entry_lo, entry_hi - timedelta(days=3)), None
            if k < n_unappr:
                st = rng.choice(["Submitted", "Submitted", "Returned"])
                if p == "stale_unapproved" and k < 2:
                    d = rand_date(rng, max(entry_lo, entry_hi - timedelta(days=60)), AS_OF - timedelta(days=STALE_DAYS + 2))
                else:
                    d = AS_OF - timedelta(days=rng.randint(0, STALE_DAYS - 1))
            else:
                appr_on = min(AS_OF - timedelta(days=1), d + timedelta(days=rng.randint(1, 6)))
                if explained_left and k >= n_entries - explained_left:
                    appr_on = AS_OF  # approved after the summary extract ran
            hours.append({"Project ID": pid, "Worker": rng.choice(WORKERS), "Date": iso(d), "Hours": hrs,
                          "Billable": "Yes", "Rate": rate, "Fee Amount": money(hrs * rate), "Status": st,
                          "Approved On": iso(appr_on) if appr_on else ""})
        if n_entries:
            for _ in range(rng.randint(0, 3)):  # internal, non-billable time at no rate: never a hit
                hours.append({"Project ID": pid, "Worker": rng.choice(WORKERS),
                              "Date": iso(rand_date(rng, entry_lo, entry_hi - timedelta(days=3))),
                              "Hours": round(rng.uniform(1, 6), 2), "Billable": "No", "Rate": 0,
                              "Fee Amount": 0.0, "Status": "Approved", "Approved On": iso(AS_OF - timedelta(days=2))})
        for _ in range(n_zero):
            d = rand_date(rng, entry_lo, entry_hi - timedelta(days=3))
            hours.append({"Project ID": pid, "Worker": rng.choice(WORKERS), "Date": iso(d),
                          "Hours": round(rng.uniform(2, 16), 2), "Billable": "Yes", "Rate": 0, "Fee Amount": 0.0,
                          "Status": "Approved", "Approved On": iso(min(AS_OF - timedelta(days=1), d + timedelta(days=2)))})

        # OOP lines
        n_oop = 0 if oop_target == 0 else rng.randint(2, 8)
        for k, a in enumerate(split(rng, oop_target, n_oop) if n_oop else []):
            a = money(a)
            billable = a
            if p == "oop_mismatch" and k == 0:
                billable = money(a * rng.choice([1.05, 1.1, 1.15]))
            oop.append({"Project ID": pid, "Transaction": f"OOP-{len(oop) + 1:05d}",
                        "Date": iso(rand_date(rng, entry_lo, entry_hi)), "Supplier": rng.choice(SUPPLIERS),
                        "Actual Amount": a, "Billable Amount": billable})

        # PO lines: open lines carry the remaining commitment; done projects only have closed lines
        po_no = f"PO-{70000 + int(pid[4:]) * 3}"
        line = 0
        open_needed = po_target if not done else 0.0
        if p == "closed_moving" and unappr_share == 0:
            open_needed = money(roop * rng.uniform(0.05, 0.2))
        if open_needed > 0:
            for amt in split(rng, open_needed, rng.randint(1, 3)):
                line += 1
                full = money(amt * rng.uniform(1.2, 2.0))
                rem = money(amt)
                po.append({"Project ID": pid, "PO Number": po_no, "Line": line, "Supplier": rng.choice(SUPPLIERS),
                           "Status": rng.choice(["Open", "Partially Received"]), "Amount": full,
                           "Received": money(full - rem), "Remaining": rem})
        for _ in range(rng.randint(0, 2)):
            line += 1
            full = money(rng.uniform(2_000, 20_000))
            st = rng.choice(["Closed", "Closed", "Canceled"])
            po.append({"Project ID": pid, "PO Number": po_no, "Line": line, "Supplier": rng.choice(SUPPLIERS),
                       "Status": st, "Amount": full, "Received": full if st == "Closed" else 0.0,
                       "Remaining": money(full * rng.uniform(0.1, 0.5))})  # leftover on closed lines never counts

        # ERP budget
        erp_fee, erp_oop = rfee, roop
        if p == "sow_vs_erp" or tw == "done_diff":
            f = rng.choice([-1, 1]) * rng.uniform(0.03, 0.4)
            erp_fee = money(rfee * (1 + f))
        elif tw == "small_diff":
            erp_fee = money(rfee * (1 + rng.uniform(0.001, 0.008)))  # within 1%: not a hit
        elif p == "implausible_budget":
            if len(planted[p]) == 1:  # one over $10M without being 10x the SOW
                rfee, roop = money(1_350_000 * fee_share), money(1_350_000 * (1 - fee_share))
                total = money(rfee + roop)
                fee_target, erp_fee = rfee * fee_burn, money(rng.uniform(10_500_000, 12_500_000))
                scale_fee_rows(hours, pid, fee_target)
            else:
                erp_fee = money(total * rng.choice([10.5, 12, 40]))
        erp_total = money(erp_fee + erp_oop)

        # ERP labour actuals = approved time, as the summary extract saw it
        rows = [h for h in hours if h["Project ID"] == pid]
        approved = sum(h["Fee Amount"] for h in rows if h["Status"] == "Approved")
        late = sum(h["Fee Amount"] for h in rows if h["Status"] == "Approved" and h["Approved On"] == iso(AS_OF))
        labour = money(approved - late)
        if tw == "recon_review":
            labour = money(approved * (1 + rng.choice([-1, 1]) * rng.uniform(0.01, 0.035)))
        unappr = sum(h["Fee Amount"] for h in rows if h["Status"] != "Approved")
        oop_act = money(sum(o["Actual Amount"] for o in oop if o["Project ID"] == pid))
        actuals = labour + unappr + oop_act
        billing = money(actuals * rng.uniform(0.55, 0.98))
        if p == "billed_ahead":
            billing = money(actuals * rng.uniform(1.12, 1.45) + 500)
        if tw == "not_started":
            billing = 0.0

        name = f"{s['product']} {rng.choice(WORKSTREAMS).lower()}"
        while name in names_used:
            name = f"{s['product']} {rng.choice(WORKSTREAMS).lower()} {rng.randint(2, 9)}"
        names_used.add(name)
        summary.append({
            "Project ID": pid, "Project Name": name, "Client": s["client"], "Product": s["product"],
            "Status": status, "Start Date": iso(start), "End Date": iso(end),
            "Labour Budget": erp_fee, "OOP Budget": erp_oop, "Total Budget": erp_total,
            "Labour Actuals": labour, "OOP Actuals": oop_act,
            "Open POs": money(sum(x["Remaining"] for x in po if x["Project ID"] == pid
                                  and x["Status"] not in ("Closed", "Canceled"))),
            "Billing": billing, "Analyst": s["analyst"] or "", "Manager": s["manager"] or "",
            "Account Director": s["account"] or "",
        })

        if in_tracker:
            trackers[s["client"]].append(tracker_row(rng, s["family"], pid, name, rfee, roop, total,
                                                     pct, pct_prev, tw == "revised_tbc"))

    for client, (_, family, products) in CLIENTS.items():  # rows for jobs that are not live this year
        for k in range(rng.choice([1, 2, 3])):
            trackers[client].append(tracker_row(rng, family, f"PRJ-9{len(trackers[client]):03d}",
                                                f"{products[0]} archive job {k + 1}", 20_000.0, 5_000.0,
                                                25_000.0, 1.0, 1.0, False))

    directory = [{"Key": k, "Name": n, "Role": r, "Clients": ""} for k, n, r in VIEWERS]
    # Schema drift: a re-run of the hours export arrives with a renamed column.
    rerun = [{("Fee Amt" if c == "Fee Amount" else c): v for c, v in h.items()} for h in hours[:640]]
    files = [
        {"name": "Project summary export", "kind": "erp", "schema": "summary", "rows": summary},
        {"name": "Hours export", "kind": "erp", "schema": "hours", "rows": hours},
        {"name": "Hours export (re-run)", "kind": "erp", "schema": "hours", "rows": rerun},
        {"name": "OOP export", "kind": "erp", "schema": "oop", "rows": oop},
        {"name": "PO lines export", "kind": "erp", "schema": "po", "rows": po},
        *[{"name": f"Tracker: {c}", "kind": "tracker", "schema": "tracker", "client": c, "rows": trackers[c]}
          for c in CLIENTS],
        {"name": "People directory", "kind": "directory", "schema": "directory", "rows": directory},
    ]
    return {"files": files, "planted": planted, "specs": specs}


def scale_fee_rows(hours: list[dict], pid: str, target: float) -> None:
    rows = [h for h in hours if h["Project ID"] == pid and h["Fee Amount"] > 0]
    cur = sum(h["Fee Amount"] for h in rows)
    if not cur:
        return
    for h in rows:
        h["Hours"] = round(h["Hours"] * target / cur, 2)
        h["Fee Amount"] = money(h["Hours"] * h["Rate"])


def tracker_row(rng, family, pid, name, rfee, roop, total, pct, pct_prev, tbc) -> dict:
    if family == "standard":
        row = {"Job": pid, "Job Name": name, "Revised Fee": rfee, "Revised OOP": roop,
               "Revised Total": "TBC" if tbc else total}
        poc_i = int(POC_MONTH[5:]) - 1
        for i, m in enumerate(MONTHS):
            col = f"{m}-26"
            if i == poc_i:
                v = pct
            elif i == poc_i - 1:
                v = pct_prev
            elif i < poc_i - 1:
                v = round((pct_prev or 0) * (i + 1) / poc_i, 2)
            else:  # forecast cells the analysts pre-fill; never read
                v = round(min(1.0, (pct or 0) + 0.08 * (i - poc_i)), 2)
            row[col] = f"{round(v * 100)}%" if v is not None else ""
        return row
    return {"Job Number": pid, "Description": name, "Fee": rfee, "OOP": roop,
            "Total SOW": "TBC" if tbc else total}


# ---------------------------------------------------------------- load + compute


def load(files: list[dict]) -> tuple[dict, list[dict], dict]:
    """Schema contract: reject a file missing a required column; keep the rest."""
    data: dict = {"tracker": {}}
    sources = []
    for f in files:
        cols = set(f["rows"][0]) if f["rows"] else set()
        if f["schema"] == "tracker":
            family = next((fam for fam, req in TRACKER_FAMILIES.items() if set(req[:5]) <= cols), None)
            missing = [] if family else ["Revised Total"]
        else:
            family = None
            missing = [c for c in SCHEMA[f["schema"]] if c not in cols]
        src = {"name": f["name"], "kind": f["kind"], "status": "accepted", "rows": len(f["rows"])}
        if missing:
            src["status"] = "rejected"
            src["reason"] = f"missing column '{missing[0]}'; the last good file stays loaded"
        elif f["schema"] == "tracker":
            data["tracker"][f["client"]] = (family, f["rows"])
        else:
            data[f["schema"]] = f["rows"]
        sources.append(src)
    parse = parse_trackers(data["tracker"])
    return data, sources, parse


def num(v) -> float | None:
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(str(v).replace(",", "").replace("$", ""))
    except ValueError:
        return None


def pct_val(v) -> float | None:
    if v in (None, ""):
        return None
    try:
        return round(float(str(v).rstrip("%")) / 100, 4)
    except ValueError:
        return None


def parse_trackers(trackers: dict) -> dict:
    by_job, rows_n, revised_ok, pct_ok = {}, 0, 0, 0
    for family, rows in trackers.values():
        for r in rows:
            rows_n += 1
            if family == "standard":
                job, fee, oop, tot = r["Job"], num(r["Revised Fee"]), num(r["Revised OOP"]), num(r["Revised Total"])
                pct, prev = pct_val(r.get(POC_COL)), pct_val(r.get(PREV_COL))
            else:
                job, fee, oop, tot = r["Job Number"], num(r["Fee"]), num(r["OOP"]), num(r["Total SOW"])
                pct = prev = None
            revised_ok += tot is not None
            pct_ok += pct is not None
            by_job[job] = {"fee": fee, "oop": oop, "total": tot, "pct": pct, "prev": prev}
    return {"by_job": by_job, "tracker_rows": rows_n, "revised_parsed": round(revised_ok / rows_n, 4),
            "pct_parsed": round(pct_ok / rows_n, 4)}


def compute(data: dict, parse: dict) -> tuple[list[dict], dict, dict]:
    hours_by, oop_by, po_by = defaultdict(list), defaultdict(list), defaultdict(list)
    for h in data["hours"]:
        hours_by[h["Project ID"]].append(h)
    for o in data["oop"]:
        oop_by[o["Project ID"]].append(o)
    for x in data["po"]:
        po_by[x["Project ID"]].append(x)
    projects, recon, extra = [], {"projects": 0, "matched": 0, "explained": 0, "for_review": 0}, {}
    for s in data["summary"]:
        pid = s["Project ID"]
        hrs = hours_by[pid]
        approved = sum(h["Fee Amount"] for h in hrs if h["Status"] == "Approved")
        unapproved = money(sum(h["Fee Amount"] for h in hrs if h["Status"] != "Approved"))
        labour = s["Labour Actuals"]
        if hrs:
            recon["projects"] += 1
            diff = round(approved - labour, 2)
            late = round(sum(h["Fee Amount"] for h in hrs if h["Status"] == "Approved"
                             and h["Approved On"] == iso(AS_OF)), 2)
            if abs(diff) <= 0.01:
                recon["matched"] += 1
            elif abs(diff - late) <= 0.01:
                recon["explained"] += 1  # approved after the summary extract: timing only
            else:
                recon["for_review"] += 1
        fee_actuals = money(labour + unapproved)
        oop_actuals = money(sum(o["Actual Amount"] for o in oop_by[pid]))
        oop_billable = money(sum(o["Billable Amount"] for o in oop_by[pid]))
        open_po = money(sum(x["Remaining"] for x in po_by[pid] if x["Status"] not in ("Closed", "Canceled")))
        committed = money(fee_actuals + oop_actuals + open_po)
        t = parse["by_job"].get(pid)
        in_tracker = t is not None
        erp_budget = s["Total Budget"]
        if t and t["total"] is not None:
            source, revised, revised_fee, tracker_total = "tracker", t["total"], t["fee"], t["total"]
        else:
            source, revised, revised_fee, tracker_total = "erp", erp_budget, s["Labour Budget"], None
        fee_by_month = [0.0] * 12
        for h in hrs:
            if h["Date"].startswith(str(YEAR)):
                fee_by_month[int(h["Date"][5:7]) - 1] += h["Fee Amount"]
        billing = s["Billing"]
        projects.append({
            "id": pid, "name": s["Project Name"], "client": s["Client"], "product": s["Product"],
            "status": s["Status"], "start": s["Start Date"], "end": s["End Date"],
            "analyst": s["Analyst"] or None, "manager": s["Manager"] or None, "account": s["Account Director"] or None,
            "in_tracker": in_tracker, "budget_source": source,
            "revised": money(revised), "revised_fee": money(revised_fee), "erp_budget": money(erp_budget),
            "fee_actuals": fee_actuals, "oop_actuals": oop_actuals, "open_po": open_po, "committed": committed,
            "remaining": money(revised - committed),
            "burn": round(committed / revised, 4) if revised else None,
            "fee_burn": round(fee_actuals / revised_fee, 4) if revised_fee else None,
            "pct_complete": t["pct"] if t else None, "pct_prev": t["prev"] if t else None,
            "billing": billing, "unbilled": money(fee_actuals + oop_actuals - billing),
            "unapproved_fee": unapproved, "fee_by_month": [money(x) for x in fee_by_month],
        })
        extra[pid] = {"hours": hrs, "oop_billable": oop_billable, "tracker_total": tracker_total}
    return projects, recon, extra


# ---------------------------------------------------------------- rules


def pc(x: float | None) -> str:
    return f"{x * 100:.0f}%" if x is not None else "n/a"


def usd(x: float) -> str:
    return f"${x:,.0f}"


def run_rules(projects: list[dict], extra: dict) -> list[dict]:
    hits = []

    def hit(rule, p, amount, detail):
        hits.append({"rule": rule, "project_id": p["id"], "owner": p["analyst"] or p["manager"],
                     "amount": money(amount), "detail": detail})

    for p in projects:
        x = extra[p["id"]]
        done = p["status"] in DONE
        if p["fee_burn"] is not None and p["pct_complete"] is not None \
                and p["fee_burn"] >= 0.9 and p["pct_complete"] < 0.8:
            hit("near_cap", p, p["committed"],
                f"Fee burn {pc(p['fee_burn'])} against {pc(p['pct_complete'])} complete")
        if p["committed"] > p["revised"]:
            hit("over_sow", p, p["committed"] - p["revised"],
                f"Committed {usd(p['committed'])} is {usd(p['committed'] - p['revised'])} over the revised SOW of {usd(p['revised'])}")
        zero = [h for h in x["hours"] if h["Billable"] == "Yes" and h["Hours"] > 0 and h["Rate"] == 0]
        if zero:
            rated = [h["Rate"] for h in x["hours"] if h["Rate"] > 0]
            typical = sorted(rated)[len(rated) // 2] if rated else 0
            hrs = sum(h["Hours"] for h in zero)
            hit("zero_rate", p, hrs * typical, f"{hrs:.1f} billable hours on {len(zero)} entries at a $0 rate")
        if not p["in_tracker"] and p["committed"] > 0:
            hit("missing_tracker", p, p["committed"], f"{usd(p['committed'])} committed and no tracker row")
        if x["tracker_total"] is not None and not done:
            d = abs(x["tracker_total"] - p["erp_budget"])
            if d > 1 and d > 0.01 * p["erp_budget"]:
                hit("sow_vs_erp", p, d,
                    f"Tracker SOW {usd(x['tracker_total'])} vs ERP budget {usd(p['erp_budget'])}")
        tt = x["tracker_total"]
        if (tt and p["erp_budget"] > 10 * tt) or p["erp_budget"] > 10_000_000:
            hit("implausible_budget", p, p["erp_budget"],
                f"ERP budget {usd(p['erp_budget'])}" + (f" is {p['erp_budget'] / tt:.1f}x the tracker SOW" if tt else ""))
        if done and (p["unapproved_fee"] > 0 or p["open_po"] > 0):
            hit("closed_moving", p, p["unapproved_fee"] + p["open_po"],
                f"{p['status']} with {usd(p['unapproved_fee'])} unapproved time and {usd(p['open_po'])} open POs")
        stale = [h for h in x["hours"] if h["Status"] in ("Submitted", "Returned")
                 and (AS_OF - date.fromisoformat(h["Date"])).days > STALE_DAYS]
        if stale:
            oldest = min(h["Date"] for h in stale)
            hit("stale_unapproved", p, sum(h["Fee Amount"] for h in stale),
                f"{len(stale)} entries unapproved, oldest dated {oldest}")
        if p["pct_complete"] is not None and p["pct_prev"] is not None and p["pct_complete"] < p["pct_prev"]:
            hit("pct_down", p, p["revised_fee"] * (p["pct_prev"] - p["pct_complete"]),
                f"% complete fell from {pc(p['pct_prev'])} to {pc(p['pct_complete'])}")
        if abs(x["oop_billable"] - p["oop_actuals"]) > 0.01:
            hit("oop_mismatch", p, abs(x["oop_billable"] - p["oop_actuals"]),
                f"OOP billable {usd(x['oop_billable'])} vs actual {usd(p['oop_actuals'])}")
        act = p["fee_actuals"] + p["oop_actuals"]
        if p["billing"] > 1.05 * act and p["billing"] - act > 100:
            hit("billed_ahead", p, p["billing"] - act, f"Billed {usd(p['billing'])} against {usd(act)} of actuals")
    return hits


# ---------------------------------------------------------------- snapshot


def build(seed: int = SEED, generated_at: str | None = None) -> dict:
    gen = generate(seed)
    data, sources, parse = load(gen["files"])
    projects, recon, extra = compute(data, parse)
    exceptions = run_rules(projects, extra)
    found: dict[str, set] = defaultdict(set)
    for e in exceptions:
        found[e["rule"]].add(e["project_id"])

    viewers = []
    for key, name, role in VIEWERS:
        if role == "director":
            clients = DIRECTORS[key]
        elif role == "ops":
            clients = list(CLIENTS)
        else:
            field = {"analyst": "analyst", "manager": "manager", "account": "account"}[role]
            clients = sorted({p["client"] for p in projects if p[field] == key})
        viewers.append({"key": key, "name": name, "role": role, "clients": sorted(clients)})

    return {
        "meta": {"generated_at": generated_at or datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
                 "seed": seed, "as_of": iso(AS_OF), "poc_month": POC_MONTH, "year": YEAR},
        "rules": [{"id": r, "n": i + 1, "label": lab, "severity": sev, "fires_when": fw, "next_step": ns,
                   "hidden": hid} for i, (r, lab, sev, fw, ns, hid) in enumerate(RULES)],
        "viewers": viewers,
        "projects": projects,
        "exceptions": exceptions,
        "health": {
            "sources": sources,
            "parse": {k: parse[k] for k in ("tracker_rows", "revised_parsed", "pct_parsed")},
            "reconciliation": recon,
            "unassigned": {k: sum(1 for p in projects if p[k] is None) for k in ("analyst", "manager", "account")},
        },
        "planted": {r: {"planted": len(gen["planted"][r]), "found": len(found[r])} for r in RULE_IDS},
        "_planted_ids": {r: sorted(gen["planted"][r]) for r in RULE_IDS},
        "_ctx": {"files": gen["files"], "data": data, "sources": sources, "parse": parse, "recon": recon,
                 "extra": extra},
    }


# ---------------------------------------------------------------- app export (apps/project-finance/data)
# The ported React app reads a static data folder: index.json (viewers), one snapshot per viewer, and
# detail/index.json + detail/<client>.json for the "all source fields" panel. Shapes follow the app's types.ts.

APP_OUT = ROOT / "apps" / "project-finance" / "data"
APP_RULE = {"zero_rate": "zero_rate_billable", "missing_tracker": "missing_from_tracker",
            "sow_vs_erp": "sow_vs_erp", "oop_mismatch": "oop_billable_mismatch"}
APP_ROLE = {"analyst": "CFA", "manager": "CFM", "director": "Director", "account": "AD", "ops": "Platform owner"}
GROUP_DIRECTOR = "Noor Halvorsen"  # one Group Director over the whole book
PMS = ["Avery Quinn", "Jonah Pike", "Mira Solberg", "Felix Ortega", "Leah Duarte", "Ravi Castell",
       "Ingrid Paulsen", "Tobias Wren"]
HEALTH_ROLES = {"Platform owner", "CFM", "CFA"}
LEVELS = {0: "(no rate)", 95: "Level 1", 120: "Level 2", 145: "Level 3", 170: "Level 4", 210: "Level 5", 260: "Level 6"}
EXTRACT = iso(AS_OF)
ERP_DIR = f"ERP exports/{EXTRACT[:7]}"
ERP_FILES = {  # source name -> file name in the shared folder
    "Project summary export": f"erp_project_summary_{EXTRACT}.csv",
    "Hours export": f"erp_hours_{EXTRACT}.csv",
    "Hours export (re-run)": f"erp_hours_{EXTRACT}_rerun.csv",
    "OOP export": f"erp_oop_{EXTRACT}.csv",
    "PO lines export": f"erp_po_lines_{EXTRACT}.csv",
    "People directory": "people_directory.csv",
}
ERP_KIND = {"summary": "ERP: Project summary", "hours": "ERP: Hours", "oop": "ERP: OOP actuals",
            "po": "ERP: PO lines", "directory": "People directory"}
TRACKER_TAB = f"{YEAR} Jobs"
MONTH_COLS = [f"{m}-{str(YEAR)[2:]}" for m in MONTHS]
SUMMARY_GROUPS = {"Labour Budget": "Labour (fee)", "Labour Actuals": "Labour (fee)", "OOP Budget": "OOP / supplier",
                  "OOP Actuals": "OOP / supplier", "Open POs": "OOP / supplier", "Total Budget": "Summary",
                  "Billing": "Summary"}
PEOPLE_COLS = {"Analyst", "Manager", "Account Director"}


def slug(s: str) -> str:
    return "-".join("".join(c if c.isalnum() else " " for c in s.lower()).split())


def client_meta() -> dict[str, dict]:
    out = {}
    for i, c in enumerate(CLIENTS):
        folder = f"P{i + 1} - {c}"
        tracker = f"tracker_{slug(c)}_{YEAR}.xlsx"
        out[c] = {"code": f"CL{i + 1:02d} {c}", "short": f"CL{i + 1:02d}", "portfolio": f"P{i + 1}", "folder": folder,
                  "tracker": tracker, "tracker_path": f"{folder}/Trackers/{tracker}"}
    return out


def csv_bytes(rows: list[dict]) -> int:
    if not rows:
        return 0
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=list(rows[0]))
    w.writeheader()
    w.writerows(rows)
    return len(buf.getvalue().encode("utf-8"))


def file_path(name: str) -> str:
    return f"{'Shared/People' if name == 'People directory' else ERP_DIR}/{ERP_FILES[name]}"


def source_status(src: dict) -> str:
    return "accepted" if src["status"] == "accepted" else f"rejected: {src['reason']}"


def app_catalog(files: list[dict], sources: list[dict], cm: dict, role_rows: int) -> list[dict]:
    """One entry per synthetic source file: where it sits, what it is, and whether the build reads it."""
    all_clients = sorted(CLIENTS)
    out = []

    def add(path, kind, nbytes, as_of, st, rows, projects, clients, sheets=(), tabs=()):
        parts = path.split("/")
        out.append({"id": hashlib.sha1(path.encode("utf-8")).hexdigest()[:12], "path": path,
                    "portfolio": parts[0].split(" - ")[0] if " - " in parts[0] else "",
                    "folder": "/".join(parts[:-1]), "name": parts[-1], "kind": kind,
                    "ext": parts[-1].rsplit(".", 1)[1], "bytes": nbytes, "as_of": as_of, "status": st,
                    "rows": rows, "projects": projects, "clients": clients, "sheets": list(sheets), "tabs_read": list(tabs)})

    for f, src in zip(files, sources):
        ids = {r.get("Project ID") or r.get("Job") or r.get("Job Number") for r in f["rows"]} - {None}
        st = "read" if src["status"] == "accepted" else source_status(src)
        if f["kind"] == "tracker":
            c = f["client"]
            add(cm[c]["tracker_path"], "Client tracker", 14_000 + 210 * len(f["rows"]), None, st, len(f["rows"]),
                len(ids), [c], [TRACKER_TAB, "Archive", "Notes", "Lists"], [TRACKER_TAB])
        else:
            directory = f["kind"] == "directory"
            add(file_path(f["name"]), ERP_KIND[f["schema"]], csv_bytes(f["rows"]), None if directory else EXTRACT,
                st, len(f["rows"]), len(ids), [] if directory else all_clients)
    add("Shared/People/role_map_2026.xlsx", "Role map", 11_500 + 160 * role_rows, None, "read", role_rows, 0,
        all_clients, ["Role map", "Lookups"], ["Role map"])
    for c, m in cm.items():  # month-end workbooks the build does not read yet
        add(f"{m['folder']}/Month end/poc_report_{POC_MONTH}.xlsx", "Month-end POC report", 48_000 + 900 * len(c),
            f"{POC_MONTH}-31", "not read yet: layout not in scope", 0, 0, [c], ["Summary", "POC", "Pivot"])
    return sorted(out, key=lambda e: e["path"])


def role_map(rng: random.Random) -> dict:
    """Synthetic role workbook: one row per client and product; two rows miss their associate director."""
    rows = [(c, prod) for c, (_, _, products) in CLIENTS.items() for prod in products]
    return {"rows": len(rows), "ad_blank": len(set(rng.sample(range(len(rows)), 2))), "gd_blank": 0}


def app_project(p: dict, names: dict, cm: dict, pm: str, contract: str) -> dict:
    c = cm[p["client"]]
    pct, prev = p["pct_complete"], p["pct_prev"]
    return {
        "id": p["id"], "name": f"{p['id']} {p['name']}", "client": c["code"], "client_name": p["client"],
        "product": p["product"], "portfolio": c["portfolio"], "status": p["status"], "contract": contract,
        "start": p["start"], "end": p["end"], "ad": names.get(p["account"]), "cfa": names.get(p["analyst"]),
        "cfm": names.get(p["manager"]), "pm": pm, "tracker": c["tracker"] if p["in_tracker"] else None,
        "family": CLIENTS[p["client"]][1] if p["in_tracker"] else None,
        "budget_source": p["budget_source"],  # "tracker" or "erp"
        "revised": p["revised"], "revised_fee": p["revised_fee"], "wd_budget": p["erp_budget"],
        "fee_actuals": p["fee_actuals"], "oop_actuals": p["oop_actuals"], "open_po": p["open_po"],
        "committed": p["committed"], "remaining": p["remaining"], "burn": p["burn"], "fee_burn": p["fee_burn"],
        "pct_complete": pct, "pct_prev": prev,
        "jtd_revenue": money(p["revised_fee"] * pct) if pct is not None else None,
        "mtd_revenue": money(p["revised_fee"] * (pct - (prev or 0))) if pct is not None else None,
        "billing": p["billing"], "unbilled": p["unbilled"], "unapproved_fee": p["unapproved_fee"],
        "fee_by_month_2026": p["fee_by_month"],
    }


def app_reference(rule: str, x: dict) -> str:
    if rule == "zero_rate":
        n = sum(1 for h in x["hours"] if h["Billable"] == "Yes" and h["Hours"] > 0 and h["Rate"] == 0)
        return f"{n} entries"
    if rule == "stale_unapproved":
        n = sum(1 for h in x["hours"] if h["Status"] in ("Submitted", "Returned")
                and (AS_OF - date.fromisoformat(h["Date"])).days > STALE_DAYS)
        return f"{n} entries"
    if rule == "oop_mismatch":
        return f"{sum(1 for o in x['oop'] if abs(o['Billable Amount'] - o['Actual Amount']) > 0.01)} lines"
    return ""


def app_detail(s: dict, x: dict, trow: dict | None, names: dict, cm: dict) -> dict:
    """Every field the synthetic source files hold for one project. Worker names stay out (hours by level)."""
    fields = []
    for k, v in s.items():
        if k in PEOPLE_COLS:
            v = names.get(v) or ""
        if v not in ("", None):
            fields.append([SUMMARY_GROUPS.get(k, "Project information"), k, v])
    tracker = None
    if trow is not None:
        tf, poc_i = [], int(POC_MONTH[5:]) - 1
        for k, v in trow.items():
            if k in MONTH_COLS:
                pv = pct_val(v)
                if pv is None:
                    continue
                tf.append([f"{YEAR} phasing", f"{k} % Complete", pv])
                i = MONTH_COLS.index(k)
                if i <= poc_i:
                    before = (pct_val(trow.get(MONTH_COLS[i - 1])) or 0.0) if i else 0.0
                    tf.append([f"{YEAR} phasing", f"{k} JTD Revenue", money(trow["Revised Fee"] * pv)])
                    tf.append([f"{YEAR} phasing", f"{k} MTD Revenue", money(trow["Revised Fee"] * (pv - before))])
            elif v not in ("", None):
                tf.append(["Job" if k in ("Job", "Job Name", "Job Number", "Description") else "Revised SOW", k, v])
        tracker = {"file": cm[s["Client"]]["tracker_path"], "tab": TRACKER_TAB, "fields": tf}
    agg: dict[tuple, list[float]] = {}
    for h in x["hours"]:
        a = agg.setdefault((LEVELS.get(h["Rate"], "Other"), h["Status"]), [0.0, 0.0, 0.0])
        a[0] += h["Hours"]
        a[1] += h["Hours"] if h["Billable"] == "Yes" else 0.0
        a[2] += h["Fee Amount"]
    hrows = [[lv, st, round(a[0], 2), round(a[1], 2), money(a[2])] for (lv, st), a in sorted(agg.items())]

    def lines(rows: list[dict], name: str) -> dict:
        if not rows:
            return {"columns": [], "rows": [], "total": 0, "file": None}
        cols = [c for c in rows[0] if c != "Project ID"]
        return {"columns": cols, "rows": [[r[c] for c in cols] for r in rows], "total": len(rows), "file": file_path(name)}

    return {"summary": {"file": file_path("Project summary export"), "fields": fields}, "tracker": tracker,
            "po": lines(x["po"], "PO lines export"), "oop": lines(x["oop"], "OOP export"),
            "hours": {"columns": ["Billing role level", "Status", "Hours", "Billable hours", "Fee"], "rows": hrows,
                      "total": len(hrows), "file": file_path("Hours export") if hrows else None}}


def app_health(ctx: dict, cm: dict, projects: list[dict], roles: dict) -> dict:
    sources = []
    for f, src in zip(ctx["files"], ctx["sources"]):
        if f["kind"] == "tracker":
            continue
        row = {"report": f["name"].replace(" (re-run)", ""), "file": file_path(f["name"]),
               "status": source_status(src), "rows": src["rows"]}
        if f["schema"] == "summary":
            row["live"] = len(projects)
        sources.append(row)
    trackers = [{"file": cm[f["client"]]["tracker_path"], "family": CLIENTS[f["client"]][1], "rows": len(f["rows"])}
                for f in ctx["files"] if f["kind"] == "tracker"]
    rec = ctx["recon"]
    return {
        "as_of": EXTRACT, "poc_month": POC_MONTH, "sources": sources, "trackers": trackers,
        "parse": {k: ctx["parse"][k] for k in ("tracker_rows", "revised_parsed", "pct_parsed")},
        "reconciliation": [{
            "check": "Approved fee in time entries vs project summary labour actuals (projects with time entries)",
            "expected": 0, "actual": rec["explained"] + rec["for_review"], "of": rec["projects"],
            "causes": {"approved after the summary extract (timing)": rec["explained"], "unexplained": rec["for_review"]},
            "status": "pass" if rec["for_review"] == 0 else "fail",
            "note": "Timing breaks clear on the next extract; the rest need review."}],
        "role_gaps": {"projects_without_cfa": sum(p["cfa"] is None for p in projects),
                      "projects_without_cfm": sum(p["cfm"] is None for p in projects),
                      "rolebook_rows": roles["rows"], "rolebook_gd_blank": roles["gd_blank"],
                      "rolebook_ad_blank": roles["ad_blank"]},
    }


def app_scopes(names: dict) -> list[dict]:
    """The viewers: finance ops sees everything under the key "all"; directors see their clients."""
    scopes = [{"key": "all", "name": names["o-sam"], "role": "Platform owner", "clients": sorted(CLIENTS)}]
    for key, name, role in VIEWERS:
        if role != "ops":
            scopes.append({"key": f"{APP_ROLE[role].lower()}-{slug(name)}", "name": name, "role": APP_ROLE[role],
                           "clients": DIRECTORS.get(key, [])})
    scopes.append({"key": f"group-director-{slug(GROUP_DIRECTOR)}", "name": GROUP_DIRECTOR,
                   "role": "Group Director", "clients": sorted(CLIENTS)})
    return scopes


def app_export(snap: dict) -> dict[str, object]:
    """{relative path: JSON value} for apps/project-finance/data, in the app's schema (its types.ts)."""
    ctx = snap["_ctx"]
    rng = random.Random(f"{snap['meta']['seed']}-app")  # own stream, so snapshot.json does not change
    cm = client_meta()
    names = {k: n for k, n, _ in VIEWERS}
    pms = {c: rng.sample(PMS, 3) for c in CLIENTS}
    seen_in_client: dict[str, int] = defaultdict(int)
    projects = []
    for p in snap["projects"]:
        k = seen_in_client[p["client"]]
        seen_in_client[p["client"]] += 1
        contract = f"{cm[p['client']]['short']}-SOW-{k // 6 + 1:02d}"
        projects.append(app_project(p, names, cm, rng.choice(pms[p["client"]]), contract))
    by_id = {p["id"]: p for p in projects}

    oop_by, po_by = defaultdict(list), defaultdict(list)
    for o in ctx["data"]["oop"]:
        oop_by[o["Project ID"]].append(o)
    for x in ctx["data"]["po"]:
        po_by[x["Project ID"]].append(x)
    exceptions = []
    for e in snap["exceptions"]:
        p = by_id[e["project_id"]]
        x = {**ctx["extra"][p["id"]], "oop": oop_by[p["id"]]}
        exceptions.append({"rule": APP_RULE.get(e["rule"], e["rule"]), "project_id": p["id"], "client": p["client"],
                           "cfa": p["cfa"], "cfm": p["cfm"], "owner": p["cfa"] or p["cfm"],
                           "owner_role": "CFA" if p["cfa"] else "CFM", "amount": e["amount"],
                           "reference": app_reference(e["rule"], x), "detail": e["detail"]})
    roles = role_map(rng)
    health = app_health(ctx, cm, projects, roles)
    catalog = app_catalog(ctx["files"], ctx["sources"], cm, roles["rows"])

    trows = {}
    for f, src in zip(ctx["files"], ctx["sources"]):
        if f["kind"] == "tracker" and src["status"] == "accepted":
            trows.update({r.get("Job") or r.get("Job Number"): r for r in f["rows"]})
    detail_index, chunks = {}, defaultdict(dict)
    for s in ctx["data"]["summary"]:
        pid = s["Project ID"]
        x = {**ctx["extra"][pid], "oop": oop_by[pid], "po": po_by[pid]}
        chunk = slug(s["Client"]) + ".json"
        detail_index[pid] = chunk
        chunks[chunk][pid] = app_detail(s, x, trows.get(pid), names, cm)

    planted = {APP_RULE.get(r, r): v for r, v in snap["planted"].items()}
    meta = {"exportedAt": snap["meta"]["generated_at"], "asOf": EXTRACT, "pocMonth": POC_MONTH, "scope": "synthetic"}
    field = {"CFA": "cfa", "CFM": "cfm", "AD": "ad"}
    out: dict[str, object] = {}
    index = []
    for sc in app_scopes(names):
        if sc["role"] in field:
            sub = [p for p in projects if p[field[sc["role"]]] == sc["name"]]
        else:
            sub = [p for p in projects if p["client_name"] in sc["clients"]]
        if not sub:
            continue
        ids = {p["id"] for p in sub}
        if sc["role"] == "AD":  # delivery audience: no billing position in the file at all
            sub = [{k: v for k, v in p.items() if k not in ("billing", "unbilled")} for p in sub]
        seen = {p["client_name"] for p in sub}
        files = catalog if sc["role"] == "Platform owner" else [c for c in catalog if seen & set(c["clients"])]
        fn = sc["key"] + ".json"
        out[fn] = {"meta": {**meta, "viewer": {k: sc[k] for k in ("key", "name", "role")}}, "projects": sub,
                   "exceptions": [e for e in exceptions if e["project_id"] in ids],
                   "health": health if sc["role"] in HEALTH_ROLES else None, "catalog": files, "planted": planted}
        index.append({"key": sc["key"], "file": fn, "name": sc["name"], "role": sc["role"], "projects": len(sub),
                      "clients": sorted(seen)})
    out["index.json"] = {"meta": meta, "viewers": index}
    out["detail/index.json"] = detail_index
    for c, rows in sorted(chunks.items()):
        out[f"detail/{c}"] = rows
    return out


def dump_app(files: dict[str, object]) -> dict[str, str]:
    return {k: json.dumps(v, separators=(",", ":"), ensure_ascii=False) + "\n" for k, v in sorted(files.items())}


def write_app(files: dict[str, str], out: Path) -> int:
    """Replace the JSON in the app data folder (it holds only this build's output)."""
    for old in [*out.glob("*.json"), *out.glob("detail/*.json")]:
        old.unlink()
    for rel, text in files.items():
        f = out / rel
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(text, encoding="utf-8")
    return sum(len(t.encode("utf-8")) for t in files.values())


def dump(snap: dict) -> str:
    return json.dumps({k: v for k, v in snap.items() if not k.startswith("_")}, indent=1) + "\n"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--seed", type=int, default=SEED)
    ap.add_argument("--out", type=Path, default=OUT)
    ap.add_argument("--app-out", type=Path, default=APP_OUT)
    a = ap.parse_args()
    snap = build(a.seed)
    a.out.parent.mkdir(parents=True, exist_ok=True)
    text = dump(snap)
    a.out.write_text(text, encoding="utf-8")
    print(f"wrote {a.out} ({len(text.encode()) / 1024:.0f} KB): {len(snap['projects'])} projects, "
          f"{len(snap['exceptions'])} exceptions")
    app = dump_app(app_export(snap))
    size = write_app(app, a.app_out)
    print(f"wrote {a.app_out} ({size / 1024:.0f} KB in {len(app)} files)")
    for r, v in snap["planted"].items():
        print(f"  {r:20s} planted {v['planted']:3d}  found {v['found']:3d}" + ("" if v["planted"] == v["found"] else "  MISMATCH"))


if __name__ == "__main__":
    main()
