"""Build deploy/api-bundle/: the pipeline as a Vercel Python serverless function.

  python deploy/build_api_bundle.py      (after `python tasks.py seed`)
  cd deploy/api-bundle && vercel deploy --prod

The bundle mirrors the repo layout so app/config.py resolves paths unchanged,
and ships the prebuilt read-only DuckDB marts (synthetic data, ~19 MB).
"""

from __future__ import annotations

import json
import os
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get("BUNDLE_DIR", str(ROOT / "deploy" / "api-bundle")))

REQUIREMENTS = """fastapi>=0.115
pydantic>=2.8
pyyaml>=6.0
sqlglot>=25.0
duckdb>=1.1
anthropic>=1.0
rapidfuzz>=3.9
python-dotenv>=1.0
httpx>=0.27
"""

INDEX = '''"""Vercel FastAPI entrypoint (zero-config): exposes `app`."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "backend" / "pipeline"))

from app.main import app  # noqa: E402,F401
'''

VERCEL = {"framework": "fastapi"}


def main() -> None:
    db = ROOT / "data" / "out" / "analytics.duckdb"
    vd = ROOT / "data" / "out" / "value_dictionaries.json"
    if not db.exists() or not vd.exists():
        raise SystemExit("run `python tasks.py seed` first")
    # keep .vercel/ (project link) across rebuilds
    if OUT.exists():
        for child in OUT.iterdir():
            if child.name != ".vercel":
                shutil.rmtree(child) if child.is_dir() else child.unlink()
    OUT.mkdir(parents=True, exist_ok=True)
    shutil.copytree(ROOT / "services" / "pipeline" / "app", OUT / "backend" / "pipeline" / "app", ignore=shutil.ignore_patterns("__pycache__"))
    (OUT / "docs" / "semantic-layer").mkdir(parents=True)
    shutil.copy(ROOT / "docs" / "semantic-layer" / "agri_traceability.yaml", OUT / "docs" / "semantic-layer")
    (OUT / "data" / "out").mkdir(parents=True)
    shutil.copy(db, OUT / "data" / "out")
    shutil.copy(vd, OUT / "data" / "out")
    (OUT / "data" / "generator").mkdir(parents=True)
    shutil.copy(ROOT / "data" / "generator" / "geography.py", OUT / "data" / "generator")
    (OUT / "evals").mkdir()
    if (ROOT / "evals" / "report.json").exists():
        shutil.copy(ROOT / "evals" / "report.json", OUT / "evals")
    (OUT / "index.py").write_text(INDEX, encoding="utf-8")
    (OUT / "requirements.txt").write_text(REQUIREMENTS, encoding="utf-8")
    (OUT / "vercel.json").write_text(json.dumps(VERCEL, indent=2), encoding="utf-8")
    (OUT / ".python-version").write_text("3.12\n", encoding="utf-8")
    (OUT / ".vercelignore").write_text(".env*\n**/__pycache__\n", encoding="utf-8")
    size = sum(f.stat().st_size for f in OUT.rglob("*") if f.is_file()) / 1e6
    print(f"bundle ready: {OUT} ({size:.1f} MB)")


if __name__ == "__main__":
    main()
