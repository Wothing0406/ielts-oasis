"""Add Meowcha run/snapshot tables without altering or deleting existing data.

Run after configuring the same DATABASE_URL as the API:
    python backend/migrations/meowcha_runs_v1.py
The normal API startup also creates these missing tables through Base.metadata.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from database import engine
from meowcha_integrity import MeowchaRun, MeowchaSaveSnapshot


def migrate(bind):
    MeowchaRun.__table__.create(bind=bind, checkfirst=True)
    MeowchaSaveSnapshot.__table__.create(bind=bind, checkfirst=True)


if __name__ == '__main__':
    migrate(engine)
    print('Meowcha run and snapshot tables are ready. Existing records were retained.')
