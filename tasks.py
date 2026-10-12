"""Cross-platform task runner (Windows has no `make`). The Makefile delegates here.

  python tasks.py setup        create .venv, install Python + web deps
  python tasks.py seed         generate synthetic data + build local DuckDB marts + value dictionaries
  python tasks.py elt          rebuild marts from existing raw files
  python tasks.py elt-neon     load raw -> Neon Postgres (needs DATABASE_URL_OWNER)
  python tasks.py migrate      raw docs -> MongoDB Atlas -> ELT from Mongo -> Postgres marts (DuckDB if no Postgres URL yet)
  python tasks.py dev          run pipeline (:8000) + web (:3000)
  python tasks.py api          run only the pipeline
  python tasks.py web          run only the web app
  python tasks.py test         pytest (pipeline + data tests)
  python tasks.py evals        run the golden-set evals -> evals/report.md + report.json
  python tasks.py schemas      export shared JSON Schemas to packages/schemas
"""

from __future__ import annotations

import os
import shutil
import signal
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VENV = ROOT / ".venv"
PY = VENV / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
WEB = ROOT / "apps" / "web"
PIPE = ROOT / "services" / "pipeline"
NPM = "npm.cmd" if os.name == "nt" else "npm"


def run(cmd: list, cwd: Path = ROOT, env: dict | None = None) -> None:
    print("$", " ".join(map(str, cmd)))
    r = subprocess.run(cmd, cwd=cwd, env={**os.environ, **(env or {})})
    if r.returncode:
        sys.exit(r.returncode)


def py() -> str:
    return str(PY if PY.exists() else sys.executable)


def setup() -> None:
    if not PY.exists():
        run([sys.executable, "-m", "venv", str(VENV)])
    run([py(), "-m", "pip", "install", "-q", "--upgrade", "pip"])
    run([py(), "-m", "pip", "install", "-q", "-r", str(PIPE / "requirements.txt")])
    run([NPM, "install", "--no-audit", "--no-fund"], cwd=WEB)
    env_local = ROOT / ".env.local"
    if not env_local.exists():
        shutil.copy(ROOT / ".env.example", env_local)
        print("created .env.local from .env.example - add your ANTHROPIC_API_KEY there")


def seed() -> None:
    run([py(), "data/generator/generate.py"])
    elt()


def elt() -> None:
    run([py(), "data/elt/run.py"])
    run([py(), "-c", "from app import values; v = values.build(); print('value dictionaries:', {k: len(x) for k, x in v['values'].items()})"], cwd=PIPE)


def elt_neon() -> None:
    run([py(), "data/elt/run.py", "--target", "postgres"])


def migrate() -> None:
    from dotenv import load_dotenv

    load_dotenv(ROOT / ".env.local")
    target = "postgres" if os.environ.get("DATABASE_URL_OWNER") else "duckdb"
    run([py(), "data/loaders/load_mongo.py"])
    run([py(), "data/elt/run.py", "--source", "mongo", "--target", target])
    run([py(), "-c", "from app import values; v = values.build(); print('value dictionaries:', {k: len(x) for k, x in v['values'].items()})"], cwd=PIPE)
    print(f"\n  documents from MongoDB, marts on {target}")


def api() -> None:
    run([py(), "-m", "uvicorn", "app.main:app", "--port", "8001", "--reload"], cwd=PIPE)


def web() -> None:
    run([NPM, "run", "dev"], cwd=WEB)


def dev() -> None:
    procs = [
        subprocess.Popen([py(), "-m", "uvicorn", "app.main:app", "--port", "8001"], cwd=PIPE),
        subprocess.Popen([NPM, "run", "dev"], cwd=WEB),
    ]
    print("\n  pipeline  http://localhost:8001/health\n  web       http://localhost:3000\n  (Ctrl+C to stop)\n")
    try:
        for p in procs:
            p.wait()
    except KeyboardInterrupt:
        for p in procs:
            p.send_signal(signal.SIGINT) if os.name != "nt" else p.terminate()


def test() -> None:
    run([py(), "-m", "pytest", "-q", "services/pipeline/tests", "data/tests"])


def evals() -> None:
    run([py(), "evals/run.py", *sys.argv[2:]])


def schemas() -> None:
    run([py(), "-c", "from app.schemas_export import main; main()"], cwd=PIPE)


TASKS = {"setup": setup, "seed": seed, "elt": elt, "elt-neon": elt_neon, "migrate": migrate, "dev": dev, "api": api, "web": web, "test": test, "evals": evals, "schemas": schemas}

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in TASKS:
        print(__doc__)
        sys.exit(1)
    TASKS[sys.argv[1]]()
