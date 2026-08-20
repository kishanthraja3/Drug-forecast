import os
import sys

import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text


# ============================================================
# PROJECT SETUP
# ============================================================

PROJECT_ROOT = r"C:\Users\kisha\Downloads\Projects\Drug Forecast-CTS NPN"

sys.path.append(PROJECT_ROOT)

load_dotenv(
    dotenv_path=os.path.join(PROJECT_ROOT, ".env")
)


# ============================================================
# TEST GOLD TABLES
# ============================================================

def test_gold_tables():

    print("=== Testing Databricks Gold Tables Query ===")

    # --------------------------------------------------------
    # Load environment variables
    # --------------------------------------------------------

    host = os.getenv("DATABRICKS_SERVER_HOSTNAME")
    http_path = os.getenv("DATABRICKS_HTTP_PATH")
    token = os.getenv("DATABRICKS_TOKEN")

    catalog = os.getenv(
        "DATABRICKS_CATALOG",
        "drug_forecasting"
    )

    schema = os.getenv(
        "DATABRICKS_SCHEMA",
        "gold"
    )

    table_bass = os.getenv(
        "TABLE_BASS_FINAL",
        "bass_features"
    )

    table_weekly = os.getenv(
        "TABLE_WEEKLY_RX_FINAL",
        "weekly_rx"
    )

    table_similarity = os.getenv(
        "TABLE_SIMILARITY_FEATURES",
        "analog_features"
    )

    # --------------------------------------------------------
    # Validate credentials
    # --------------------------------------------------------

    if not host:
        print("[ERROR] DATABRICKS_SERVER_HOSTNAME missing")
        return

    if not http_path:
        print("[ERROR] DATABRICKS_HTTP_PATH missing")
        return

    if not token:
        print("[ERROR] DATABRICKS_TOKEN missing")
        return

    # --------------------------------------------------------
    # Connection
    # --------------------------------------------------------

    try:

        connection_url = (
            f"databricks://token:{token}"
            f"@{host}"
            f"?http_path={http_path}"
            f"&catalog={catalog}"
            f"&schema={schema}"
        )

        print(f"\nConnecting to Databricks...")
        print(f"Host    : {host}")
        print(f"Catalog : {catalog}")
        print(f"Schema  : {schema}")

        engine = create_engine(connection_url)

        # ----------------------------------------------------
        # Open SQLAlchemy connection
        # ----------------------------------------------------

        with engine.connect() as connection:

            print("\n[SUCCESS] Connected to Databricks SQL Warehouse.")

            # =================================================
            # TABLE 1 — BASS
            # =================================================

            print(f"\nQuerying: {catalog}.{schema}.{table_bass}")

            query = text(
                f"""
                SELECT *
                FROM {catalog}.{schema}.{table_bass}
                LIMIT 5
                """
            )
            result = connection.execute(query)

            df_bass = pd.DataFrame(
                result.fetchall(),
                columns=result.keys()
            )

            print(
                f"[SUCCESS] Loaded "
                f"{len(df_bass)} rows."
            )

            print("Columns:")
            print(list(df_bass.columns))

            print("\nSample:")
            print(df_bass)

            # =================================================
            # TABLE 2 — WEEKLY RX
            # =================================================

            print(f"\nQuerying: {catalog}.{schema}.{table_weekly}")

            query = text(
                f"""
                SELECT *
                FROM {catalog}.{schema}.{table_weekly}
                LIMIT 5
                """
            )

            result = connection.execute(query)

            df_weekly = pd.DataFrame(
                result.fetchall(),
                columns=result.keys()
            )
            print(
                f"[SUCCESS] Loaded "
                f"{len(df_weekly)} rows."
            )

            print("Columns:")
            print(list(df_weekly.columns))

            print("\nSample:")
            print(df_weekly)

            # =================================================
            # TABLE 3 — ANALOG FEATURES
            # =================================================

            print(
                f"\nQuerying: "
                f"{catalog}.{schema}.{table_similarity}"
            )

            query = text(
                f"""
                SELECT *
                FROM {catalog}.{schema}.{table_similarity}
                LIMIT 5
                """
            )

            result = connection.execute(query)

            df_sim = pd.DataFrame(
                result.fetchall(),
                columns=result.keys()
            )

            print(
                f"[SUCCESS] Loaded "
                f"{len(df_sim)} rows."
            )

            print("Columns:")
            print(list(df_sim.columns))

            print("\nSample:")
            print(df_sim)

        # ----------------------------------------------------
        # DONE
        # ----------------------------------------------------

        print(
            "\n=============================================="
        )
        print(
            " GOLD TABLE TEST COMPLETED SUCCESSFULLY"
        )
        print(
            "=============================================="
        )

    except Exception as e:

        print(
            "\n[ERROR] Failed to query Gold tables:"
        )

        print(type(e).__name__)
        print(str(e))


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    test_gold_tables()