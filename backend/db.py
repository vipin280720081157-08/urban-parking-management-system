"""Database helpers for SmartPark (psycopg2 + RealDictCursor)."""
import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()


def get_connection():
    """Open a new PostgreSQL connection using credentials from .env."""
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        dbname=os.getenv("DB_NAME", "urban_parking_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
        cursor_factory=psycopg2.extras.RealDictCursor,
    )


def query(sql, params=None, fetch="all"):
    """Run one statement in its own transaction.

    fetch: "all" -> list of dicts, "one" -> dict or None, None -> no rows.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())
            if fetch == "all":
                result = cur.fetchall()
            elif fetch == "one":
                result = cur.fetchone()
            else:
                result = None
        conn.commit()
        return result
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def transaction(statements):
    """Run several statements atomically.

    statements: list of (sql, params, fetch). Returns a list of results.
    """
    conn = get_connection()
    results = []
    try:
        with conn.cursor() as cur:
            for sql, params, fetch in statements:
                cur.execute(sql, params or ())
                if fetch == "all":
                    results.append(cur.fetchall())
                elif fetch == "one":
                    results.append(cur.fetchone())
                else:
                    results.append(None)
        conn.commit()
        return results
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
