"""Discord transport is mocked; commands and shared ranking use the actual SDK/schema."""
import os,sys,asyncio,unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from datetime import datetime,timedelta
os.environ['DATABASE_URL']='sqlite://'
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from database import Base
from models import User
from meowcha_integrity import MeowchaRun
from meowcha_seasons import MeowchaWeeklyNotification,MeowchaRacePreference,MeowchaSeason,period_meta,board_key
from meowcha_discord import deliver_awards,deliver_public,award_nonce,register_meowcha,discord_snapshot,MeowchaDiscordAnnouncement


class DiscordTests(unittest.TestCase):
    def setUp(self):
        self.engine=create_engine('sqlite://',connect_args={'check_same_thread':False},poolclass=StaticPool)
        Base.metadata.create_all(self.engine);self.Session=sessionmaker(bind=self.engine)
        with self.Session() as db:
            user=User(username='daoist',discord_id='900000000000000001');db.add(user);db.flush();self.owner=user.id
            db.add(MeowchaRacePreference(user_id=user.id,discord_enabled=True))
            db.add(MeowchaWeeklyNotification(week='2026-10-19',user_id=user.id,kind='discord_award',state='pending',detail={
                'discord_id':user.discord_id,'awards':[{'hall':'DIRECT','rank':1,'score':400,'title':'Chí Tôn Tiên Miện','specialty':'Kiếm Tốc','highest_realm':'Trúc Cơ Kỳ'}]}));db.commit()

    def tearDown(self):self.engine.dispose()

    def state(self):
        with self.Session() as db:return db.query(MeowchaWeeklyNotification).filter_by(kind='discord_award').one().state

    def test_award_dm_is_claimed_before_transport_and_never_sent_twice(self):
        calls=[]
        async def send(target,payload):calls.append((target,payload));self.assertEqual(self.state(),'sending')
        self.assertEqual(asyncio.run(deliver_awards(send,self.Session)),1)
        self.assertEqual(asyncio.run(deliver_awards(send,self.Session)),0)
        self.assertEqual(len(calls),1);self.assertEqual(self.state(),'delivered')

    def test_closed_dm_and_uncertain_network_do_not_retry_external_messages(self):
        class DMClosed(Exception):pass
        calls=[]
        async def closed(*args):calls.append(1);raise DMClosed()
        asyncio.run(deliver_awards(closed,self.Session));asyncio.run(deliver_awards(closed,self.Session))
        self.assertEqual((self.state(),len(calls)),('blocked',1))
        with self.Session() as db:db.query(MeowchaWeeklyNotification).update({'state':'pending'});db.commit()
        async def uncertain(*args):calls.append(1);raise TimeoutError()
        asyncio.run(deliver_awards(uncertain,self.Session));asyncio.run(deliver_awards(uncertain,self.Session))
        self.assertEqual((self.state(),len(calls)),('uncertain',2))

    def test_opt_out_and_changed_discord_mapping_skip_queued_award(self):
        async def forbidden(*args):self.fail('must not send')
        with self.Session() as db:db.query(MeowchaRacePreference).update({'discord_enabled':False});db.commit()
        asyncio.run(deliver_awards(forbidden,self.Session));self.assertEqual(self.state(),'skipped')
        with self.Session() as db:
            db.query(MeowchaWeeklyNotification).update({'state':'pending'});db.query(MeowchaRacePreference).update({'discord_enabled':True})
            db.query(User).update({'discord_id':'900000000000000002'});db.commit()
        asyncio.run(deliver_awards(forbidden,self.Session));self.assertEqual(self.state(),'skipped')

    def test_nonce_is_stable_bounded_and_sdk_enforces_uniqueness(self):
        from discord.http import handle_message_parameters
        nonce=award_nonce('2026-10-19','900000000000000001')
        self.assertLessEqual(len(nonce),25);self.assertEqual(nonce,award_nonce('2026-10-19','900000000000000001'))
        self.assertNotEqual(nonce,award_nonce('2026-10-26','900000000000000001'))
        with handle_message_parameters(content='test',nonce=nonce) as params:self.assertTrue(params.payload['enforce_nonce'])

    def test_public_announcement_is_opt_in_and_uses_one_durable_claim(self):
        calls=[]
        async def send(*args):calls.append(args)
        self.assertEqual(asyncio.run(deliver_public(send,'',self.Session)),0)
        with self.Session() as db:db.add(MeowchaSeason(week='2026-10-19',ended_at=datetime.utcnow(),sealed_at=datetime.utcnow(),boards={
            board_key('OVERALL','oxford_5000',False):[{'rank':1,'player_name':'daoist','score':400}]}));db.commit()
        self.assertEqual(asyncio.run(deliver_public(send,'900000000000000099',self.Session)),1)
        self.assertEqual(asyncio.run(deliver_public(send,'900000000000000099',self.Session)),0);self.assertEqual(len(calls),1)

    def test_existing_bot_commands_register_and_use_same_weekly_board(self):
        import discord
        from discord.ext import commands
        bot=commands.Bot(command_prefix='/',intents=discord.Intents.none());register_meowcha(bot)
        self.assertEqual({c.name for c in bot.tree.get_commands()},{'phongthan','hangcuatoi','duatop','thongbaophongthan'})
        with self.Session() as db:
            db.add(MeowchaRun(run_id='12345678-1234-4234-8234-123456789012',user_id=self.owner,game_mode='DIRECT',deck_id='oxford_5000',assisted=False,
                started_at=datetime.utcnow()-timedelta(minutes=2),completed_at=datetime.utcnow(),score=450,
                result={'score':450,'realm':'Luyện Khí Kỳ','realm_idx':0,'wpm':3,'accuracy':90}));db.commit()
        sent=[]
        async def defer(**kwargs):pass
        async def send(*args,**kwargs):sent.append((args,kwargs))
        interaction=SimpleNamespace(user=SimpleNamespace(id=900000000000000001),response=SimpleNamespace(defer=defer),followup=SimpleNamespace(send=send))
        actual=discord_snapshot
        with patch('meowcha_discord.discord_snapshot',side_effect=lambda identity,hall:actual(identity,hall,self.Session)):
            asyncio.run(bot.tree.get_command('phongthan').callback(interaction,'DIRECT'))
        embed=sent[0][1]['embed'].to_dict();self.assertIn('TUẦN',embed['title']);self.assertIn('450',embed['fields'][0]['value'])
        self.assertIn('Còn',embed['description']);asyncio.run(bot.close())


if __name__=='__main__':unittest.main()
