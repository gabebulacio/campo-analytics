"""Read-only query execution.

DuckDB (local): the database file is opened with read_only=True, so writes fail
at the engine level. Postgres (Neon): connects as app_reader (SELECT-only on
marts), with a read-only transaction and a statement timeout.
Both: SQL must parse as a single SELECT over the marts schema (sqlglot).
"""

from __future__ import annotations

import re
import threading
import time
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal

import sqlglot
from sqlglot import exp

from .config import settings


class ExecutionError(Exception):
    pass


@dataclass
class Result:
    columns: list[str]
    rows: list[list]
    elapsed_ms: int
    truncated: bool = False


ALLOWED_SCHEMAS = {"marts"}


def assert_read_only(sql: str) -> None:
    """Single SELECT; only tables in allowed schemas (CTE names excepted)."""
    try:
        trees = sqlglot.parse(sql, read="postgres")
    except sqlglot.errors.ParseError as e:
        raise ExecutionError(f"SQL does not parse: {e}") from e
    if len(trees) != 1 or not isinstance(trees[0], exp.Select | exp.Union):
        raise ExecutionError("only a single SELECT statement is allowed")
    tree = trees[0]
    for node in tree.walk():
        if isinstance(node, exp.Insert | exp.Update | exp.Delete | exp.Create | exp.Drop | exp.Alter | exp.Command):
            raise ExecutionError("write statements are not allowed")
    ctes = {c.alias_or_name for c in tree.find_all(exp.CTE)}
    for t in tree.find_all(exp.Table):
        if t.name in ctes and not t.db:
            continue
        if t.db not in ALLOWED_SCHEMAS:
            raise ExecutionError(f"table {t.sql()} is outside the allowed schemas")


def _clean(v):
    if isinstance(v, Decimal):
        return float(v)
    if isinstance(v, datetime):
        return v.strftime("%Y-%m") if v.day == 1 and v.hour == 0 and v.minute == 0 else v.isoformat()
    if isinstance(v, date):
        return v.isoformat()
    if isinstance(v, float):
        return round(v, 6)
    return v


def execute(sql: str, params: list, display_sql: str | None = None, max_rows: int | None = None) -> Result:
    assert_read_only(display_sql or sql)
    max_rows = max_rows or settings.row_limit
    t0 = time.perf_counter()
    if settings.engine == "postgres":
        cols, rows = _pg(sql, params, max_rows)
    else:
        cols, rows = _duck(sql, params, max_rows)
    truncated = len(rows) > max_rows
    rows = [[_clean(v) for v in r] for r in rows[:max_rows]]
    return Result(cols, rows, int((time.perf_counter() - t0) * 1000), truncated)


def _duck(sql: str, params: list, max_rows: int):
    import duckdb

    if not settings.duckdb_path.exists():
        raise ExecutionError("local database not built yet - run: python tasks.py seed")
    con = duckdb.connect(str(settings.duckdb_path), read_only=True)
    timer = threading.Timer(settings.statement_timeout_s, con.interrupt)
    timer.start()
    try:
        cur = con.execute(sql, params)
        cols = [d[0] for d in cur.description]
        rows = cur.fetchmany(max_rows + 1)
        return cols, rows
    except duckdb.InterruptException as e:
        raise ExecutionError(f"query exceeded {settings.statement_timeout_s:.0f}s timeout") from e
    except duckdb.Error as e:
        raise ExecutionError(str(e)) from e
    finally:
        timer.cancel()
        con.close()


_PARAM = re.compile(r"\$(\d+)")


def _pg(sql: str, params: list, max_rows: int):
    import psycopg

    order = [int(m) for m in _PARAM.findall(sql)]
    pg_sql = _PARAM.sub("%s", sql.replace("%", "%%"))
    pg_params = [params[i - 1] for i in order]
    try:
        with psycopg.connect(settings.database_url_reader, connect_timeout=5) as con:
            con.execute(f"set statement_timeout = {int(settings.statement_timeout_s * 1000)}")
            con.execute("set default_transaction_read_only = on")
            with con.cursor() as cur:
                cur.execute(pg_sql, pg_params)
                cols = [d.name for d in cur.description]
                rows = cur.fetchmany(max_rows + 1)
                return cols, [list(r) for r in rows]
    except psycopg.Error as e:
        raise ExecutionError(str(e).strip()) from e
