# Reference data sources

Phase 1b is not built yet. In the current build, all producer-level data is **synthetic**. Admin-area names are real, and centroids are approximate (`data/generator/geography.py`).

Planned sources (licence and version to be confirmed and pinned when each is fetched):

| Layer | Source | Use |
|---|---|---|
| Forest cover 2020 (EUDR cutoff) | EC JRC Global Forest Cover 2020 v4 — Earth Engine `JRC/GFC2020/V4` | forest area at cutoff per field |
| Land cover / conversion by year (Argentina) | MapBiomas Argentina collection | conversion after cutoff, conversion year |
| Official crop estimates | datos.gob.ar agro estimates; Buenos Aires province estimates | field placement weights, yield distributions |
| Admin boundaries | IGN Argentina (or GADM; check licence) | department polygons, official area |
| Tree cover loss (optional) | Hansen / Global Forest Watch via Earth Engine | second opinion → `inconclusive` |
| Emission factors | IPCC defaults | `emissions_kgco2e` |

Each fetched file will record its URL, licence, version, access date, checksum and citation here.
