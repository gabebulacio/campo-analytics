"""Settings from environment (.env.local at the repo root is loaded if present)."""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[3]
load_dotenv(ROOT / ".env.local")
load_dotenv(ROOT / ".env")


def _bool(name: str, default: bool) -> bool:
    v = os.getenv(name)
    return default if v is None else v.strip().lower() in ("1", "true", "yes", "on")


@dataclass(frozen=True)
class Settings:
    root: Path = ROOT
    semantic_path: Path = ROOT / "docs" / "semantic-layer" / "agri_traceability.yaml"
    duckdb_path: Path = ROOT / "data" / "out" / "analytics.duckdb"
    value_dict_path: Path = ROOT / "data" / "out" / "value_dictionaries.json"
    traces_path: Path = ROOT / "data" / "out" / "traces.jsonl"
    evals_report_path: Path = ROOT / "evals" / "report.json"
    database_url_reader: str | None = os.getenv("DATABASE_URL_READER") or None
    anthropic_api_key: str | None = os.getenv("ANTHROPIC_API_KEY") or None
    # Needed only for keys not scoped to a workspace (Console -> Settings -> Workspaces -> ID).
    anthropic_workspace_id: str | None = os.getenv("ANTHROPIC_WORKSPACE_ID") or None
    model_planner: str = os.getenv("LLM_MODEL_PLANNER", "claude-sonnet-5-5")
    model_fast: str = os.getenv("LLM_MODEL_FAST", "claude-haiku-5-5")
    max_output_tokens: int = int(os.getenv("MAX_OUTPUT_TOKENS", "2000"))
    # Spend guard: above this many US$ of LLM usage per day, serve only verified/cached answers.
    daily_budget_usd: float = float(os.getenv("DAILY_BUDGET_USD", "0.50"))
    rate_limit_per_ip_per_day: int = int(os.getenv("RATE_LIMIT_PER_IP_PER_DAY", "15"))
    demo_mode: bool = _bool("DEMO_MODE", True)
    exploratory_sql: bool = _bool("EXPLORATORY_SQL", False)
    statement_timeout_s: float = 5.0
    row_limit: int = 5000
    # Fixed as-of date so relative dates ("last season") are reproducible.
    as_of: date = date.fromisoformat(os.getenv("AS_OF_DATE", "2026-10-01"))
    cors_origins: tuple[str, ...] = tuple(o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip())

    @property
    def engine(self) -> str:
        return "postgres" if self.database_url_reader else "duckdb"


settings = Settings()
