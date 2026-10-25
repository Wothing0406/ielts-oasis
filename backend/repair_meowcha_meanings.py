"""Idempotently repair only placeholder game rows; back up each changed row first.

Run inside the backend: python repair_meowcha_meanings.py --backup /tmp/meanings.json
Copy that backup to durable private host storage before replacing the container.
"""
import argparse
import json
from pathlib import Path

from database import SessionLocal
from models import MeowchaVocab
from meowcha_learning import normalize_word


def repair(db, backup):
    rows = db.query(MeowchaVocab).filter(MeowchaVocab.meaning.ilike('%Từ vựng học thuật%')).all()
    changes = []
    for row in rows:
        result = normalize_word({'word': row.word, 'type': row.part_of_speech, 'meaning': row.meaning})
        if not result['meaning']:
            raise ValueError('No reviewed meaning for ' + row.word)
        changes.append({'id': row.id, 'word': row.word, 'meaning': row.meaning,
                        'part_of_speech': row.part_of_speech, 'new_meaning': result['meaning']})
    if changes:
        # Exclusive creation prevents overwriting the original rollback evidence on reruns.
        with Path(backup).open('x', encoding='utf-8') as stream:
            json.dump(changes, stream, ensure_ascii=False, indent=2)
        for row, change in zip(rows, changes):
            row.meaning = change['new_meaning']
        db.commit()
    return len(changes)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--backup', required=True)
    args = parser.parse_args()
    with SessionLocal() as db:
        print(json.dumps({'repaired': repair(db, args.backup)}))
