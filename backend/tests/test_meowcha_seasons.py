"""Deterministic rollover, checkpoints and personal honors on isolated databases."""
import os
import sys
import unittest
import tempfile
from datetime import datetime, timedelta
from pathlib import Path
from uuid import uuid4
from unittest.mock import patch
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

os.environ['DATABASE_URL']='sqlite://'
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi import FastAPI
from fastapi.testclient import TestClient
from database import Base,get_db
from models import User,MeowchaUserProfile,MeowchaBattleLog,MeowchaLeaderboard
from meowcha_integrity import MeowchaRun,RunComplete
from meowcha_routes import router,get_meowcha_user_from_token
from meowcha_seasons import (MeowchaScoreRecord,MeowchaSeason,MeowchaHonor,
    week_window,store_scores,prepare_result,seal_week,settle_due_weeks)

MONDAY=datetime(2026,10,25,17)  # 26/10 00:00 in Vietnam


class SeasonTests(unittest.TestCase):
    def setUp(self):
        self.engine=create_engine('sqlite://',connect_args={'check_same_thread':False},poolclass=StaticPool)
        Base.metadata.create_all(self.engine);self.Session=sessionmaker(bind=self.engine);self.db=self.Session()
        self.user=User(username='player',discord_id='season-player');self.other=User(username='other',discord_id='season-other')
        self.db.add_all([self.user,self.other]);self.db.commit()
        app=FastAPI();app.include_router(router);self.app=app
        app.dependency_overrides[get_db]=lambda:self.db
        app.dependency_overrides[get_meowcha_user_from_token]=lambda:self.user
        self.client=TestClient(app)

    def tearDown(self):
        self.client.close();self.db.close();self.engine.dispose()

    def run_row(self,owner=None,start=None,end=None,score=450,mode='DIRECT',assisted=False,deck='oxford_5000'):
        row=MeowchaRun(run_id=str(uuid4()),user_id=(owner or self.user).id,game_mode=mode,deck_id=deck,
            started_at=start or MONDAY+timedelta(minutes=1),completed_at=end,assisted=assisted,
            score=score if end else 0,result={'score':score,'realm':'Luyện Khí Kỳ','realm_idx':0,'wpm':3,
                'accuracy':75,'max_combo':3,'words_slain':3,'first_success_rate':50} if end else None)
        self.db.add(row);self.db.commit();return row

    def payload(self,run,**changes):
        value=dict(run_id=run.run_id,score=450,words_slain=3,realm_idx=0,active_ms=60000,
            correct_keystrokes=15,total_keystrokes=20)
        value.update(changes);return value

    def test_monday_boundary_is_vietnam_time_not_browser_or_utc_midnight(self):
        self.assertEqual(week_window(MONDAY-timedelta(microseconds=1))[0],'2026-10-19')
        self.assertEqual(week_window(MONDAY)[0],'2026-10-26')
        self.assertEqual(week_window(MONDAY)[1],MONDAY)
        with patch('meowcha_seasons.utc_now',return_value=MONDAY):
            for query in ['week=2026-11-02','week=2026-10-25','week=no','scope=INVALID']:
                self.assertEqual(self.client.get('/api/meowcha/halls?'+query).status_code,422)

    def test_checkpoint_publishes_high_score_without_finishing_or_crediting_twice(self):
        row=self.run_row(start=datetime.utcnow()-timedelta(minutes=2))
        for _ in range(2):
            response=self.client.post('/api/meowcha/runs/checkpoint',json=self.payload(row))
            self.assertEqual(response.status_code,200,response.text)
        self.db.refresh(row);self.assertIsNone(row.completed_at)
        self.assertEqual(self.db.query(MeowchaBattleLog).count(),0)
        self.assertEqual(self.db.query(MeowchaUserProfile).count(),0)
        board=self.client.get('/api/meowcha/halls?hall=DIRECT').json()
        self.assertEqual(board['data'][0]['score'],450)
        self.assertEqual(self.client.get('/api/meowcha/personal-best').json()['data']['score'],450)
        for _ in range(2):
            self.assertEqual(self.client.post('/api/meowcha/runs/complete',json=self.payload(row)).status_code,200)
        self.assertEqual(self.db.query(MeowchaBattleLog).count(),1)
        self.assertEqual(self.db.query(MeowchaUserProfile).one().total_score,450)
        overall=self.client.get('/api/meowcha/halls?hall=OVERALL').json()['data'][0]
        self.assertEqual(overall['total_score'],450)
        self.assertEqual(overall['completed_runs'],1)

    def test_checkpoint_rejects_foreign_impossible_and_backwards_counters(self):
        row=self.run_row(start=datetime.utcnow()-timedelta(minutes=2))
        self.assertEqual(self.client.post('/api/meowcha/runs/checkpoint',json=self.payload(row)).status_code,200)
        for changes in [dict(score=449),dict(active_ms=59000),dict(correct_keystrokes=14),dict(score=90_000_000)]:
            self.assertEqual(self.client.post('/api/meowcha/runs/checkpoint',json=self.payload(row,**changes)).status_code,422)
            self.db.rollback()
        self.app.dependency_overrides[get_meowcha_user_from_token]=lambda:self.other
        self.assertEqual(self.client.post('/api/meowcha/runs/checkpoint',json=self.payload(row)).status_code,404)
        self.app.dependency_overrides[get_meowcha_user_from_token]=lambda:None
        self.assertEqual(self.client.post('/api/meowcha/runs/checkpoint',json=self.payload(row)).status_code,401)

    def test_old_run_cannot_carry_points_into_new_week_and_sealed_scores_stay_fixed(self):
        self.run_row(start=MONDAY-timedelta(hours=2),end=MONDAY-timedelta(minutes=30),score=8000)
        row=self.run_row(start=MONDAY-timedelta(hours=1))
        before=MONDAY-timedelta(seconds=1)
        payload=RunComplete(**self.payload(row,score=8000,words_slain=20,correct_keystrokes=100,total_keystrokes=100))
        store_scores(self.db,row,prepare_result(row,self.user,payload,before),before);self.db.commit()
        self.assertTrue(seal_week(self.db,'2026-10-19',MONDAY))
        payload=RunComplete(**self.payload(row,score=15000,words_slain=30,correct_keystrokes=150,total_keystrokes=150))
        store_scores(self.db,row,prepare_result(row,self.user,payload,MONDAY+timedelta(seconds=1)),MONDAY+timedelta(seconds=1));self.db.commit()
        with patch('meowcha_seasons.utc_now',return_value=MONDAY+timedelta(minutes=2)):
            weekly=self.client.get('/api/meowcha/halls?hall=DIRECT&scope=WEEKLY').json()
            self.assertEqual(weekly['data'],[])
            self.assertEqual(weekly['meta']['all_time_self']['score'],15000)
            archive=self.client.get('/api/meowcha/halls?hall=DIRECT&scope=WEEKLY&week=previous').json()
            self.assertTrue(archive['meta']['sealed']);self.assertEqual(archive['data'][0]['score'],8000)
        self.assertFalse(seal_week(self.db,'2026-10-19',MONDAY+timedelta(days=1)))
        self.assertEqual(self.db.query(MeowchaSeason).count(),1)

    def test_career_keeps_owned_legacy_high_score_and_highest_realm_without_guessing_mode(self):
        from meowcha_career import MeowchaCareer
        self.db.add(MeowchaLeaderboard(user_id=self.user.id,player_name='player',score=22815,realm='Nguyên Anh Tiên Tôn'));self.db.commit()
        self.run_row(start=datetime.utcnow()-timedelta(hours=1),end=datetime.utcnow(),score=411)
        overall=self.client.get('/api/meowcha/halls?hall=OVERALL').json()['data'][0]
        direct=self.client.get('/api/meowcha/halls?hall=DIRECT').json()['data'][0]
        self.assertEqual((overall['score'],overall['highest_realm_idx']),(22815,3))
        self.assertEqual((direct['score'],direct['highest_tuvi'],direct['realm']),(411,22815,'Nguyên Anh Kỳ'))
        snapshot={'updatedAt':1000,'modes':{'DIRECT':{'score':22,'highScore':30000,'realmIdx':1}}}
        first=self.client.post('/api/meowcha/save-snapshots/1',json={'snapshot':snapshot}).json()['data']['revision']
        snapshot['modes']['DIRECT'].update(score=1,highScore=1,realmIdx=0)
        self.assertEqual(self.client.post('/api/meowcha/save-snapshots/1',json={'snapshot':snapshot,'expected_revision':first}).status_code,200)
        record=self.client.get('/api/meowcha/halls?hall=OVERALL').json()['data'][0]
        self.assertEqual(record['score'],30000);self.assertEqual(record['highest_realm_idx'],3)
        self.assertEqual(self.db.query(MeowchaCareer).one().highest_tuvi,30000)

    def test_lobby_recap_is_seen_once_per_user_and_current_week(self):
        period=self.client.get('/api/meowcha/race-state').json()['data']['period']
        self.assertFalse(self.client.get('/api/meowcha/race-state').json()['data']['recap_seen'])
        for _ in range(2):self.assertEqual(self.client.post('/api/meowcha/recap/seen',json={'season_id':period['season_id']}).status_code,200)
        self.assertTrue(self.client.get('/api/meowcha/race-state').json()['data']['recap_seen'])
        from meowcha_seasons import MeowchaWeeklyNotification
        self.assertEqual(self.db.query(MeowchaWeeklyNotification).filter_by(kind='lobby_recap').count(),1)
        self.app.dependency_overrides[get_meowcha_user_from_token]=lambda:self.other
        self.assertFalse(self.client.get('/api/meowcha/race-state').json()['data']['recap_seen'])
        self.assertEqual(self.client.post('/api/meowcha/recap/seen',json={'season_id':'2000-01-03'}).status_code,409)

    def test_local_personal_record_import_is_owned_monotonic_and_never_weekly_or_game_credit(self):
        for score in [30000,100]:
            response=self.client.post('/api/meowcha/career/personal-record',json={'score':score,'realm_idx':3,'user_id':self.other.id})
            self.assertEqual(response.status_code,200,response.text)
        career=self.client.get('/api/meowcha/race-state').json()['data']['career']
        self.assertEqual(career['highest_tuvi'],30000);self.assertEqual(career['highest_realm_idx'],3)
        self.assertEqual(self.client.get('/api/meowcha/halls?scope=WEEKLY').json()['data'],[])
        self.assertEqual(self.client.get('/api/meowcha/halls?hall=DIRECT').json()['data'],[])
        self.assertEqual(self.db.query(MeowchaRun).count(),0);self.assertEqual(self.db.query(MeowchaBattleLog).count(),0)
        self.assertEqual(self.db.query(MeowchaUserProfile).count(),0)
        self.app.dependency_overrides[get_meowcha_user_from_token]=lambda:self.other
        self.assertIsNone(self.client.get('/api/meowcha/race-state').json()['data']['career'])

    def test_top_ten_cosmetic_titles_are_saved_but_eleventh_player_and_unlinked_dm_are_skipped(self):
        from meowcha_seasons import MeowchaRacePreference,MeowchaWeeklyStanding,MeowchaWeeklyNotification,RANK_TITLES
        for i in range(11):
            owner=User(username='title'+str(i),discord_id=str(900000000000000000+i) if i<10 else 'email-account')
            self.db.add(owner);self.db.flush();self.db.add(MeowchaRacePreference(user_id=owner.id,discord_enabled=True));self.db.commit()
            self.run_row(owner,start=MONDAY-timedelta(days=1),end=MONDAY-timedelta(hours=1),score=100+i)
        self.assertTrue(seal_week(self.db,'2026-10-19',MONDAY))
        standings=self.db.query(MeowchaWeeklyStanding).filter_by(hall='DIRECT').order_by(MeowchaWeeklyStanding.rank).all()
        self.assertEqual([r.title for r in standings[:10]],list(RANK_TITLES));self.assertIsNone(standings[10].title)
        self.assertEqual(self.db.query(MeowchaWeeklyNotification).filter_by(kind='discord_award').count(),9)
        self.assertEqual(self.db.query(MeowchaHonor).count(),11)

    def test_weekly_high_score_keeps_modes_decks_and_assistance_separate(self):
        for mode,assist,deck,score in [('DIRECT',False,'oxford_5000',100),('AUDIO',False,'oxford_5000',200),
            ('DIRECT',True,'oxford_5000',9999),('DIRECT',False,'reading_academic',8888)]:
            self.run_row(start=MONDAY+timedelta(minutes=1),end=MONDAY+timedelta(hours=1),mode=mode,assisted=assist,deck=deck,score=score)
        self.run_row(start=MONDAY-timedelta(days=1),end=MONDAY-timedelta(hours=1),score=77777)
        resumed=self.run_row(start=MONDAY+timedelta(minutes=1),end=MONDAY+timedelta(hours=1),score=99999,assisted=True)
        resumed.resumed=True;self.db.commit()
        with patch('meowcha_seasons.utc_now',return_value=MONDAY+timedelta(days=1)):
            for query,score in [('hall=DIRECT',100),('hall=AUDIO',200),('hall=DIRECT&assisted=true',9999),('hall=DIRECT&deck_id=reading_academic',8888)]:
                body=self.client.get('/api/meowcha/halls?scope=WEEKLY&'+query).json()
                self.assertEqual(body['data'][0]['score'],score)

    def test_continued_run_only_banks_new_week_gains_after_completion_without_resetting_career(self):
        row=self.run_row(start=MONDAY-timedelta(hours=1));before=MONDAY-timedelta(seconds=1)
        first=RunComplete(**self.payload(row,score=1000))
        store_scores(self.db,row,prepare_result(row,self.user,first,before),before);self.db.commit()
        now=MONDAY+timedelta(minutes=1)
        final=RunComplete(**self.payload(row,score=1500,words_slain=6,active_ms=120000,correct_keystrokes=30,total_keystrokes=40))
        result=prepare_result(row,self.user,final,now);row.completed_at=now;row.result=result;row.score=1500
        store_scores(self.db,row,result,now,finalized=True);self.db.commit()
        with patch('meowcha_seasons.utc_now',return_value=now):
            data=self.client.get('/api/meowcha/halls?hall=DIRECT&scope=WEEKLY').json()['data'][0]
            self.assertEqual(data['score'],500);self.assertEqual(data['words_slain'],3);self.assertEqual(data['accuracy'],75)
            self.assertEqual(data['highest_tuvi'],1500)

    def test_every_participant_receives_one_owned_persistent_notice_not_only_top_three(self):
        for i in range(4):
            owner=self.user if i==0 else User(username='p'+str(i),discord_id='p'+str(i))
            if i:self.db.add(owner);self.db.commit()
            self.run_row(owner=owner,start=MONDAY-timedelta(days=1),end=MONDAY-timedelta(hours=1),score=100+i)
        self.assertEqual(settle_due_weeks(self.db,MONDAY),1)
        self.assertEqual(settle_due_weeks(self.db,MONDAY),0)
        self.assertEqual(self.db.query(MeowchaHonor).count(),4)
        notices=self.client.get('/api/meowcha/honors').json()['data']
        self.assertEqual(len(notices),1);self.assertTrue(notices[0]['unread'])
        self.assertTrue(any(p['rank']==4 for p in notices[0]['placements']))
        self.assertEqual(self.client.post('/api/meowcha/honors/2026-10-19/read').status_code,200)
        self.assertEqual(self.client.post('/api/meowcha/honors/2026-10-19/read').status_code,200)
        self.assertFalse(self.client.get('/api/meowcha/honors').json()['data'][0]['unread'])
        self.app.dependency_overrides[get_meowcha_user_from_token]=lambda:self.other
        self.assertEqual(self.client.get('/api/meowcha/honors').json()['data'],[])
        self.assertEqual(self.client.post('/api/meowcha/honors/2026-10-19/read').status_code,404)

    def test_two_workers_seal_once_and_additive_migration_preserves_old_scores(self):
        sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'migrations'))
        from meowcha_seasons_v1 import migrate
        with tempfile.TemporaryDirectory() as folder:
            engine=create_engine('sqlite:///'+str(Path(folder)/'season.sqlite'),connect_args={'check_same_thread':False})
            Base.metadata.create_all(engine);sessions=sessionmaker(bind=engine)
            with sessions() as db:
                user=User(username='concurrent',discord_id='concurrent');db.add(user);db.flush()
                db.add(MeowchaLeaderboard(user_id=user.id,player_name='old',score=999))
                db.add(MeowchaRun(run_id=str(uuid4()),user_id=user.id,game_mode='DIRECT',deck_id='oxford_5000',assisted=False,
                    started_at=MONDAY-timedelta(days=1),completed_at=MONDAY-timedelta(hours=1),score=400,result={'score':400,'realm_idx':0,'accuracy':90,'wpm':10}))
                db.commit()
            migrate(engine);migrate(engine);gate=Barrier(2)
            def work():
                with sessions() as db:gate.wait();return seal_week(db,'2026-10-19',MONDAY)
            with ThreadPoolExecutor(2) as pool:results=list(pool.map(lambda _:work(),range(2)))
            self.assertEqual(sorted(results),[False,True])
            with sessions() as db:
                self.assertEqual(db.query(MeowchaSeason).count(),1);self.assertEqual(db.query(MeowchaHonor).count(),1)
                self.assertEqual(db.query(MeowchaLeaderboard).one().score,999)
            engine.dispose()


if __name__=='__main__':unittest.main()
