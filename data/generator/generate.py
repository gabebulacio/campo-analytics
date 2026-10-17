"""Seeded synthetic data generator for the agri_traceability semantic model.

Writes two raw source systems, mirroring the target architecture:

  data/out/raw/mongo/<collection>.jsonl   documents (producers, fields as GeoJSON,
                                          crop stories, satellite alerts, forms)
  data/out/raw/pg/<table>.jsonl           relational operational tables (clients,
                                          programs, standards, LUC runs, lots ...)

Everything is deterministic for a given --seed and --scale. All producer-level
records are synthetic (data_origin = 'synthetic'); admin areas are real names.
Deliberate anomalies are planted for the result checks (see ANOMALIES).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import random
from datetime import date, datetime, timedelta
from pathlib import Path

from geography import ADMIN_AREAS, BIOME_CONVERSION

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "out" / "raw"
AS_OF = datetime(2026, 10, 1)

ANOMALIES = [
    "Program PRG-11 has lots attributed twice to the same origins -> origin_coverage > 1 in some months.",
    "About 1.5% of field polygons are self-intersecting (geometry_valid = false).",
    "About 12% of completed field-seasons have no emissions recorded (late data).",
    "Lots registered by PRG-04 stopped after 2026-08-15 (freshness check on lot).",
]

STANDARDS = [
    # id, name, family, luc cutoff
    ("EUDR", "EU Deforestation Regulation", "deforestation", "2020-12-31"),
    ("ISCC", "ISCC EU / PLUS", "biofuel", "2008-01-01"),
    ("EPA_45Z", "US 45Z Clean Fuel Production Credit", "biofuel", None),
    ("4C", "4C Coffee Code", "coffee", "2014-01-01"),
    ("2BSVS", "2BSvs Biomass Biofuels", "biofuel", "2008-01-01"),
    ("GHG_PROTOCOL", "GHG Protocol Scope 3", "climate", None),
    ("SBTI_FLAG", "SBTi Forest, Land and Agriculture", "climate", "2020-12-31"),
    ("CORSIA", "CORSIA Sustainability Criteria", "biofuel", "2008-01-01"),
    ("REGEN_KPI", "Regenerative agriculture KPIs", "regenerative", None),
]
LUC_STANDARDS = {s[0]: s[3] for s in STANDARDS if s[3]}

CLIENTS = [
    ("CLI-01", "Granos del Sur Export", "agribusiness", "AR"),
    ("CLI-02", "BioRenova Energía", "biofuel", "AR"),
    ("CLI-03", "Cervecería Andina", "food_beverage", "MX"),
    ("CLI-04", "Malterías Unidas", "food_beverage", "UY"),
    ("CLI-05", "Café Sierra Alta", "food_beverage", "MX"),
    ("CLI-06", "Molinos del Plata", "agribusiness", "AR"),
    ("CLI-07", "Banco Rural Verde", "finance", "AR"),
    ("CLI-08", "Agencia Fitosanitaria Regional", "public_sector", "AR"),
]

# program_id, client, name, commodity, country, admin1 filter (None = any), standards, regen bias, started
PROGRAMS = [
    ("PRG-01", "CLI-01", "Soja libre de deforestación AR", "soy", "AR", ["Buenos Aires", "Córdoba", "Santa Fe", "Chaco", "Santiago del Estero"], ["EUDR", "GHG_PROTOCOL"], 0.0, "2022-07-01"),
    ("PRG-02", "CLI-01", "Soja EUDR Paraguay", "soy", "PY", None, ["EUDR"], -0.05, "2023-07-01"),
    ("PRG-03", "CLI-01", "Maíz Uruguay", "maize", "UY", None, ["EUDR", "REGEN_KPI"], 0.10, "2022-07-01"),
    ("PRG-04", "CLI-02", "Soja biodiésel AR", "soy", "AR", ["Buenos Aires", "Santa Fe", "Entre Ríos"], ["ISCC", "EPA_45Z"], 0.05, "2022-07-01"),
    ("PRG-05", "CLI-02", "Soja Brasil", "soy", "BR", None, ["ISCC", "EUDR"], 0.0, "2023-07-01"),
    ("PRG-06", "CLI-03", "Cebada maltera México", "barley", "MX", ["Guanajuato", "Hidalgo"], ["SBTI_FLAG", "REGEN_KPI", "GHG_PROTOCOL"], 0.15, "2022-07-01"),
    ("PRG-07", "CLI-04", "Cebada regenerativa", "barley", "AR", ["Buenos Aires"], ["REGEN_KPI", "GHG_PROTOCOL"], 0.25, "2022-07-01"),
    ("PRG-08", "CLI-05", "Café Chiapas", "coffee", "MX", ["Chiapas"], ["EUDR", "4C"], 0.05, "2023-07-01"),
    ("PRG-09", "CLI-05", "Café Veracruz", "coffee", "MX", ["Veracruz"], ["EUDR", "4C"], 0.0, "2024-07-01"),
    ("PRG-10", "CLI-06", "Trigo bajo carbono", "wheat", "AR", ["Buenos Aires", "Córdoba"], ["GHG_PROTOCOL", "REGEN_KPI"], 0.15, "2022-07-01"),
    ("PRG-11", "CLI-06", "Girasol sustentable", "sunflower", "AR", ["Buenos Aires", "Córdoba", "Chaco"], ["ISCC"], 0.0, "2023-07-01"),
    ("PRG-12", "CLI-07", "Cartera agrícola Gran Chaco", "soy", "AR", ["Chaco", "Santiago del Estero", "Salta"], ["EUDR", "SBTI_FLAG"], -0.10, "2023-07-01"),
    ("PRG-13", "CLI-08", "Monitoreo de semilleros", "maize", "AR", ["Córdoba", "Buenos Aires"], [], 0.0, "2024-07-01"),
    ("PRG-14", "CLI-02", "Colza para SAF", "rapeseed", "AR", ["Buenos Aires", "Entre Ríos"], ["ISCC", "2BSVS", "CORSIA"], 0.05, "2024-07-01"),
]

CAMPAIGNS = [
    ("2022/23", "2022-07-01", "2023-06-30"),
    ("2023/24", "2023-07-01", "2024-06-30"),
    ("2024/25", "2024-07-01", "2025-06-30"),
    ("2025/26", "2025-07-01", "2026-06-30"),
    ("2026/27", "2026-07-01", "2027-06-30"),
]

CROP = {
    # yield t/ha, N applied kg/ha, N removed kg/t, base kgCO2e/ha
    "soy": (3.0, 0.0, 0.0, 900),
    "maize": (7.8, 125.0, 13.0, 2100),
    "wheat": (3.3, 95.0, 20.0, 1700),
    "barley": (3.9, 85.0, 17.0, 1600),
    "sunflower": (2.1, 40.0, 28.0, 800),
    "coffee": (1.1, 140.0, 32.0, 2600),
    "sorghum": (4.6, 70.0, 15.0, 1300),
    "rapeseed": (2.0, 110.0, 33.0, 1800),
}
ROTATION = {
    "soy": ["maize", "wheat", "sorghum"],
    "maize": ["soy", "wheat"],
    "wheat": ["soy", "maize"],
    "barley": ["soy", "maize"],
    "sunflower": ["wheat", "soy"],
    "rapeseed": ["soy", "maize"],
    "coffee": [],
}


def d(s: str) -> date:
    return date.fromisoformat(s)


def iso(x) -> str | None:
    if x is None:
        return None
    return x.isoformat()


class Gen:
    def __init__(self, seed: int, scale: float):
        self.r = random.Random(seed)
        self.scale = scale
        self.rows: dict[str, list[dict]] = {}

    def add(self, table: str, row: dict) -> None:
        self.rows.setdefault(table, []).append(row)

    def hexhash(self, *parts) -> str:
        return "0x" + hashlib.sha256("|".join(map(str, parts)).encode()).hexdigest()

    # Geometry
    def polygon(self, lat: float, lon: float, area_ha: float, invalid: bool):
        """A rotated rectangle of roughly area_ha around (lat, lon)."""
        side_m = math.sqrt(area_ha * 10_000)
        w, h = side_m * self.r.uniform(1.0, 1.8), side_m / self.r.uniform(1.0, 1.8)
        ang = self.r.uniform(0, math.pi)
        m_per_deg_lat = 111_320.0
        m_per_deg_lon = 111_320.0 * math.cos(math.radians(lat))
        corners = [(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)]
        if invalid:  # bow-tie: swap two vertices -> self-intersection
            corners[1], corners[2] = corners[2], corners[1]
        ring = []
        for x, y in corners:
            xr = x * math.cos(ang) - y * math.sin(ang)
            yr = x * math.sin(ang) + y * math.cos(ang)
            ring.append([round(lon + xr / m_per_deg_lon, 6), round(lat + yr / m_per_deg_lat, 6)])
        ring.append(ring[0])
        geodesic_ha = (w * h) / 10_000
        return {"type": "MultiPolygon", "coordinates": [[ring]]}, round(geodesic_ha, 2)

    # Build
    def build(self) -> None:
        r = self.r
        for sid, name, fam, cutoff in STANDARDS:
            self.add("pg/standards", {"standard_id": sid, "standard_name": name, "standard_family": fam, "luc_cutoff_date": cutoff})
        for cid, name, seg, hq in CLIENTS:
            self.add("pg/clients", {"client_id": cid, "client_name": name, "client_segment": seg, "hq_country": hq, "data_origin": "synthetic"})
        for cid, start, end in CAMPAIGNS:
            self.add("pg/campaigns", {"campaign_id": cid, "hemisphere": "south", "start_date": start, "end_date": end})

        programs = {p[0]: p for p in PROGRAMS}
        for pid, cli, name, comm, country, _a1, stds, _bias, started in PROGRAMS:
            self.add("pg/programs", {"program_id": pid, "client_id": cli, "program_name": name, "commodity": comm, "origin_country": country, "started_on": started, "data_origin": "synthetic"})
            for s in stds:
                self.add("pg/program_standards", {"program_id": pid, "standard_id": s})

        producers_per_program = {pid: max(8, int(self._base_producers(p) * self.scale)) for pid, p in programs.items()}
        field_seq = 0
        producer_seq = 0
        all_field_seasons = []  # (fs dict, program)
        fields_by_program: dict[str, list[dict]] = {}

        for pid, p in programs.items():
            _, cli, _, comm, country, a1s, stds, bias, started = p
            areas = [a for a in ADMIN_AREAS if a[0] == country and (a1s is None or a[1] in a1s)]
            first_campaign = next(i for i, c in enumerate(CAMPAIGNS) if d(c[1]) >= d(started))
            for _ in range(producers_per_program[pid]):
                producer_seq += 1
                prod_id = f"PRD-{producer_seq:05d}"
                if comm == "coffee":
                    size = r.choices(["smallholder", "medium", "large"], [0.85, 0.13, 0.02])[0]
                else:
                    size = r.choices(["smallholder", "medium", "large"], [0.35, 0.45, 0.20])[0]
                channel = r.choices(["whatsapp", "sms", "web"], [0.62, 0.18, 0.20] if size == "smallholder" else [0.45, 0.10, 0.45])[0]
                home = r.choice(areas)
                onboard_c = r.randint(first_campaign, min(first_campaign + 2, len(CAMPAIGNS) - 2))
                onboarded = d(CAMPAIGNS[onboard_c][1]) + timedelta(days=r.randint(0, 90))
                self.add("mongo/producers", {
                    "_id": prod_id, "size_band": size, "contact": {"preferred_channel": channel},
                    "location": {"country": country, "admin1": home[1]},
                    "onboarded_at": iso(onboarded), "programs": [pid], "data_origin": "synthetic",
                })
                n_fields = {"smallholder": r.randint(1, 2), "medium": r.randint(2, 4), "large": r.randint(3, 7)}[size]
                for _f in range(n_fields):
                    field_seq += 1
                    fid = f"FLD-{field_seq:06d}"
                    area = home if r.random() < 0.8 else r.choice(areas)
                    _, a1, a2, biome, lat0, lon0 = area
                    if comm == "coffee":
                        ha = {"smallholder": r.uniform(0.8, 6), "medium": r.uniform(6, 40), "large": r.uniform(40, 150)}[size]
                    else:
                        ha = {"smallholder": r.uniform(15, 80), "medium": r.uniform(80, 400), "large": r.uniform(300, 1400)}[size]
                    invalid = r.random() < 0.015
                    geom, area_ha = self.polygon(lat0 + r.uniform(-0.22, 0.22), lon0 + r.uniform(-0.22, 0.22), ha, invalid)
                    conversion = self._conversion_history(biome, area_ha)
                    field = {
                        "_id": fid, "producer_id": prod_id, "geometry": geom, "area_ha": area_ha,
                        "admin": {"country": country, "admin1": a1, "admin2": a2}, "biome": biome,
                        "geometry_valid": not invalid, "data_origin": "synthetic",
                        "_conversion": conversion,  # hidden truth used to compute LUC; not exported
                    }
                    fields_by_program.setdefault(pid, []).append(field)
                    self.add("mongo/fields", {k: v for k, v in field.items() if not k.startswith("_c")})
                    # crop stories per campaign
                    for ci in range(onboard_c, len(CAMPAIGNS)):
                        fs = self._field_season(fid, field, p, ci, size, bias)
                        if fs:
                            all_field_seasons.append((fs, p, field))

        # LUC assessments: per field x LUC standard of its program
        luc_latest: dict[tuple[str, str], str] = {}
        for pid, fields in fields_by_program.items():
            stds = [s for s in programs[pid][6] if s in LUC_STANDARDS]
            for f in fields:
                for s in stds:
                    luc_latest[(f["_id"], s)] = self._luc(f, s)

        # compliance evaluations
        for fs, p, field in all_field_seasons:
            if fs["program_id"]:
                for s in p[6]:
                    self._compliance(fs, s, luc_latest.get((field["_id"], s)), field)

        # satellite alerts + inspections over all fields
        for pid, fields in fields_by_program.items():
            for f in fields:
                self._alerts(f)
                self._inspections(f)

        # forms per producer x campaign
        for prod in self.rows["mongo/producers"]:
            self._forms(prod)

        # lots + origins
        for pid, p in programs.items():
            if pid == "PRG-13":
                continue
            fss = [fs for fs, pp, _ in all_field_seasons if pp[0] == pid and fs["program_id"] == pid and (fs["harvest"] or {}).get("production_t")]
            self._lots(p, fss)

    def _base_producers(self, p) -> int:
        return {"coffee": 260, "barley": 90}.get(p[3], 110)

    def _conversion_history(self, biome: str, area_ha: float):
        r = self.r
        p_any, p_post = BIOME_CONVERSION[biome]
        events = []
        if r.random() < p_any:
            n = r.randint(1, 2)
            for _ in range(n):
                post = r.random() < p_post
                year = r.randint(2021, 2025) if post else r.randint(2005, 2020)
                events.append({"date": f"{year}-{r.randint(1, 12):02d}-15", "ha": round(area_ha * r.uniform(0.02, 0.35), 2)})
        return {"events": events, "cloudy": r.random() < 0.03}

    def _field_season(self, fid, field, p, ci, size, bias):
        r = self.r
        pid, _cli, _n, comm, *_ = p
        camp, start, end = CAMPAIGNS[ci]
        # program crop most seasons; rotation crop otherwise (outside the program)
        if ROTATION[comm] and r.random() < 0.30:
            crop, program_id = r.choice(ROTATION[comm]), None
        else:
            crop, program_id = comm, pid
        yld, n_ha, n_per_t, base_em = CROP[crop]
        planted = round(field["area_ha"] * r.uniform(0.88, 0.99), 2)
        current = camp == "2026/27"
        latest_closed = camp == "2025/26"
        if current:
            status = r.choices(["not_started", "in_progress"], [0.55, 0.45])[0]
        elif latest_closed:
            status = r.choices(["in_progress", "complete", "signed"], [0.22, 0.28, 0.50])[0]
        else:
            status = r.choices(["complete", "signed"], [0.18, 0.82])[0]
        harvested = production = None
        if not current:
            harvested = round(planted * r.uniform(0.95, 1.0), 2)
            production = round(harvested * yld * r.lognormvariate(0, 0.16), 1)
            if r.random() < 0.05:
                production = None
        year_trend = 0.05 * ci
        p_no_till = min(0.95, (0.25 if comm == "coffee" else 0.72) + bias + year_trend)
        p_cover = min(0.9, 0.12 + bias + 1.6 * year_trend)
        p_rotation = min(0.95, (0.15 if comm == "coffee" else 0.55) + bias / 2 + year_trend)
        no_till, cover, rotation = r.random() < p_no_till, r.random() < p_cover, r.random() < p_rotation
        n_applied = round(planted * n_ha * r.uniform(0.75, 1.25), 1) if n_ha else 0.0
        n_removed = round(production * n_per_t * r.uniform(0.9, 1.1), 1) if (production and n_per_t) else None
        emissions = None
        if status in ("complete", "signed") and r.random() > 0.12:
            em_ha = base_em * r.uniform(0.85, 1.15) - (140 if no_till else 0) - (60 if cover else 0)
            emissions = round(planted * em_ha + n_applied * 5.6, 1)
        signed_at = tx = None
        if status == "signed":
            signed_at = d(end) - timedelta(days=r.randint(0, 120)) if not latest_closed else AS_OF.date() - timedelta(days=r.randint(1, 200))
            signed_at = datetime.combine(signed_at, datetime.min.time()) + timedelta(hours=r.randint(8, 20))
            tx = self.hexhash(fid, camp, crop)
        total = 40
        filled = {"not_started": r.randint(0, 6), "in_progress": r.randint(10, 32), "complete": r.randint(36, 40), "signed": 40}[status]
        fs_id = f"FS-{fid[4:]}-{camp.replace('/', '')}"
        doc = {
            "_id": fs_id, "field_id": fid, "campaign": camp, "program_id": program_id, "crop": crop,
            "area": {"planted_ha": planted, "harvested_ha": harvested},
            "harvest": {"production_t": production} if production is not None else None,
            "inputs": [{"nutrient": "N", "kg": n_applied}] + ([{"nutrient": "N_removed", "kg": n_removed}] if n_removed is not None else []),
            "practices": {"no_till": no_till, "cover_crop": cover, "crop_rotation": rotation},
            "footprint": {"kgco2e": emissions} if emissions is not None else None,
            "status": status,
            "signature": {"signed_at": iso(signed_at), "anchor_tx_hash": tx} if signed_at else None,
            "form": {"required_total": total, "required_filled": filled},
            "data_origin": "synthetic",
        }
        self.add("mongo/crop_stories", doc)
        return doc

    def _luc(self, f, std):
        r = self.r
        cutoff = d(LUC_STANDARDS[std])
        conv = f["_conversion"]
        converted = round(sum(e["ha"] for e in conv["events"] if d(e["date"]) > cutoff), 2)
        if conv["cloudy"]:
            result = "inconclusive"
        elif converted >= 0.5:
            result = "conversion_detected"
        elif converted > 0:
            result = "inconclusive"
        else:
            result = "no_conversion"
        runs = 2 if r.random() < 0.35 else 1
        last = None
        for i in range(runs):
            latest = i == runs - 1
            assessed = AS_OF - timedelta(days=r.randint(15, 160) if latest else r.randint(200, 500))
            # earlier runs were sometimes inconclusive and later resolved
            res = result if latest else r.choice([result, "inconclusive"])
            aid = f"LUC-{f['_id'][4:]}-{std}-{i + 1}"
            self.add("pg/luc_assessments", {
                "luc_assessment_id": aid, "field_id": f["_id"], "standard_id": std,
                "assessed_at": iso(assessed), "is_latest": latest, "luc_result": res,
                "converted_ha_after_cutoff": converted if res == result else 0.0,
                "cutoff_date": iso(cutoff),
                "report_pdf_uri": f"s3://demo-reports/luc/{aid}.pdf", "data_origin": "synthetic",
            })
            last = res
        return last

    def _compliance(self, fs, std, luc_result, field):
        r = self.r
        status, missing = "compliant", 0
        s = fs["status"]
        fp = fs["footprint"]
        practices = sum(fs["practices"].values())
        if fs["campaign"] == "2026/27" and s == "not_started":
            status = "not_applicable"
        elif s not in ("complete", "signed"):
            status, missing = "pending_evidence", r.randint(1, 8)
        elif std in LUC_STANDARDS:
            if not field["geometry_valid"] or luc_result is None or luc_result == "inconclusive":
                status, missing = "pending_evidence", 1
            elif luc_result == "conversion_detected":
                status = "non_compliant"
            elif std == "SBTI_FLAG" and practices < 1:
                status = "non_compliant"
        elif std == "REGEN_KPI":
            status = "compliant" if practices >= 2 else "non_compliant"
        elif std == "GHG_PROTOCOL":
            if fp is None:
                status, missing = "pending_evidence", 1
        elif std == "EPA_45Z":
            if fp is None or not (fs.get("harvest") or {}).get("production_t"):
                status, missing = "pending_evidence", 1
            else:
                ci = fp["kgco2e"] / fs["harvest"]["production_t"]
                status = "compliant" if ci < 420 else "non_compliant"
        self.add("pg/compliance_evaluations", {
            "field_season_id": fs["_id"], "standard_id": std, "compliance_status": status,
            "missing_requirements": missing,
            "evaluated_at": iso(AS_OF - timedelta(days=r.randint(1, 30))), "data_origin": "synthetic",
        })

    def _alerts(self, f):
        r = self.r
        biome = f["biome"]
        start = datetime(2023, 1, 1)
        span = (AS_OF - start).days
        rate = {"chaco": 1.6, "cerrado": 1.3, "atlantic_forest": 0.9, "mesoamerican": 1.1}.get(biome, 0.7)
        n = sum(1 for _ in range(6) if r.random() < rate / 6)
        if f["_conversion"]["events"] and any(e["date"] >= "2021" for e in f["_conversion"]["events"]):
            n += 1  # the conversion shows up as a deforestation alert
        for i in range(n):
            detected = start + timedelta(days=r.randint(0, span), hours=r.randint(0, 23))
            if i == 0 and f["_conversion"]["events"]:
                atype = "deforestation"
            else:
                weights = [0.06, 0.18, 0.12, 0.2, 0.34, 0.10 if f["admin"]["country"] == "AR" else 0.0]
                atype = r.choices(["deforestation", "fire", "flood", "drought", "ndvi_anomaly", "silo_bag"], weights)[0]
            sev = r.choices(["low", "medium", "high"], [0.45, 0.35, 0.2] if atype != "deforestation" else [0.1, 0.3, 0.6])[0]
            age = (AS_OF - detected).days
            resolved = resolution = None
            if r.random() < min(0.95, age / 60):
                resolved = detected + timedelta(hours=r.lognormvariate(math.log(24 * 6), 0.9))
                if resolved > AS_OF:
                    resolved = None
                else:
                    resolution = r.choices(["false_positive", "confirmed", "mitigated"], [0.38, 0.32, 0.30])[0]
            self.add("mongo/satellite_alerts", {
                "_id": f"ALR-{f['_id'][4:]}-{i + 1}", "field_id": f["_id"], "type": atype, "severity": sev,
                "detected_at": iso(detected), "resolution": {"resolved_at": iso(resolved), "outcome": resolution} if resolved else None,
                "source": "sentinel-2", "data_origin": "synthetic",
            })

    def _inspections(self, f):
        r = self.r
        for i in range(r.choices([0, 1, 2], [0.45, 0.4, 0.15])[0]):
            when = datetime(2024, 1, 1) + timedelta(days=r.randint(0, (AS_OF - datetime(2024, 1, 1)).days))
            p_remote = 0.3 + 0.45 * ((when - datetime(2024, 1, 1)).days / 1000)
            mode = "remote" if r.random() < p_remote else "on_site"
            cost = round(r.uniform(9, 22) if mode == "remote" else r.uniform(160, 320), 2)
            self.add("pg/inspections", {
                "inspection_id": f"INS-{f['_id'][4:]}-{i + 1}", "field_id": f["_id"], "inspection_mode": mode,
                "inspected_at": iso(when), "cost_usd": cost, "data_origin": "synthetic",
            })

    def _forms(self, prod):
        r = self.r
        pref = prod["contact"]["preferred_channel"]
        onboarded = d(prod["onboarded_at"])
        seq = 0
        for camp, start, end in CAMPAIGNS:
            if d(end) < onboarded:
                continue
            for ftype in r.sample(["carbon_footprint", "field_audit", "agronomic_practices", "legality_docs"], r.randint(2, 4)):
                seq += 1
                sent = datetime.combine(max(d(start), onboarded), datetime.min.time()) + timedelta(days=r.randint(5, 300), hours=r.randint(7, 20))
                if sent > AS_OF:
                    continue
                channel = pref if r.random() < 0.85 else r.choice(["whatsapp", "sms", "web"])
                p_resp, median_h = {"whatsapp": (0.84, 5), "sms": (0.62, 18), "web": (0.55, 40)}[channel]
                responded = None
                if r.random() < p_resp:
                    responded = sent + timedelta(hours=r.lognormvariate(math.log(median_h), 1.1))
                    if responded > AS_OF:
                        responded = None
                self.add("mongo/form_dispatches", {
                    "_id": f"FRM-{prod['_id'][4:]}-{seq:03d}", "producer_id": prod["_id"], "program_id": prod["programs"][0],
                    "form_type": ftype, "channel": channel, "sent_at": iso(sent),
                    "response": {"responded_at": iso(responded)} if responded else None, "data_origin": "synthetic",
                })

    def _lots(self, p, fss):
        r = self.r
        pid, _cli, _n, comm, country, *_ = p
        if not fss:
            return
        seg_rate = 0.85 if "EUDR" in p[6] else 0.45
        qr_rate = {"coffee": 40, "barley": 25}.get(comm, 0)
        sites = [f"SITE-{pid[4:]}-{i}" for i in range(1, 4)]
        by_campaign: dict[str, list] = {}
        for fs in fss:
            by_campaign.setdefault(fs["campaign"], []).append(fs)
        lot_seq = 0
        for camp, items in sorted(by_campaign.items()):
            _, start, end = next(c for c in CAMPAIGNS if c[0] == camp)
            r.shuffle(items)
            i = 0
            while i < len(items):
                chunk = items[i:i + r.randint(2, 6)]
                i += len(chunk)
                lot_seq += 1
                lot_id = f"LOT-{pid[4:]}-{lot_seq:05d}"
                origin_vol = sum(fs["harvest"]["production_t"] for fs in chunk)
                coverage = r.uniform(0.72, 0.99)
                volume = round(origin_vol / coverage, 1)
                registered = datetime.combine(d(end), datetime.min.time()) - timedelta(days=r.randint(-90, 150))
                if registered > AS_OF:
                    registered = AS_OF - timedelta(days=r.randint(1, 60))
                if pid == "PRG-04" and registered > datetime(2026, 8, 15):
                    registered = datetime(2026, 8, 15) - timedelta(days=r.randint(0, 40))
                site_type = r.choices(["collection", "processing", "export"], [0.6, 0.3, 0.1])[0]
                self.add("pg/lots", {
                    "lot_id": lot_id, "program_id": pid, "site_id": r.choice(sites), "site_type": site_type,
                    "commodity": comm, "registered_at": iso(registered), "volume_t": volume,
                    "segregated": r.random() < seg_rate, "qr_scans": int(r.expovariate(1 / qr_rate)) if qr_rate else 0,
                    "data_origin": "synthetic",
                })
                for fs in chunk:
                    self.add("pg/lot_origins", {"lot_id": lot_id, "field_season_id": fs["_id"], "volume_t": fs["harvest"]["production_t"]})
                # ANOMALY: PRG-11 double-attributes some lots in 2024/25 (data-entry duplication)
                if pid == "PRG-11" and camp == "2024/25" and r.random() < 0.5:
                    extra = r.choice(items)
                    if extra["_id"] not in {c["_id"] for c in chunk}:
                        self.add("pg/lot_origins", {"lot_id": lot_id, "field_season_id": extra["_id"], "volume_t": round(volume * 0.6, 1)})

    # Output
    def write(self) -> dict[str, int]:
        counts = {}
        for name, rows in sorted(self.rows.items()):
            path = OUT / f"{name}.jsonl"
            path.parent.mkdir(parents=True, exist_ok=True)
            with path.open("w", encoding="utf-8") as fh:
                for row in rows:
                    fh.write(json.dumps(row, ensure_ascii=False) + "\n")
            counts[name] = len(rows)
        manifest = {"as_of": AS_OF.isoformat(), "counts": counts, "anomalies": ANOMALIES}
        (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
        return counts


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--scale", type=float, default=1.0)
    a = ap.parse_args()
    g = Gen(a.seed, a.scale)
    g.build()
    counts = g.write()
    for k, v in counts.items():
        print(f"{k:32s} {v:>8,d}")


if __name__ == "__main__":
    main()
