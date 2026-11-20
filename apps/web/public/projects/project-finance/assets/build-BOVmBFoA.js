const r=`"""Synthetic build for the Project Finance Checks dashboard.\r
\r
Generates raw exports (ERP project summary, hours, OOP, PO lines, per-client trackers,\r
people directory) with a fixed seed, plants a known number of anomalies per rule,\r
then computes every project metric from the raw rows and runs the 11 rules\r
independently. Writes projects/project-finance/snapshot.json\r
in the shape of snapshot.types.ts next to it, and the React app's\r
static data folder apps/project-finance/data (index.json, one snapshot per viewer,\r
detail/index.json + detail/<client>.json) in the shape of apps/project-finance/src/types.ts.\r
\r
  python projects/project-finance/build.py [--seed 2026] [--out path] [--app-out dir]\r
\r
Standard library only. Every name and figure is made up.\r
"""\r
\r
from __future__ import annotations\r
\r
import argparse\r
import csv\r
import hashlib\r
import io\r
import json\r
import random\r
from collections import defaultdict\r
from datetime import date, datetime, timedelta, timezone\r
from pathlib import Path\r
\r
ROOT = Path(__file__).resolve().parents[2]\r
OUT = Path(__file__).resolve().parent / "snapshot.json"\r
SEED = 2026\r
YEAR = 2026\r
AS_OF = date(2026, 11, 16)\r
POC_MONTH = "2026-10"\r
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]\r
POC_COL = f"{MONTHS[int(POC_MONTH[5:]) - 1]}-{str(YEAR)[2:]}"  # "Oct-26"\r
PREV_COL = f"{MONTHS[int(POC_MONTH[5:]) - 2]}-{str(YEAR)[2:]}"  # "Sep-26"\r
STALE_DAYS = 7\r
DONE = {"Closed", "Complete"}\r
\r
# ---------------------------------------------------------------- reference data\r
\r
RULES = [\r
    ("near_cap", "Close to budget cap", "critical",\r
     "Fee burn is 90% or more and % complete is under 80%",\r
     "Agree re-phasing or a budget change with the account director", False),\r
    ("over_sow", "Spend over revised SOW", "critical",\r
     "Committed spend (fee + OOP + open POs) exceeds the revised SOW",\r
     "Confirm an approved scope change, or move the time to the right project", False),\r
    ("zero_rate", "Billable time with no rate", "critical",\r
     "Billable hours were booked at a $0 rate",\r
     "Ask the ERP admin to fix the contract rate, then re-rate the entries", False),\r
    ("missing_tracker", "In the ERP, not in a tracker", "serious",\r
     "A live project has spend but no row in its client tracker",\r
     "Add the job to the tracker, or mark it out of scope", False),\r
    ("sow_vs_erp", "Revised SOW differs from ERP budget", "serious",\r
     "Tracker revised SOW and ERP budget differ by more than $1 and more than 1%, and the project is not done",\r
     "Load the approved budget in the ERP, or correct the tracker", False),\r
    ("implausible_budget", "Implausible ERP budget", "serious",\r
     "ERP budget is more than 10x the tracker SOW, or more than $10M on one project",\r
     "Raise with the finance manager; likely a keying error", False),\r
    ("closed_moving", "Closed project still moving", "serious",\r
     "Project is closed or complete but has unapproved time or open POs",\r
     "Clear the open items, or reopen the project", False),\r
    ("stale_unapproved", "Unapproved time older than 7 days", "warning",\r
     "Time is submitted or returned and older than 7 days at the extract date",\r
     "Chase the approver", False),\r
    ("pct_down", "% complete went down", "warning",\r
     "% complete is lower than last month, which reverses revenue",\r
     "Record the reason before month-end sign-off", False),\r
    ("oop_mismatch", "OOP billable differs from actual", "warning",\r
     "Billable and actual OOP amounts differ by more than $0.01",\r
     "Review the markup or pass-through rule", False),\r
    ("billed_ahead", "Billed ahead of delivery", "warning",\r
     "Billing to date exceeds actuals by more than 5% and more than $100",\r
     "Threshold pending: Finance to set the rule per contract type", True),\r
]\r
RULE_IDS = [r[0] for r in RULES]\r
\r
# Planted anomalies per rule: each on its own project, so hits never overlap by construction.\r
PLANT_COUNTS = {\r
    "near_cap": 9, "over_sow": 14, "zero_rate": 6, "missing_tracker": 12, "sow_vs_erp": 18,\r
    "implausible_budget": 4, "closed_moving": 5, "stale_unapproved": 20, "pct_down": 8,\r
    "oop_mismatch": 3, "billed_ahead": 11,\r
}\r
\r
# client -> (projects, tracker family, products)\r
CLIENTS = {\r
    "Northwind Health": (58, "standard", ["Veloria", "Corvanta", "Lumiset"]),\r
    "Contoso Labs": (40, "standard", ["Brevix", "Nalutra"]),\r
    "Fabrikam Foods": (38, "standard", ["Harvest Crunch", "Oatwise", "Sunmeadow"]),\r
    "Tailspin Retail": (24, "compact", ["Tailspin Rewards", "Skyline Outlet"]),\r
}\r
WORKSTREAMS = [\r
    "Brand campaign", "Digital refresh", "Field materials", "Conference support", "Always-on social",\r
    "Market research", "Website build", "Launch planning", "Retainer", "Content hub", "Sales training",\r
    "Packaging update", "CRM journeys", "Media planning",\r
]\r
\r
VIEWERS = [\r
    ("a-lena", "Lena Marsh", "analyst"), ("a-omar", "Omar Reyes", "analyst"),\r
    ("a-priya", "Priya Natarajan", "analyst"), ("a-tomas", "Tomas Ferreira", "analyst"),\r
    ("a-hana", "Hana Kowalski", "analyst"),\r
    ("m-grace", "Grace Okafor", "manager"), ("m-diego", "Diego Lindqvist", "manager"),\r
    ("m-ruth", "Ruth Abernathy", "manager"),\r
    ("d-simon", "Simon Achterberg", "director"), ("d-ines", "Ines Moreau", "director"),\r
    ("acc-marta", "Marta Velasco", "account"), ("acc-kofi", "Kofi Mensah", "account"),\r
    ("acc-julia", "Julia Brandt", "account"),\r
    ("o-sam", "Sam Whitlock", "ops"),\r
]\r
ANALYSTS = {"Northwind Health": ["a-lena", "a-omar"], "Contoso Labs": ["a-priya"],\r
            "Fabrikam Foods": ["a-tomas"], "Tailspin Retail": ["a-hana"]}\r
MANAGERS = {"Northwind Health": "m-grace", "Contoso Labs": "m-grace",\r
            "Fabrikam Foods": "m-diego", "Tailspin Retail": "m-ruth"}\r
ACCOUNTS = {"Northwind Health": "acc-marta", "Contoso Labs": "acc-kofi",\r
            "Fabrikam Foods": "acc-kofi", "Tailspin Retail": "acc-julia"}\r
DIRECTORS = {"d-simon": ["Contoso Labs", "Northwind Health"], "d-ines": ["Fabrikam Foods", "Tailspin Retail"]}\r
\r
WORKERS = [f"Worker {i:02d}" for i in range(1, 41)]\r
SUPPLIERS = ["Bluefin Print Co", "Northgate Studios", "Pixelwell Media", "Riverbend Events",\r
             "Quartzline Research", "Harbor Translation", "Lakeside Logistics"]\r
\r
# Required columns per source: the schema contract checked on read.\r
SCHEMA = {\r
    "summary": ["Project ID", "Project Name", "Client", "Product", "Status", "Start Date", "End Date",\r
                "Labour Budget", "OOP Budget", "Total Budget", "Labour Actuals", "OOP Actuals",\r
                "Open POs", "Billing", "Analyst", "Manager", "Account Director"],\r
    "hours": ["Project ID", "Worker", "Date", "Hours", "Billable", "Rate", "Fee Amount", "Status", "Approved On"],\r
    "oop": ["Project ID", "Transaction", "Date", "Supplier", "Actual Amount", "Billable Amount"],\r
    "po": ["Project ID", "PO Number", "Line", "Supplier", "Status", "Amount", "Received", "Remaining"],\r
    "directory": ["Key", "Name", "Role", "Clients"],\r
}\r
TRACKER_FAMILIES = {\r
    "standard": ["Job", "Job Name", "Revised Fee", "Revised OOP", "Revised Total"] + [f"{m}-26" for m in MONTHS],\r
    "compact": ["Job Number", "Description", "Fee", "OOP", "Total SOW"],\r
}\r
\r
\r
def money(x: float) -> float:\r
    return round(x + 0.0, 2)\r
\r
\r
def iso(d: date) -> str:\r
    return d.isoformat()\r
\r
\r
# ---------------------------------------------------------------- generator\r
\r
\r
def plan_projects(rng: random.Random) -> list[dict]:\r
    """Project specs with the anomaly (if any) each one carries."""\r
    specs = []\r
    n = 0\r
    for client, (count, family, products) in CLIENTS.items():\r
        for _ in range(count):\r
            n += 1\r
            specs.append({"id": f"PRJ-{n:04d}", "client": client, "family": family,\r
                          "product": rng.choice(products), "plant": None, "tweak": None})\r
    order = list(range(len(specs)))\r
    rng.shuffle(order)\r
    free = order[:]\r
\r
    def take(rule: str, k: int, ok) -> None:\r
        picked = [i for i in free if ok(specs[i])][:k]\r
        if len(picked) < k:\r
            raise SystemExit(f"cannot place {k} plants for {rule}")\r
        for i in picked:\r
            specs[i]["plant"] = rule\r
            free.remove(i)\r
\r
    std = lambda s: s["family"] == "standard"  # noqa: E731\r
    take("near_cap", PLANT_COUNTS["near_cap"], std)\r
    take("pct_down", PLANT_COUNTS["pct_down"], std)\r
    for rule in RULE_IDS:\r
        if rule not in ("near_cap", "pct_down"):\r
            take(rule, PLANT_COUNTS[rule], lambda s: True)\r
    # Clean edge cases and data-quality tweaks, on projects with no plant.\r
    for tweak, k in [("not_started", 3), ("revised_tbc", 2), ("done_diff", 3), ("recon_explained", 4),\r
                     ("recon_review", 4), ("small_diff", 4)]:\r
        for i in free[:k]:\r
            specs[i]["tweak"] = tweak\r
        free = free[k:]\r
    return specs\r
\r
\r
def assign_people(specs: list[dict], rng: random.Random) -> None:\r
    for s in specs:\r
        s["analyst"] = rng.choice(ANALYSTS[s["client"]])\r
        s["manager"] = MANAGERS[s["client"]]\r
        s["account"] = ACCOUNTS[s["client"]]\r
    ids = list(range(len(specs)))\r
    rng.shuffle(ids)\r
    for i in ids[:7]:\r
        specs[i]["analyst"] = None\r
    specs[ids[0]]["manager"] = None  # no analyst and no manager: the exception has no owner\r
    specs[ids[20]]["manager"] = None\r
    for i in ids[30:33]:\r
        specs[i]["account"] = None\r
\r
\r
def gen_dates(rng: random.Random, done: bool) -> tuple[date, date]:\r
    if done:\r
        start = date(2025, 9, 1) + timedelta(days=rng.randint(0, 200))\r
        end = start + timedelta(days=rng.randint(120, 300))\r
        end = min(end, AS_OF - timedelta(days=rng.randint(10, 60)))\r
        end = max(end, date(2026, 2, 1))\r
        return start, end\r
    start = date(2025, 8, 1) + timedelta(days=rng.randint(0, 400))\r
    start = min(start, date(2026, 9, 1))\r
    end = max(start + timedelta(days=rng.randint(180, 420)), AS_OF + timedelta(days=30))\r
    return start, end\r
\r
\r
def split(rng: random.Random, total: float, n: int) -> list[float]:\r
    w = [rng.uniform(0.4, 1.6) for _ in range(n)]\r
    s = sum(w)\r
    return [total * x / s for x in w]\r
\r
\r
def rand_date(rng: random.Random, lo: date, hi: date) -> date:\r
    if hi <= lo:\r
        return lo\r
    return lo + timedelta(days=rng.randint(0, (hi - lo).days))\r
\r
\r
def generate(seed: int) -> dict:\r
    rng = random.Random(seed)\r
    specs = plan_projects(rng)\r
    assign_people(specs, rng)\r
\r
    summary, hours, oop, po = [], [], [], []\r
    trackers: dict[str, list[dict]] = defaultdict(list)\r
    planted: dict[str, list[str]] = {r: [] for r in RULE_IDS}\r
    names_used: set[str] = set()\r
\r
    for s in specs:\r
        p, tw, pid = s["plant"], s["tweak"], s["id"]\r
        if p:\r
            planted[p].append(pid)\r
        # status\r
        if p in ("closed_moving", "implausible_budget") or tw == "done_diff":\r
            status = rng.choice(["Closed", "Complete"])\r
        elif p in ("stale_unapproved", "near_cap", "pct_down", "sow_vs_erp", "zero_rate") or tw:\r
            status = "Active"\r
        else:\r
            status = rng.choices(["Active", "On Hold", "Complete", "Closed"], [78, 8, 8, 6])[0]\r
        done = status in DONE\r
        start, end = gen_dates(rng, done)\r
        in_tracker = p != "missing_tracker" and tw != "not_started"\r
\r
        # revised SOW (tracker values)\r
        total = money(rng.choice([1, 1, 2, 3, 5, 8]) * rng.uniform(30_000, 220_000))\r
        fee_share = rng.uniform(0.62, 0.92)\r
        rfee = money(total * fee_share)\r
        roop = money(total - rfee)\r
\r
        # targets as shares of the revised values\r
        pct = round(rng.uniform(0.15, 0.95), 2) if not done else 1.0\r
        fee_burn = min(0.82, max(0.05, pct * rng.uniform(0.85, 1.05)))\r
        if done:\r
            fee_burn = rng.uniform(0.6, 0.82)\r
        oop_share, po_share = rng.uniform(0.2, 0.6), rng.uniform(0.0, 0.25)\r
        pct_prev = round(max(0.0, pct - rng.choice([0, 0, 0.05, 0.1, 0.15])), 2)\r
        if p == "near_cap":\r
            pct = round(rng.uniform(0.3, 0.72), 2)\r
            pct_prev = round(pct - 0.05, 2)\r
            fee_burn = rng.uniform(0.92, 0.98)\r
        elif p == "pct_down":\r
            pct = min(pct, 0.8)\r
            pct_prev = round(pct + rng.choice([0.05, 0.1, 0.15]), 2)\r
        elif p == "over_sow":\r
            if s["family"] == "standard" and rng.random() < 0.5:\r
                pct = round(rng.uniform(0.85, 0.98), 2)\r
                pct_prev = round(pct - 0.03, 2)\r
                fee_burn = rng.uniform(1.08, 1.25)\r
                need = (1 - fee_burn * fee_share) / (1 - fee_share)  # OOP share that brings spend to the SOW\r
                oop_share = max(0.1, need + rng.uniform(0.08, 0.3))\r
            else:  # OOP over-run on a normal fee burn\r
                po_share = rng.uniform(0.0, 0.1)\r
                oop_share = (1 - fee_burn * fee_share) / (1 - fee_share) * rng.uniform(1.15, 1.6)\r
        if s["family"] == "compact":\r
            pct = pct_prev = None\r
\r
        fee_target = rfee * fee_burn\r
        oop_target = roop * oop_share\r
        po_target = roop * po_share\r
        if tw == "not_started":\r
            fee_target = oop_target = po_target = 0.0\r
\r
        # time entries\r
        rates = [rng.choice([95, 120, 145, 170, 210, 260]) for _ in range(4)]\r
        unappr_share = 0.0 if done else rng.uniform(0.0, 0.06)\r
        if p == "closed_moving" and rng.random() < 0.6:\r
            unappr_share = rng.uniform(0.03, 0.08)\r
        if p == "stale_unapproved":\r
            unappr_share = rng.uniform(0.04, 0.12)\r
        n_entries = 0 if fee_target == 0 else rng.randint(14, 40)\r
        entry_lo = max(start, date(YEAR - 1, 7, 1))\r
        entry_hi = min(end, AS_OF)\r
        fees = split(rng, fee_target, n_entries) if n_entries else []\r
        n_unappr = max(1, round(n_entries * unappr_share)) if unappr_share else 0\r
        n_zero = rng.randint(1, 3) if p == "zero_rate" else 0\r
        explained_left = rng.randint(1, 2) if tw == "recon_explained" else 0\r
        for k, f in enumerate(fees):\r
            rate = rng.choice(rates)\r
            hrs = round(f / rate, 2)\r
            st, d, appr_on = "Approved", rand_date(rng, entry_lo, entry_hi - timedelta(days=3)), None\r
            if k < n_unappr:\r
                st = rng.choice(["Submitted", "Submitted", "Returned"])\r
                if p == "stale_unapproved" and k < 2:\r
                    d = rand_date(rng, max(entry_lo, entry_hi - timedelta(days=60)), AS_OF - timedelta(days=STALE_DAYS + 2))\r
                else:\r
                    d = AS_OF - timedelta(days=rng.randint(0, STALE_DAYS - 1))\r
            else:\r
                appr_on = min(AS_OF - timedelta(days=1), d + timedelta(days=rng.randint(1, 6)))\r
                if explained_left and k >= n_entries - explained_left:\r
                    appr_on = AS_OF  # approved after the summary extract ran\r
            hours.append({"Project ID": pid, "Worker": rng.choice(WORKERS), "Date": iso(d), "Hours": hrs,\r
                          "Billable": "Yes", "Rate": rate, "Fee Amount": money(hrs * rate), "Status": st,\r
                          "Approved On": iso(appr_on) if appr_on else ""})\r
        if n_entries:\r
            for _ in range(rng.randint(0, 3)):  # internal, non-billable time at no rate: never a hit\r
                hours.append({"Project ID": pid, "Worker": rng.choice(WORKERS),\r
                              "Date": iso(rand_date(rng, entry_lo, entry_hi - timedelta(days=3))),\r
                              "Hours": round(rng.uniform(1, 6), 2), "Billable": "No", "Rate": 0,\r
                              "Fee Amount": 0.0, "Status": "Approved", "Approved On": iso(AS_OF - timedelta(days=2))})\r
        for _ in range(n_zero):\r
            d = rand_date(rng, entry_lo, entry_hi - timedelta(days=3))\r
            hours.append({"Project ID": pid, "Worker": rng.choice(WORKERS), "Date": iso(d),\r
                          "Hours": round(rng.uniform(2, 16), 2), "Billable": "Yes", "Rate": 0, "Fee Amount": 0.0,\r
                          "Status": "Approved", "Approved On": iso(min(AS_OF - timedelta(days=1), d + timedelta(days=2)))})\r
\r
        # OOP lines\r
        n_oop = 0 if oop_target == 0 else rng.randint(2, 8)\r
        for k, a in enumerate(split(rng, oop_target, n_oop) if n_oop else []):\r
            a = money(a)\r
            billable = a\r
            if p == "oop_mismatch" and k == 0:\r
                billable = money(a * rng.choice([1.05, 1.1, 1.15]))\r
            oop.append({"Project ID": pid, "Transaction": f"OOP-{len(oop) + 1:05d}",\r
                        "Date": iso(rand_date(rng, entry_lo, entry_hi)), "Supplier": rng.choice(SUPPLIERS),\r
                        "Actual Amount": a, "Billable Amount": billable})\r
\r
        # PO lines: open lines carry the remaining commitment; done projects only have closed lines\r
        po_no = f"PO-{70000 + int(pid[4:]) * 3}"\r
        line = 0\r
        open_needed = po_target if not done else 0.0\r
        if p == "closed_moving" and unappr_share == 0:\r
            open_needed = money(roop * rng.uniform(0.05, 0.2))\r
        if open_needed > 0:\r
            for amt in split(rng, open_needed, rng.randint(1, 3)):\r
                line += 1\r
                full = money(amt * rng.uniform(1.2, 2.0))\r
                rem = money(amt)\r
                po.append({"Project ID": pid, "PO Number": po_no, "Line": line, "Supplier": rng.choice(SUPPLIERS),\r
                           "Status": rng.choice(["Open", "Partially Received"]), "Amount": full,\r
                           "Received": money(full - rem), "Remaining": rem})\r
        for _ in range(rng.randint(0, 2)):\r
            line += 1\r
            full = money(rng.uniform(2_000, 20_000))\r
            st = rng.choice(["Closed", "Closed", "Canceled"])\r
            po.append({"Project ID": pid, "PO Number": po_no, "Line": line, "Supplier": rng.choice(SUPPLIERS),\r
                       "Status": st, "Amount": full, "Received": full if st == "Closed" else 0.0,\r
                       "Remaining": money(full * rng.uniform(0.1, 0.5))})  # leftover on closed lines never counts\r
\r
        # ERP budget\r
        erp_fee, erp_oop = rfee, roop\r
        if p == "sow_vs_erp" or tw == "done_diff":\r
            f = rng.choice([-1, 1]) * rng.uniform(0.03, 0.4)\r
            erp_fee = money(rfee * (1 + f))\r
        elif tw == "small_diff":\r
            erp_fee = money(rfee * (1 + rng.uniform(0.001, 0.008)))  # within 1%: not a hit\r
        elif p == "implausible_budget":\r
            if len(planted[p]) == 1:  # one over $10M without being 10x the SOW\r
                rfee, roop = money(1_350_000 * fee_share), money(1_350_000 * (1 - fee_share))\r
                total = money(rfee + roop)\r
                fee_target, erp_fee = rfee * fee_burn, money(rng.uniform(10_500_000, 12_500_000))\r
                scale_fee_rows(hours, pid, fee_target)\r
            else:\r
                erp_fee = money(total * rng.choice([10.5, 12, 40]))\r
        erp_total = money(erp_fee + erp_oop)\r
\r
        # ERP labour actuals = approved time, as the summary extract saw it\r
        rows = [h for h in hours if h["Project ID"] == pid]\r
        approved = sum(h["Fee Amount"] for h in rows if h["Status"] == "Approved")\r
        late = sum(h["Fee Amount"] for h in rows if h["Status"] == "Approved" and h["Approved On"] == iso(AS_OF))\r
        labour = money(approved - late)\r
        if tw == "recon_review":\r
            labour = money(approved * (1 + rng.choice([-1, 1]) * rng.uniform(0.01, 0.035)))\r
        unappr = sum(h["Fee Amount"] for h in rows if h["Status"] != "Approved")\r
        oop_act = money(sum(o["Actual Amount"] for o in oop if o["Project ID"] == pid))\r
        actuals = labour + unappr + oop_act\r
        billing = money(actuals * rng.uniform(0.55, 0.98))\r
        if p == "billed_ahead":\r
            billing = money(actuals * rng.uniform(1.12, 1.45) + 500)\r
        if tw == "not_started":\r
            billing = 0.0\r
\r
        name = f"{s['product']} {rng.choice(WORKSTREAMS).lower()}"\r
        while name in names_used:\r
            name = f"{s['product']} {rng.choice(WORKSTREAMS).lower()} {rng.randint(2, 9)}"\r
        names_used.add(name)\r
        summary.append({\r
            "Project ID": pid, "Project Name": name, "Client": s["client"], "Product": s["product"],\r
            "Status": status, "Start Date": iso(start), "End Date": iso(end),\r
            "Labour Budget": erp_fee, "OOP Budget": erp_oop, "Total Budget": erp_total,\r
            "Labour Actuals": labour, "OOP Actuals": oop_act,\r
            "Open POs": money(sum(x["Remaining"] for x in po if x["Project ID"] == pid\r
                                  and x["Status"] not in ("Closed", "Canceled"))),\r
            "Billing": billing, "Analyst": s["analyst"] or "", "Manager": s["manager"] or "",\r
            "Account Director": s["account"] or "",\r
        })\r
\r
        if in_tracker:\r
            trackers[s["client"]].append(tracker_row(rng, s["family"], pid, name, rfee, roop, total,\r
                                                     pct, pct_prev, tw == "revised_tbc"))\r
\r
    for client, (_, family, products) in CLIENTS.items():  # rows for jobs that are not live this year\r
        for k in range(rng.choice([1, 2, 3])):\r
            trackers[client].append(tracker_row(rng, family, f"PRJ-9{len(trackers[client]):03d}",\r
                                                f"{products[0]} archive job {k + 1}", 20_000.0, 5_000.0,\r
                                                25_000.0, 1.0, 1.0, False))\r
\r
    directory = [{"Key": k, "Name": n, "Role": r, "Clients": ""} for k, n, r in VIEWERS]\r
    # Schema drift: a re-run of the hours export arrives with a renamed column.\r
    rerun = [{("Fee Amt" if c == "Fee Amount" else c): v for c, v in h.items()} for h in hours[:640]]\r
    files = [\r
        {"name": "Project summary export", "kind": "erp", "schema": "summary", "rows": summary},\r
        {"name": "Hours export", "kind": "erp", "schema": "hours", "rows": hours},\r
        {"name": "Hours export (re-run)", "kind": "erp", "schema": "hours", "rows": rerun},\r
        {"name": "OOP export", "kind": "erp", "schema": "oop", "rows": oop},\r
        {"name": "PO lines export", "kind": "erp", "schema": "po", "rows": po},\r
        *[{"name": f"Tracker: {c}", "kind": "tracker", "schema": "tracker", "client": c, "rows": trackers[c]}\r
          for c in CLIENTS],\r
        {"name": "People directory", "kind": "directory", "schema": "directory", "rows": directory},\r
    ]\r
    return {"files": files, "planted": planted, "specs": specs}\r
\r
\r
def scale_fee_rows(hours: list[dict], pid: str, target: float) -> None:\r
    rows = [h for h in hours if h["Project ID"] == pid and h["Fee Amount"] > 0]\r
    cur = sum(h["Fee Amount"] for h in rows)\r
    if not cur:\r
        return\r
    for h in rows:\r
        h["Hours"] = round(h["Hours"] * target / cur, 2)\r
        h["Fee Amount"] = money(h["Hours"] * h["Rate"])\r
\r
\r
def tracker_row(rng, family, pid, name, rfee, roop, total, pct, pct_prev, tbc) -> dict:\r
    if family == "standard":\r
        row = {"Job": pid, "Job Name": name, "Revised Fee": rfee, "Revised OOP": roop,\r
               "Revised Total": "TBC" if tbc else total}\r
        poc_i = int(POC_MONTH[5:]) - 1\r
        for i, m in enumerate(MONTHS):\r
            col = f"{m}-26"\r
            if i == poc_i:\r
                v = pct\r
            elif i == poc_i - 1:\r
                v = pct_prev\r
            elif i < poc_i - 1:\r
                v = round((pct_prev or 0) * (i + 1) / poc_i, 2)\r
            else:  # forecast cells the analysts pre-fill; never read\r
                v = round(min(1.0, (pct or 0) + 0.08 * (i - poc_i)), 2)\r
            row[col] = f"{round(v * 100)}%" if v is not None else ""\r
        return row\r
    return {"Job Number": pid, "Description": name, "Fee": rfee, "OOP": roop,\r
            "Total SOW": "TBC" if tbc else total}\r
\r
\r
# ---------------------------------------------------------------- load + compute\r
\r
\r
def load(files: list[dict]) -> tuple[dict, list[dict], dict]:\r
    """Schema contract: reject a file missing a required column; keep the rest."""\r
    data: dict = {"tracker": {}}\r
    sources = []\r
    for f in files:\r
        cols = set(f["rows"][0]) if f["rows"] else set()\r
        if f["schema"] == "tracker":\r
            family = next((fam for fam, req in TRACKER_FAMILIES.items() if set(req[:5]) <= cols), None)\r
            missing = [] if family else ["Revised Total"]\r
        else:\r
            family = None\r
            missing = [c for c in SCHEMA[f["schema"]] if c not in cols]\r
        src = {"name": f["name"], "kind": f["kind"], "status": "accepted", "rows": len(f["rows"])}\r
        if missing:\r
            src["status"] = "rejected"\r
            src["reason"] = f"missing column '{missing[0]}'; the last good file stays loaded"\r
        elif f["schema"] == "tracker":\r
            data["tracker"][f["client"]] = (family, f["rows"])\r
        else:\r
            data[f["schema"]] = f["rows"]\r
        sources.append(src)\r
    parse = parse_trackers(data["tracker"])\r
    return data, sources, parse\r
\r
\r
def num(v) -> float | None:\r
    if isinstance(v, (int, float)):\r
        return float(v)\r
    try:\r
        return float(str(v).replace(",", "").replace("$", ""))\r
    except ValueError:\r
        return None\r
\r
\r
def pct_val(v) -> float | None:\r
    if v in (None, ""):\r
        return None\r
    try:\r
        return round(float(str(v).rstrip("%")) / 100, 4)\r
    except ValueError:\r
        return None\r
\r
\r
def parse_trackers(trackers: dict) -> dict:\r
    by_job, rows_n, revised_ok, pct_ok = {}, 0, 0, 0\r
    for family, rows in trackers.values():\r
        for r in rows:\r
            rows_n += 1\r
            if family == "standard":\r
                job, fee, oop, tot = r["Job"], num(r["Revised Fee"]), num(r["Revised OOP"]), num(r["Revised Total"])\r
                pct, prev = pct_val(r.get(POC_COL)), pct_val(r.get(PREV_COL))\r
            else:\r
                job, fee, oop, tot = r["Job Number"], num(r["Fee"]), num(r["OOP"]), num(r["Total SOW"])\r
                pct = prev = None\r
            revised_ok += tot is not None\r
            pct_ok += pct is not None\r
            by_job[job] = {"fee": fee, "oop": oop, "total": tot, "pct": pct, "prev": prev}\r
    return {"by_job": by_job, "tracker_rows": rows_n, "revised_parsed": round(revised_ok / rows_n, 4),\r
            "pct_parsed": round(pct_ok / rows_n, 4)}\r
\r
\r
def compute(data: dict, parse: dict) -> tuple[list[dict], dict, dict]:\r
    hours_by, oop_by, po_by = defaultdict(list), defaultdict(list), defaultdict(list)\r
    for h in data["hours"]:\r
        hours_by[h["Project ID"]].append(h)\r
    for o in data["oop"]:\r
        oop_by[o["Project ID"]].append(o)\r
    for x in data["po"]:\r
        po_by[x["Project ID"]].append(x)\r
    projects, recon, extra = [], {"projects": 0, "matched": 0, "explained": 0, "for_review": 0}, {}\r
    for s in data["summary"]:\r
        pid = s["Project ID"]\r
        hrs = hours_by[pid]\r
        approved = sum(h["Fee Amount"] for h in hrs if h["Status"] == "Approved")\r
        unapproved = money(sum(h["Fee Amount"] for h in hrs if h["Status"] != "Approved"))\r
        labour = s["Labour Actuals"]\r
        if hrs:\r
            recon["projects"] += 1\r
            diff = round(approved - labour, 2)\r
            late = round(sum(h["Fee Amount"] for h in hrs if h["Status"] == "Approved"\r
                             and h["Approved On"] == iso(AS_OF)), 2)\r
            if abs(diff) <= 0.01:\r
                recon["matched"] += 1\r
            elif abs(diff - late) <= 0.01:\r
                recon["explained"] += 1  # approved after the summary extract: timing only\r
            else:\r
                recon["for_review"] += 1\r
        fee_actuals = money(labour + unapproved)\r
        oop_actuals = money(sum(o["Actual Amount"] for o in oop_by[pid]))\r
        oop_billable = money(sum(o["Billable Amount"] for o in oop_by[pid]))\r
        open_po = money(sum(x["Remaining"] for x in po_by[pid] if x["Status"] not in ("Closed", "Canceled")))\r
        committed = money(fee_actuals + oop_actuals + open_po)\r
        t = parse["by_job"].get(pid)\r
        in_tracker = t is not None\r
        erp_budget = s["Total Budget"]\r
        if t and t["total"] is not None:\r
            source, revised, revised_fee, tracker_total = "tracker", t["total"], t["fee"], t["total"]\r
        else:\r
            source, revised, revised_fee, tracker_total = "erp", erp_budget, s["Labour Budget"], None\r
        fee_by_month = [0.0] * 12\r
        for h in hrs:\r
            if h["Date"].startswith(str(YEAR)):\r
                fee_by_month[int(h["Date"][5:7]) - 1] += h["Fee Amount"]\r
        billing = s["Billing"]\r
        projects.append({\r
            "id": pid, "name": s["Project Name"], "client": s["Client"], "product": s["Product"],\r
            "status": s["Status"], "start": s["Start Date"], "end": s["End Date"],\r
            "analyst": s["Analyst"] or None, "manager": s["Manager"] or None, "account": s["Account Director"] or None,\r
            "in_tracker": in_tracker, "budget_source": source,\r
            "revised": money(revised), "revised_fee": money(revised_fee), "erp_budget": money(erp_budget),\r
            "fee_actuals": fee_actuals, "oop_actuals": oop_actuals, "open_po": open_po, "committed": committed,\r
            "remaining": money(revised - committed),\r
            "burn": round(committed / revised, 4) if revised else None,\r
            "fee_burn": round(fee_actuals / revised_fee, 4) if revised_fee else None,\r
            "pct_complete": t["pct"] if t else None, "pct_prev": t["prev"] if t else None,\r
            "billing": billing, "unbilled": money(fee_actuals + oop_actuals - billing),\r
            "unapproved_fee": unapproved, "fee_by_month": [money(x) for x in fee_by_month],\r
        })\r
        extra[pid] = {"hours": hrs, "oop_billable": oop_billable, "tracker_total": tracker_total}\r
    return projects, recon, extra\r
\r
\r
# ---------------------------------------------------------------- rules\r
\r
\r
def pc(x: float | None) -> str:\r
    return f"{x * 100:.0f}%" if x is not None else "n/a"\r
\r
\r
def usd(x: float) -> str:\r
    return f"\${x:,.0f}"\r
\r
\r
def run_rules(projects: list[dict], extra: dict) -> list[dict]:\r
    hits = []\r
\r
    def hit(rule, p, amount, detail):\r
        hits.append({"rule": rule, "project_id": p["id"], "owner": p["analyst"] or p["manager"],\r
                     "amount": money(amount), "detail": detail})\r
\r
    for p in projects:\r
        x = extra[p["id"]]\r
        done = p["status"] in DONE\r
        if p["fee_burn"] is not None and p["pct_complete"] is not None \\\r
                and p["fee_burn"] >= 0.9 and p["pct_complete"] < 0.8:\r
            hit("near_cap", p, p["committed"],\r
                f"Fee burn {pc(p['fee_burn'])} against {pc(p['pct_complete'])} complete")\r
        if p["committed"] > p["revised"]:\r
            hit("over_sow", p, p["committed"] - p["revised"],\r
                f"Committed {usd(p['committed'])} is {usd(p['committed'] - p['revised'])} over the revised SOW of {usd(p['revised'])}")\r
        zero = [h for h in x["hours"] if h["Billable"] == "Yes" and h["Hours"] > 0 and h["Rate"] == 0]\r
        if zero:\r
            rated = [h["Rate"] for h in x["hours"] if h["Rate"] > 0]\r
            typical = sorted(rated)[len(rated) // 2] if rated else 0\r
            hrs = sum(h["Hours"] for h in zero)\r
            hit("zero_rate", p, hrs * typical, f"{hrs:.1f} billable hours on {len(zero)} entries at a $0 rate")\r
        if not p["in_tracker"] and p["committed"] > 0:\r
            hit("missing_tracker", p, p["committed"], f"{usd(p['committed'])} committed and no tracker row")\r
        if x["tracker_total"] is not None and not done:\r
            d = abs(x["tracker_total"] - p["erp_budget"])\r
            if d > 1 and d > 0.01 * p["erp_budget"]:\r
                hit("sow_vs_erp", p, d,\r
                    f"Tracker SOW {usd(x['tracker_total'])} vs ERP budget {usd(p['erp_budget'])}")\r
        tt = x["tracker_total"]\r
        if (tt and p["erp_budget"] > 10 * tt) or p["erp_budget"] > 10_000_000:\r
            hit("implausible_budget", p, p["erp_budget"],\r
                f"ERP budget {usd(p['erp_budget'])}" + (f" is {p['erp_budget'] / tt:.1f}x the tracker SOW" if tt else ""))\r
        if done and (p["unapproved_fee"] > 0 or p["open_po"] > 0):\r
            hit("closed_moving", p, p["unapproved_fee"] + p["open_po"],\r
                f"{p['status']} with {usd(p['unapproved_fee'])} unapproved time and {usd(p['open_po'])} open POs")\r
        stale = [h for h in x["hours"] if h["Status"] in ("Submitted", "Returned")\r
                 and (AS_OF - date.fromisoformat(h["Date"])).days > STALE_DAYS]\r
        if stale:\r
            oldest = min(h["Date"] for h in stale)\r
            hit("stale_unapproved", p, sum(h["Fee Amount"] for h in stale),\r
                f"{len(stale)} entries unapproved, oldest dated {oldest}")\r
        if p["pct_complete"] is not None and p["pct_prev"] is not None and p["pct_complete"] < p["pct_prev"]:\r
            hit("pct_down", p, p["revised_fee"] * (p["pct_prev"] - p["pct_complete"]),\r
                f"% complete fell from {pc(p['pct_prev'])} to {pc(p['pct_complete'])}")\r
        if abs(x["oop_billable"] - p["oop_actuals"]) > 0.01:\r
            hit("oop_mismatch", p, abs(x["oop_billable"] - p["oop_actuals"]),\r
                f"OOP billable {usd(x['oop_billable'])} vs actual {usd(p['oop_actuals'])}")\r
        act = p["fee_actuals"] + p["oop_actuals"]\r
        if p["billing"] > 1.05 * act and p["billing"] - act > 100:\r
            hit("billed_ahead", p, p["billing"] - act, f"Billed {usd(p['billing'])} against {usd(act)} of actuals")\r
    return hits\r
\r
\r
# ---------------------------------------------------------------- snapshot\r
\r
\r
def build(seed: int = SEED, generated_at: str | None = None) -> dict:\r
    gen = generate(seed)\r
    data, sources, parse = load(gen["files"])\r
    projects, recon, extra = compute(data, parse)\r
    exceptions = run_rules(projects, extra)\r
    found: dict[str, set] = defaultdict(set)\r
    for e in exceptions:\r
        found[e["rule"]].add(e["project_id"])\r
\r
    viewers = []\r
    for key, name, role in VIEWERS:\r
        if role == "director":\r
            clients = DIRECTORS[key]\r
        elif role == "ops":\r
            clients = list(CLIENTS)\r
        else:\r
            field = {"analyst": "analyst", "manager": "manager", "account": "account"}[role]\r
            clients = sorted({p["client"] for p in projects if p[field] == key})\r
        viewers.append({"key": key, "name": name, "role": role, "clients": sorted(clients)})\r
\r
    return {\r
        "meta": {"generated_at": generated_at or datetime.now(timezone.utc).replace(microsecond=0).isoformat(),\r
                 "seed": seed, "as_of": iso(AS_OF), "poc_month": POC_MONTH, "year": YEAR},\r
        "rules": [{"id": r, "n": i + 1, "label": lab, "severity": sev, "fires_when": fw, "next_step": ns,\r
                   "hidden": hid} for i, (r, lab, sev, fw, ns, hid) in enumerate(RULES)],\r
        "viewers": viewers,\r
        "projects": projects,\r
        "exceptions": exceptions,\r
        "health": {\r
            "sources": sources,\r
            "parse": {k: parse[k] for k in ("tracker_rows", "revised_parsed", "pct_parsed")},\r
            "reconciliation": recon,\r
            "unassigned": {k: sum(1 for p in projects if p[k] is None) for k in ("analyst", "manager", "account")},\r
        },\r
        "planted": {r: {"planted": len(gen["planted"][r]), "found": len(found[r])} for r in RULE_IDS},\r
        "_planted_ids": {r: sorted(gen["planted"][r]) for r in RULE_IDS},\r
        "_ctx": {"files": gen["files"], "data": data, "sources": sources, "parse": parse, "recon": recon,\r
                 "extra": extra},\r
    }\r
\r
\r
# ---------------------------------------------------------------- app export (apps/project-finance/data)\r
# The ported React app reads a static data folder: index.json (viewers), one snapshot per viewer, and\r
# detail/index.json + detail/<client>.json for the "all source fields" panel. Shapes follow the app's types.ts.\r
\r
APP_OUT = ROOT / "apps" / "project-finance" / "data"\r
APP_RULE = {"zero_rate": "zero_rate_billable", "missing_tracker": "missing_from_tracker",\r
            "sow_vs_erp": "sow_vs_erp", "oop_mismatch": "oop_billable_mismatch"}\r
APP_ROLE = {"analyst": "CFA", "manager": "CFM", "director": "Director", "account": "AD", "ops": "Platform owner"}\r
GROUP_DIRECTOR = "Noor Halvorsen"  # one Group Director over the whole book\r
PMS = ["Avery Quinn", "Jonah Pike", "Mira Solberg", "Felix Ortega", "Leah Duarte", "Ravi Castell",\r
       "Ingrid Paulsen", "Tobias Wren"]\r
HEALTH_ROLES = {"Platform owner", "CFM", "CFA"}\r
LEVELS = {0: "(no rate)", 95: "Level 1", 120: "Level 2", 145: "Level 3", 170: "Level 4", 210: "Level 5", 260: "Level 6"}\r
EXTRACT = iso(AS_OF)\r
ERP_DIR = f"ERP exports/{EXTRACT[:7]}"\r
ERP_FILES = {  # source name -> file name in the shared folder\r
    "Project summary export": f"erp_project_summary_{EXTRACT}.csv",\r
    "Hours export": f"erp_hours_{EXTRACT}.csv",\r
    "Hours export (re-run)": f"erp_hours_{EXTRACT}_rerun.csv",\r
    "OOP export": f"erp_oop_{EXTRACT}.csv",\r
    "PO lines export": f"erp_po_lines_{EXTRACT}.csv",\r
    "People directory": "people_directory.csv",\r
}\r
ERP_KIND = {"summary": "ERP: Project summary", "hours": "ERP: Hours", "oop": "ERP: OOP actuals",\r
            "po": "ERP: PO lines", "directory": "People directory"}\r
TRACKER_TAB = f"{YEAR} Jobs"\r
MONTH_COLS = [f"{m}-{str(YEAR)[2:]}" for m in MONTHS]\r
SUMMARY_GROUPS = {"Labour Budget": "Labour (fee)", "Labour Actuals": "Labour (fee)", "OOP Budget": "OOP / supplier",\r
                  "OOP Actuals": "OOP / supplier", "Open POs": "OOP / supplier", "Total Budget": "Summary",\r
                  "Billing": "Summary"}\r
PEOPLE_COLS = {"Analyst", "Manager", "Account Director"}\r
\r
\r
def slug(s: str) -> str:\r
    return "-".join("".join(c if c.isalnum() else " " for c in s.lower()).split())\r
\r
\r
def client_meta() -> dict[str, dict]:\r
    out = {}\r
    for i, c in enumerate(CLIENTS):\r
        folder = f"P{i + 1} - {c}"\r
        tracker = f"tracker_{slug(c)}_{YEAR}.xlsx"\r
        out[c] = {"code": f"CL{i + 1:02d} {c}", "short": f"CL{i + 1:02d}", "portfolio": f"P{i + 1}", "folder": folder,\r
                  "tracker": tracker, "tracker_path": f"{folder}/Trackers/{tracker}"}\r
    return out\r
\r
\r
def csv_bytes(rows: list[dict]) -> int:\r
    if not rows:\r
        return 0\r
    buf = io.StringIO()\r
    w = csv.DictWriter(buf, fieldnames=list(rows[0]))\r
    w.writeheader()\r
    w.writerows(rows)\r
    return len(buf.getvalue().encode("utf-8"))\r
\r
\r
def file_path(name: str) -> str:\r
    return f"{'Shared/People' if name == 'People directory' else ERP_DIR}/{ERP_FILES[name]}"\r
\r
\r
def source_status(src: dict) -> str:\r
    return "accepted" if src["status"] == "accepted" else f"rejected: {src['reason']}"\r
\r
\r
def app_catalog(files: list[dict], sources: list[dict], cm: dict, role_rows: int) -> list[dict]:\r
    """One entry per synthetic source file: where it sits, what it is, and whether the build reads it."""\r
    all_clients = sorted(CLIENTS)\r
    out = []\r
\r
    def add(path, kind, nbytes, as_of, st, rows, projects, clients, sheets=(), tabs=()):\r
        parts = path.split("/")\r
        out.append({"id": hashlib.sha1(path.encode("utf-8")).hexdigest()[:12], "path": path,\r
                    "portfolio": parts[0].split(" - ")[0] if " - " in parts[0] else "",\r
                    "folder": "/".join(parts[:-1]), "name": parts[-1], "kind": kind,\r
                    "ext": parts[-1].rsplit(".", 1)[1], "bytes": nbytes, "as_of": as_of, "status": st,\r
                    "rows": rows, "projects": projects, "clients": clients, "sheets": list(sheets), "tabs_read": list(tabs)})\r
\r
    for f, src in zip(files, sources):\r
        ids = {r.get("Project ID") or r.get("Job") or r.get("Job Number") for r in f["rows"]} - {None}\r
        st = "read" if src["status"] == "accepted" else source_status(src)\r
        if f["kind"] == "tracker":\r
            c = f["client"]\r
            add(cm[c]["tracker_path"], "Client tracker", 14_000 + 210 * len(f["rows"]), None, st, len(f["rows"]),\r
                len(ids), [c], [TRACKER_TAB, "Archive", "Notes", "Lists"], [TRACKER_TAB])\r
        else:\r
            directory = f["kind"] == "directory"\r
            add(file_path(f["name"]), ERP_KIND[f["schema"]], csv_bytes(f["rows"]), None if directory else EXTRACT,\r
                st, len(f["rows"]), len(ids), [] if directory else all_clients)\r
    add("Shared/People/role_map_2026.xlsx", "Role map", 11_500 + 160 * role_rows, None, "read", role_rows, 0,\r
        all_clients, ["Role map", "Lookups"], ["Role map"])\r
    for c, m in cm.items():  # month-end workbooks the build does not read yet\r
        add(f"{m['folder']}/Month end/poc_report_{POC_MONTH}.xlsx", "Month-end POC report", 48_000 + 900 * len(c),\r
            f"{POC_MONTH}-31", "not read yet: layout not in scope", 0, 0, [c], ["Summary", "POC", "Pivot"])\r
    return sorted(out, key=lambda e: e["path"])\r
\r
\r
def role_map(rng: random.Random) -> dict:\r
    """Synthetic role workbook: one row per client and product; two rows miss their associate director."""\r
    rows = [(c, prod) for c, (_, _, products) in CLIENTS.items() for prod in products]\r
    return {"rows": len(rows), "ad_blank": len(set(rng.sample(range(len(rows)), 2))), "gd_blank": 0}\r
\r
\r
def app_project(p: dict, names: dict, cm: dict, pm: str, contract: str) -> dict:\r
    c = cm[p["client"]]\r
    pct, prev = p["pct_complete"], p["pct_prev"]\r
    return {\r
        "id": p["id"], "name": f"{p['id']} {p['name']}", "client": c["code"], "client_name": p["client"],\r
        "product": p["product"], "portfolio": c["portfolio"], "status": p["status"], "contract": contract,\r
        "start": p["start"], "end": p["end"], "ad": names.get(p["account"]), "cfa": names.get(p["analyst"]),\r
        "cfm": names.get(p["manager"]), "pm": pm, "tracker": c["tracker"] if p["in_tracker"] else None,\r
        "family": CLIENTS[p["client"]][1] if p["in_tracker"] else None,\r
        "budget_source": p["budget_source"],  # "tracker" or "erp"\r
        "revised": p["revised"], "revised_fee": p["revised_fee"], "wd_budget": p["erp_budget"],\r
        "fee_actuals": p["fee_actuals"], "oop_actuals": p["oop_actuals"], "open_po": p["open_po"],\r
        "committed": p["committed"], "remaining": p["remaining"], "burn": p["burn"], "fee_burn": p["fee_burn"],\r
        "pct_complete": pct, "pct_prev": prev,\r
        "jtd_revenue": money(p["revised_fee"] * pct) if pct is not None else None,\r
        "mtd_revenue": money(p["revised_fee"] * (pct - (prev or 0))) if pct is not None else None,\r
        "billing": p["billing"], "unbilled": p["unbilled"], "unapproved_fee": p["unapproved_fee"],\r
        "fee_by_month_2026": p["fee_by_month"],\r
    }\r
\r
\r
def app_reference(rule: str, x: dict) -> str:\r
    if rule == "zero_rate":\r
        n = sum(1 for h in x["hours"] if h["Billable"] == "Yes" and h["Hours"] > 0 and h["Rate"] == 0)\r
        return f"{n} entries"\r
    if rule == "stale_unapproved":\r
        n = sum(1 for h in x["hours"] if h["Status"] in ("Submitted", "Returned")\r
                and (AS_OF - date.fromisoformat(h["Date"])).days > STALE_DAYS)\r
        return f"{n} entries"\r
    if rule == "oop_mismatch":\r
        return f"{sum(1 for o in x['oop'] if abs(o['Billable Amount'] - o['Actual Amount']) > 0.01)} lines"\r
    return ""\r
\r
\r
def app_detail(s: dict, x: dict, trow: dict | None, names: dict, cm: dict) -> dict:\r
    """Every field the synthetic source files hold for one project. Worker names stay out (hours by level)."""\r
    fields = []\r
    for k, v in s.items():\r
        if k in PEOPLE_COLS:\r
            v = names.get(v) or ""\r
        if v not in ("", None):\r
            fields.append([SUMMARY_GROUPS.get(k, "Project information"), k, v])\r
    tracker = None\r
    if trow is not None:\r
        tf, poc_i = [], int(POC_MONTH[5:]) - 1\r
        for k, v in trow.items():\r
            if k in MONTH_COLS:\r
                pv = pct_val(v)\r
                if pv is None:\r
                    continue\r
                tf.append([f"{YEAR} phasing", f"{k} % Complete", pv])\r
                i = MONTH_COLS.index(k)\r
                if i <= poc_i:\r
                    before = (pct_val(trow.get(MONTH_COLS[i - 1])) or 0.0) if i else 0.0\r
                    tf.append([f"{YEAR} phasing", f"{k} JTD Revenue", money(trow["Revised Fee"] * pv)])\r
                    tf.append([f"{YEAR} phasing", f"{k} MTD Revenue", money(trow["Revised Fee"] * (pv - before))])\r
            elif v not in ("", None):\r
                tf.append(["Job" if k in ("Job", "Job Name", "Job Number", "Description") else "Revised SOW", k, v])\r
        tracker = {"file": cm[s["Client"]]["tracker_path"], "tab": TRACKER_TAB, "fields": tf}\r
    agg: dict[tuple, list[float]] = {}\r
    for h in x["hours"]:\r
        a = agg.setdefault((LEVELS.get(h["Rate"], "Other"), h["Status"]), [0.0, 0.0, 0.0])\r
        a[0] += h["Hours"]\r
        a[1] += h["Hours"] if h["Billable"] == "Yes" else 0.0\r
        a[2] += h["Fee Amount"]\r
    hrows = [[lv, st, round(a[0], 2), round(a[1], 2), money(a[2])] for (lv, st), a in sorted(agg.items())]\r
\r
    def lines(rows: list[dict], name: str) -> dict:\r
        if not rows:\r
            return {"columns": [], "rows": [], "total": 0, "file": None}\r
        cols = [c for c in rows[0] if c != "Project ID"]\r
        return {"columns": cols, "rows": [[r[c] for c in cols] for r in rows], "total": len(rows), "file": file_path(name)}\r
\r
    return {"summary": {"file": file_path("Project summary export"), "fields": fields}, "tracker": tracker,\r
            "po": lines(x["po"], "PO lines export"), "oop": lines(x["oop"], "OOP export"),\r
            "hours": {"columns": ["Billing role level", "Status", "Hours", "Billable hours", "Fee"], "rows": hrows,\r
                      "total": len(hrows), "file": file_path("Hours export") if hrows else None}}\r
\r
\r
def app_health(ctx: dict, cm: dict, projects: list[dict], roles: dict) -> dict:\r
    sources = []\r
    for f, src in zip(ctx["files"], ctx["sources"]):\r
        if f["kind"] == "tracker":\r
            continue\r
        row = {"report": f["name"].replace(" (re-run)", ""), "file": file_path(f["name"]),\r
               "status": source_status(src), "rows": src["rows"]}\r
        if f["schema"] == "summary":\r
            row["live"] = len(projects)\r
        sources.append(row)\r
    trackers = [{"file": cm[f["client"]]["tracker_path"], "family": CLIENTS[f["client"]][1], "rows": len(f["rows"])}\r
                for f in ctx["files"] if f["kind"] == "tracker"]\r
    rec = ctx["recon"]\r
    return {\r
        "as_of": EXTRACT, "poc_month": POC_MONTH, "sources": sources, "trackers": trackers,\r
        "parse": {k: ctx["parse"][k] for k in ("tracker_rows", "revised_parsed", "pct_parsed")},\r
        "reconciliation": [{\r
            "check": "Approved fee in time entries vs project summary labour actuals (projects with time entries)",\r
            "expected": 0, "actual": rec["explained"] + rec["for_review"], "of": rec["projects"],\r
            "causes": {"approved after the summary extract (timing)": rec["explained"], "unexplained": rec["for_review"]},\r
            "status": "pass" if rec["for_review"] == 0 else "fail",\r
            "note": "Timing breaks clear on the next extract; the rest need review."}],\r
        "role_gaps": {"projects_without_cfa": sum(p["cfa"] is None for p in projects),\r
                      "projects_without_cfm": sum(p["cfm"] is None for p in projects),\r
                      "rolebook_rows": roles["rows"], "rolebook_gd_blank": roles["gd_blank"],\r
                      "rolebook_ad_blank": roles["ad_blank"]},\r
    }\r
\r
\r
def app_scopes(names: dict) -> list[dict]:\r
    """The viewers: finance ops sees everything under the key "all"; directors see their clients."""\r
    scopes = [{"key": "all", "name": names["o-sam"], "role": "Platform owner", "clients": sorted(CLIENTS)}]\r
    for key, name, role in VIEWERS:\r
        if role != "ops":\r
            scopes.append({"key": f"{APP_ROLE[role].lower()}-{slug(name)}", "name": name, "role": APP_ROLE[role],\r
                           "clients": DIRECTORS.get(key, [])})\r
    scopes.append({"key": f"group-director-{slug(GROUP_DIRECTOR)}", "name": GROUP_DIRECTOR,\r
                   "role": "Group Director", "clients": sorted(CLIENTS)})\r
    return scopes\r
\r
\r
def app_export(snap: dict) -> dict[str, object]:\r
    """{relative path: JSON value} for apps/project-finance/data, in the app's schema (its types.ts)."""\r
    ctx = snap["_ctx"]\r
    rng = random.Random(f"{snap['meta']['seed']}-app")  # own stream, so snapshot.json does not change\r
    cm = client_meta()\r
    names = {k: n for k, n, _ in VIEWERS}\r
    pms = {c: rng.sample(PMS, 3) for c in CLIENTS}\r
    seen_in_client: dict[str, int] = defaultdict(int)\r
    projects = []\r
    for p in snap["projects"]:\r
        k = seen_in_client[p["client"]]\r
        seen_in_client[p["client"]] += 1\r
        contract = f"{cm[p['client']]['short']}-SOW-{k // 6 + 1:02d}"\r
        projects.append(app_project(p, names, cm, rng.choice(pms[p["client"]]), contract))\r
    by_id = {p["id"]: p for p in projects}\r
\r
    oop_by, po_by = defaultdict(list), defaultdict(list)\r
    for o in ctx["data"]["oop"]:\r
        oop_by[o["Project ID"]].append(o)\r
    for x in ctx["data"]["po"]:\r
        po_by[x["Project ID"]].append(x)\r
    exceptions = []\r
    for e in snap["exceptions"]:\r
        p = by_id[e["project_id"]]\r
        x = {**ctx["extra"][p["id"]], "oop": oop_by[p["id"]]}\r
        exceptions.append({"rule": APP_RULE.get(e["rule"], e["rule"]), "project_id": p["id"], "client": p["client"],\r
                           "cfa": p["cfa"], "cfm": p["cfm"], "owner": p["cfa"] or p["cfm"],\r
                           "owner_role": "CFA" if p["cfa"] else "CFM", "amount": e["amount"],\r
                           "reference": app_reference(e["rule"], x), "detail": e["detail"]})\r
    roles = role_map(rng)\r
    health = app_health(ctx, cm, projects, roles)\r
    catalog = app_catalog(ctx["files"], ctx["sources"], cm, roles["rows"])\r
\r
    trows = {}\r
    for f, src in zip(ctx["files"], ctx["sources"]):\r
        if f["kind"] == "tracker" and src["status"] == "accepted":\r
            trows.update({r.get("Job") or r.get("Job Number"): r for r in f["rows"]})\r
    detail_index, chunks = {}, defaultdict(dict)\r
    for s in ctx["data"]["summary"]:\r
        pid = s["Project ID"]\r
        x = {**ctx["extra"][pid], "oop": oop_by[pid], "po": po_by[pid]}\r
        chunk = slug(s["Client"]) + ".json"\r
        detail_index[pid] = chunk\r
        chunks[chunk][pid] = app_detail(s, x, trows.get(pid), names, cm)\r
\r
    planted = {APP_RULE.get(r, r): v for r, v in snap["planted"].items()}\r
    meta = {"exportedAt": snap["meta"]["generated_at"], "asOf": EXTRACT, "pocMonth": POC_MONTH, "scope": "synthetic"}\r
    field = {"CFA": "cfa", "CFM": "cfm", "AD": "ad"}\r
    out: dict[str, object] = {}\r
    index = []\r
    for sc in app_scopes(names):\r
        if sc["role"] in field:\r
            sub = [p for p in projects if p[field[sc["role"]]] == sc["name"]]\r
        else:\r
            sub = [p for p in projects if p["client_name"] in sc["clients"]]\r
        if not sub:\r
            continue\r
        ids = {p["id"] for p in sub}\r
        if sc["role"] == "AD":  # delivery audience: no billing position in the file at all\r
            sub = [{k: v for k, v in p.items() if k not in ("billing", "unbilled")} for p in sub]\r
        seen = {p["client_name"] for p in sub}\r
        files = catalog if sc["role"] == "Platform owner" else [c for c in catalog if seen & set(c["clients"])]\r
        fn = sc["key"] + ".json"\r
        out[fn] = {"meta": {**meta, "viewer": {k: sc[k] for k in ("key", "name", "role")}}, "projects": sub,\r
                   "exceptions": [e for e in exceptions if e["project_id"] in ids],\r
                   "health": health if sc["role"] in HEALTH_ROLES else None, "catalog": files, "planted": planted}\r
        index.append({"key": sc["key"], "file": fn, "name": sc["name"], "role": sc["role"], "projects": len(sub),\r
                      "clients": sorted(seen)})\r
    out["index.json"] = {"meta": meta, "viewers": index}\r
    out["detail/index.json"] = detail_index\r
    for c, rows in sorted(chunks.items()):\r
        out[f"detail/{c}"] = rows\r
    return out\r
\r
\r
def dump_app(files: dict[str, object]) -> dict[str, str]:\r
    return {k: json.dumps(v, separators=(",", ":"), ensure_ascii=False) + "\\n" for k, v in sorted(files.items())}\r
\r
\r
def write_app(files: dict[str, str], out: Path) -> int:\r
    """Replace the JSON in the app data folder (it holds only this build's output)."""\r
    for old in [*out.glob("*.json"), *out.glob("detail/*.json")]:\r
        old.unlink()\r
    for rel, text in files.items():\r
        f = out / rel\r
        f.parent.mkdir(parents=True, exist_ok=True)\r
        f.write_text(text, encoding="utf-8")\r
    return sum(len(t.encode("utf-8")) for t in files.values())\r
\r
\r
def dump(snap: dict) -> str:\r
    return json.dumps({k: v for k, v in snap.items() if not k.startswith("_")}, indent=1) + "\\n"\r
\r
\r
def main() -> None:\r
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])\r
    ap.add_argument("--seed", type=int, default=SEED)\r
    ap.add_argument("--out", type=Path, default=OUT)\r
    ap.add_argument("--app-out", type=Path, default=APP_OUT)\r
    a = ap.parse_args()\r
    snap = build(a.seed)\r
    a.out.parent.mkdir(parents=True, exist_ok=True)\r
    text = dump(snap)\r
    a.out.write_text(text, encoding="utf-8")\r
    print(f"wrote {a.out} ({len(text.encode()) / 1024:.0f} KB): {len(snap['projects'])} projects, "\r
          f"{len(snap['exceptions'])} exceptions")\r
    app = dump_app(app_export(snap))\r
    size = write_app(app, a.app_out)\r
    print(f"wrote {a.app_out} ({size / 1024:.0f} KB in {len(app)} files)")\r
    for r, v in snap["planted"].items():\r
        print(f"  {r:20s} planted {v['planted']:3d}  found {v['found']:3d}" + ("" if v["planted"] == v["found"] else "  MISMATCH"))\r
\r
\r
if __name__ == "__main__":\r
    main()\r
`;export{r as default};
