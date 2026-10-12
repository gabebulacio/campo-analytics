"""Export the shared JSON Schemas (Python models are the source) to packages/schemas/.

The web app's TypeScript types (apps/web/lib/types.ts) mirror these; a CI step
re-exports and fails on diff so the two sides cannot drift.
"""

from __future__ import annotations

import json

from .config import settings
from .plan import QueryPlan


def main() -> None:
    out = settings.root / "packages" / "schemas"
    out.mkdir(parents=True, exist_ok=True)
    schema = QueryPlan.model_json_schema()
    schema["$id"] = "https://demo.gabrielbulacio.com/schemas/queryplan.schema.json"
    (out / "queryplan.schema.json").write_text(json.dumps(schema, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {out / 'queryplan.schema.json'}")


if __name__ == "__main__":
    main()
