"""Isolated SQLite API tests: no production database, credentials or network."""
import os
import sys
import time
import unittest
from datetime import datetime, timedelta
from pathlib import Path
from uuid import uuid4

os.environ['DATABASE_URL'] = 'sqlite://'
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from models import User, MeowchaUserProfile, MeowchaBattleLog, MeowchaLeaderboard
from meowcha_integrity import MeowchaRun, MeowchaSaveSnapshot, RunComplete
from meowcha_routes import router, get_meowcha_user_from_token

class IntegrityTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()
        self.user = User(username='alice', discord_id='test-alice')
        self.other = User(username='bob', discord_id='test-bob')
        self.db.add_all([self.user, self.other]); self.db.commit()
        app = FastAPI(); app.include_router(router)
        app.dependency_overrides[get_db] = lambda: self.db
        app.dependency_overrides[get_meowcha_user_from_token] = lambda: self.user
        self.app = app
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close(); self.db.close(); self.engine.dispose()

    def start(self, mode='DIRECT', deck='oxford_5000', resumed=False):
        run_id = str(uuid4())
        response = self.client.post('/api/meowcha/runs', json={'run_id': run_id,
            'game_mode': mode, 'deck_id': deck, 'resumed': resumed})
        self.assertEqual(response.status_code, 200, response.text)
        run = self.db.get(MeowchaRun, run_id); run.started_at = datetime.utcnow() - timedelta(seconds=60)
        self.db.commit()
        return run_id

    def payload(self, run_id, **changes):
        value = dict(run_id=run_id, score=450, words_slain=3, realm_idx=0, active_ms=60_000,
            correct_keystrokes=15, total_keystrokes=20, assisted_keystrokes=0,
            assisted_words=0, assisted=False, is_victory=False)
        value.update(changes); return value

    def test_retry_and_all_completion_aliases_credit_exactly_once(self):
        payload = self.payload(self.start())
        for endpoint in ['runs/complete', 'profile/sync', 'leaderboard', 'runs/complete']:
            response = self.client.post('/api/meowcha/' + endpoint, json=payload)
            self.assertEqual(response.status_code, 200, response.text)
        profile = self.db.query(MeowchaUserProfile).one()
        self.assertEqual((profile.total_score, profile.total_words_slain, profile.games_played, profile.spirit_stones), (450, 3, 1, 6))
        self.assertEqual(self.db.query(MeowchaBattleLog).count(), 1)
        data = self.client.get('/api/meowcha/leaderboard').json()['data']
        self.assertEqual(len(data), 1); self.assertEqual(data[0]['wpm'], 3)
        self.assertEqual(data[0]['accuracy'], 75)

    def test_names_never_select_owner_and_foreign_runs_are_rejected(self):
        run_id = self.start()
        self.app.dependency_overrides[get_meowcha_user_from_token] = lambda: self.other
        self.assertEqual(self.client.post('/api/meowcha/runs/complete', json=self.payload(run_id)).status_code, 404)
        self.assertEqual(self.client.post('/api/meowcha/runs', json={'run_id': run_id, 'game_mode': 'DIRECT'}).status_code, 403)
        own = self.start(); response = self.client.post('/api/meowcha/runs/complete', json=self.payload(own, player_name='alice', user_id=self.user.id))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['data']['user_id'], self.other.id)
        self.assertIsNone(self.db.query(MeowchaUserProfile).filter_by(user_id=self.user.id).first())

    def test_malformed_impossible_and_old_score_payloads_fail(self):
        run_id = self.start()
        for changes in [dict(score=-1), dict(score=90_000_000), dict(correct_keystrokes=30, total_keystrokes=1),
            dict(active_ms=1000, correct_keystrokes=1000, total_keystrokes=1000),
            dict(active_ms=600_000), dict(realm_idx=5), dict(assisted_words=4)]:
            response = self.client.post('/api/meowcha/runs/complete', json=self.payload(run_id, **changes))
            self.assertEqual(response.status_code, 422, response.text)
            self.db.rollback()
        self.assertEqual(self.client.post('/api/meowcha/leaderboard', json={'player_name': 'alice', 'score': 1_000_000}).status_code, 422)

    def test_guest_cannot_write_rank_profile_or_shared_cloud_slots(self):
        self.app.dependency_overrides[get_meowcha_user_from_token] = lambda: None
        self.assertEqual(self.client.post('/api/meowcha/runs', json={'run_id': str(uuid4()), 'game_mode': 'DIRECT'}).status_code, 401)
        for endpoint in ['runs/complete', 'profile/sync', 'leaderboard']:
            self.assertEqual(self.client.post('/api/meowcha/' + endpoint, json=self.payload(str(uuid4()))).status_code, 401)
        self.assertEqual(self.client.get('/api/meowcha/saves').status_code, 401)
        self.assertEqual(self.client.post('/api/meowcha/saves/1', json={'slot_id': 1}).status_code, 401)
        self.assertEqual(self.client.delete('/api/meowcha/saves/1').status_code, 401)

    def test_modes_assistance_and_decks_are_separate_and_legacy_retained(self):
        for mode, assist, deck in [('DIRECT', False, 'oxford_5000'), ('AUDIO', False, 'oxford_5000'),
            ('DIRECT', True, 'oxford_5000'), ('DIRECT', False, 'reading_academic')]:
            response = self.client.post('/api/meowcha/runs/complete', json=self.payload(self.start(mode, deck), assisted=assist))
            self.assertEqual(response.status_code, 200, response.text)
        self.db.add(MeowchaLeaderboard(user_id=self.user.id, player_name='alice', score=9999)); self.db.commit()
        for query in ['', '?game_mode=AUDIO', '?assisted=true', '?deck_id=reading_academic', '?game_mode=LEGACY']:
            response = self.client.get('/api/meowcha/leaderboard' + query)
            self.assertEqual(response.status_code, 200, response.text)
            self.assertEqual(len(response.json()['data']), 1)

    def test_zero_accuracy_is_preserved_and_realm_is_bounded_by_progress(self):
        payload = self.payload(self.start(), realm_idx=4, correct_keystrokes=0, assisted_keystrokes=15, assisted_words=3)
        result = self.client.post('/api/meowcha/runs/complete', json=payload).json()['data']
        self.assertEqual(result['accuracy'], 0); self.assertEqual(result['realm_idx'], 0)
        self.assertTrue(result['assisted'])

    def test_cloud_snapshots_preserve_modes_isolate_users_and_reject_stale_writes(self):
        stamp = int(time.time() * 1000)
        snapshot = {'updatedAt': stamp, 'activeMode': 'AUDIO', 'modes': {'DIRECT': {'score': 10}, 'AUDIO': {'score': 20}}}
        self.assertEqual(self.client.post('/api/meowcha/save-snapshots/1', json={'snapshot': snapshot}).status_code, 200)
        loaded = self.client.get('/api/meowcha/save-snapshots').json()['data']['1']['snapshot']
        self.assertEqual(loaded['modes']['DIRECT']['score'], 10)
        self.assertEqual(self.client.post('/api/meowcha/save-snapshots/1', json={'snapshot': {**snapshot, 'updatedAt': stamp - 1}}).status_code, 409)
        self.db.rollback()
        self.app.dependency_overrides[get_meowcha_user_from_token] = lambda: self.other
        self.assertEqual(self.client.get('/api/meowcha/save-snapshots').json()['data'], {})
        self.assertEqual(self.client.post('/api/meowcha/save-snapshots/4', json={'snapshot': snapshot}).status_code, 400)

    def test_profile_uses_actual_user_columns_and_invalid_snapshots_are_rejected(self):
        self.assertEqual(self.client.get('/api/meowcha/profile').status_code, 200)
        for modes in [{'DIRECT': 'invalid'}, {'AUDIO': {'hp': 60, 'maxHp': 50}},
                      {'DIRECT': {'realmIdx': 10}}, {'CLOZE': {'correctKeystrokes': 10, 'totalKeystrokes': 1}}]:
            self.assertEqual(self.client.post('/api/meowcha/save-snapshots/1', json={
                'snapshot': {'updatedAt': int(time.time() * 1000), 'modes': modes}}).status_code, 422)

    def test_legitimate_critical_and_combo_build_fits_score_ceiling(self):
        result = RunComplete(run_id=uuid4(), score=2_000_000, words_slain=100,
            realm_idx=4, active_ms=120_000, correct_keystrokes=2000, total_keystrokes=2000)
        self.assertEqual(result.score, 2_000_000)

    def test_additive_migration_is_repeatable_and_preserves_legacy_rows(self):
        sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'migrations'))
        from meowcha_runs_v1 import migrate
        self.db.add(MeowchaLeaderboard(user_id=self.user.id, player_name='alice', score=42)); self.db.commit()
        migrate(self.engine); migrate(self.engine)
        self.assertEqual(self.db.query(MeowchaLeaderboard).one().score, 42)

    def test_personal_best_is_owned_and_preserves_unknown_legacy_metrics(self):
        self.db.add_all([
            MeowchaLeaderboard(user_id=self.user.id, player_name='alice', score=12345),
            MeowchaLeaderboard(user_id=self.other.id, player_name='alice', score=999999)])
        self.db.commit()
        result = self.client.get('/api/meowcha/personal-best').json()['data']
        self.assertEqual(result['score'], 12345)
        self.assertFalse(result['metricsKnown'])
        self.assertNotIn('wpm', result)

    def test_personal_best_reads_completed_run_and_requires_login(self):
        run_id = self.start()
        self.client.post('/api/meowcha/runs/complete', json=self.payload(run_id))
        result = self.client.get('/api/meowcha/personal-best').json()['data']
        self.assertEqual(result['score'], 450)
        self.assertEqual(result['accuracy'], 75)
        self.assertEqual(result['humanWords'], 3)
        self.app.dependency_overrides[get_meowcha_user_from_token] = lambda: None
        self.assertEqual(self.client.get('/api/meowcha/personal-best').status_code, 401)


    def test_unknown_legacy_mode_is_never_relabelled_into_measured_boards(self):
        self.db.add(MeowchaLeaderboard(user_id=self.user.id, player_name='alice', score=9999))
        self.db.commit()
        for mode in ['DIRECT', 'CLOZE', 'AUDIO']:
            result = self.client.get('/api/meowcha/leaderboard?game_mode=' + mode).json()['data']
            self.assertEqual(result, [])
        self.assertEqual(len(self.client.get('/api/meowcha/leaderboard?game_mode=LEGACY').json()['data']), 1)

    def test_board_reads_current_account_avatar_and_keeps_same_name_users_separate(self):
        run_id = self.start()
        self.client.post('/api/meowcha/runs/complete', json=self.payload(run_id))
        self.user.avatar_url = 'https://cdn.discordapp.com/avatars/7/new.png'
        self.db.add(MeowchaLeaderboard(user_id=self.user.id, player_name='same', score=80))
        self.db.add(MeowchaLeaderboard(user_id=self.other.id, player_name='same', score=90))
        self.db.commit()
        result = self.client.get('/api/meowcha/leaderboard').json()['data']
        self.assertEqual(result[0]['avatar_url'], self.user.avatar_url)
        legacy = self.client.get('/api/meowcha/leaderboard?game_mode=LEGACY').json()['data']
        self.assertEqual(len(legacy), 2)
        self.assertEqual({row['user_id'] for row in legacy}, {self.user.id, self.other.id})


if __name__ == '__main__':
    unittest.main()
