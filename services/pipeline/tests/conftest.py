import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import semantic  # noqa: E402
from app.config import settings  # noqa: E402


@pytest.fixture(scope="session")
def sl():
    return semantic.get()


@pytest.fixture(scope="session", autouse=True)
def _db_ready():
    if settings.engine == "duckdb" and not settings.duckdb_path.exists():
        pytest.skip("local database not built - run: python tasks.py seed", allow_module_level=True)
