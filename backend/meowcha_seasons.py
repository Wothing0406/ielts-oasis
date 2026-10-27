"""Score checkpoints and durable weekly honors. UTC storage, Monday UTC+7 boundary.

No deletion/reset of saves or lifetime results. Checkpoints never credit profiles.
The unique season insert and all its honors commit in one transaction, so multiple
API workers can safely attempt the same rollover after downtime.
"""
import asyncio
import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey, Boolean,func
from sqlalchemy.exc import IntegrityError

from database import Base, SessionLocal
from models import User
from meowcha_integrity import MeowchaRun, REALMS, THRESHOLDS, require_user

VN = timezone(timedelta(hours=7), 'Asia/Ho_Chi_Minh')
DECKS = ('oxford_5000', 'listening_1200', 'reading_academic', 'flashcard_srs')
RANK_TITLES=('Chí Tôn Tiên Miện','Bạch Ngân Đạo Quân','Thanh Đồng Chân Nhân','Tứ Tượng Thiên Kiêu',
    'Ngũ Hành Đạo Tử','Lục Hợp Kiếm Khách','Thất Tinh Linh Sư','Bát Hoang Tu Sĩ','Cửu Tiêu Đạo Hữu','Thập Phương Tân Tú')
SPECIALTIES={'OVERALL':'Vạn Pháp','DIRECT':'Kiếm Tốc','CLOZE':'Ngộ Đạo','AUDIO':'Thiên Nhĩ'}


class MeowchaScoreRecord(Base):
    __tablename__ = 'meowcha_score_records'
    run_id = Column(String(36), ForeignKey('meowcha_runs.run_id'), primary_key=True)
    period = Column(String(10), primary_key=True)  # ALL or local Monday YYYY-MM-DD
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    score = Column(Integer, nullable=False)
    snapshot = Column(JSON, nullable=False)
    accepted_at = Column(DateTime, nullable=False)


class MeowchaSeason(Base):
    __tablename__ = 'meowcha_seasons'
    week = Column(String(10), primary_key=True)
    ended_at = Column(DateTime, nullable=False)
    sealed_at = Column(DateTime, nullable=False)
    boards = Column(JSON, nullable=False)


class MeowchaHonor(Base):
    __tablename__ = 'meowcha_weekly_honors'
    week = Column(String(10), ForeignKey('meowcha_seasons.week'), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    placements = Column(JSON, nullable=False)
    created_at = Column(DateTime, nullable=False)
    read_at = Column(DateTime, nullable=True)


class MeowchaWeeklyStanding(Base):
    __tablename__='meowcha_weekly_standings'
    week=Column(String(10),ForeignKey('meowcha_seasons.week'),primary_key=True)
    user_id=Column(Integer,ForeignKey('users.id'),primary_key=True)
    hall=Column(String(12),primary_key=True)
    deck_id=Column(String(40),primary_key=True)
    assisted=Column(Boolean,primary_key=True)
    rank=Column(Integer,nullable=False)
    weekly_score=Column(Integer,nullable=False)
    best_run_id=Column(String(36),nullable=True)
    title=Column(String(80),nullable=True)
    specialty=Column(String(40),nullable=True)
    snapshot=Column(JSON,nullable=False)


class MeowchaRacePreference(Base):
    __tablename__='meowcha_race_preferences'
    user_id=Column(Integer,ForeignKey('users.id'),primary_key=True)
    discord_enabled=Column(Boolean,nullable=False,default=False)


class MeowchaWeeklyNotification(Base):
    __tablename__='meowcha_weekly_notifications'
    week=Column(String(10),primary_key=True)
    user_id=Column(Integer,ForeignKey('users.id'),primary_key=True)
    kind=Column(String(20),primary_key=True)
    state=Column(String(16),nullable=False,default='pending')
    claimed_at=Column(DateTime,nullable=True)
    delivered_at=Column(DateTime,nullable=True)
    recap_seen_at=Column(DateTime,nullable=True)
    detail=Column(JSON,nullable=False,default=dict)


def utc_now():
    return datetime.utcnow()


def week_window(now=None, week=None):
    now = now or utc_now()
    local = now.replace(tzinfo=timezone.utc).astimezone(VN)
    monday = (local - timedelta(days=local.weekday())).date()
    if week:
        try:
            selected = datetime.strptime(week, '%Y-%m-%d').date()
        except ValueError:
            raise HTTPException(422, 'Tuần phải là ngày thứ Hai YYYY-MM-DD.')
        if selected.weekday() or selected > monday:
            raise HTTPException(422, 'Chọn một tuần đã bắt đầu, tính từ thứ Hai.')
        monday = selected
    start = datetime.combine(monday, datetime.min.time(), VN).astimezone(timezone.utc).replace(tzinfo=None)
    return monday.isoformat(), start, start + timedelta(days=7)


def period_meta(scope='ALL_TIME', week=None, now=None):
    now = now or utc_now()
    if week=='previous':
        week=week_window(now-timedelta(days=7))[0]
    key, start, end = week_window(now, week)
    return {'scope': scope, 'week': key, 'starts_at': start.isoformat()+'Z',
            'season_id':key,'season_started_at':start.isoformat()+'Z','season_ends_at':end.isoformat()+'Z',
            'season_number':(start+timedelta(hours=7)).isocalendar().week,
            'previous_season_id':(start+timedelta(hours=7)-timedelta(days=7)).date().isoformat(),
            'ends_at': end.isoformat()+'Z', 'server_now': now.isoformat()+'Z',
            'timezone': 'Asia/Ho_Chi_Minh', 'previous_week': (start.replace(tzinfo=timezone.utc).astimezone(VN).date()-timedelta(days=7)).isoformat()}


def prepare_result(run, user, payload, now):
    if not run.resumed and payload.active_ms > (now-run.started_at).total_seconds()*1000+2000:
        raise HTTPException(422, 'Active play time exceeds server session duration')
    max_realm = max(i for i, (score, words) in enumerate(THRESHOLDS)
                    if payload.score >= score and payload.words_slain >= words)
    realm = min(payload.realm_idx, max_realm)
    assisted = bool(run.resumed or payload.assisted or payload.assisted_keystrokes or payload.assisted_words or payload.hints_used)
    return dict(run_id=run.run_id, user_id=user.id,
        player_name=getattr(user, 'full_name', None) or user.username or 'Tiên Hữu',
        score=payload.score, words_slain=payload.words_slain, realm=REALMS[realm], realm_idx=realm,
        accuracy=round(payload.correct_keystrokes*100/payload.total_keystrokes, 1) if payload.total_keystrokes else 100.0,
        wpm=round(payload.correct_keystrokes*12000/payload.active_ms), game_mode=run.game_mode,
        weekly_eligible=not run.resumed,
        deck_id=run.deck_id, assisted=assisted, verification='plausibility_checked', duplicate=False,
        human_words=payload.words_slain-payload.assisted_words, assisted_words=payload.assisted_words,
        active_ms=payload.active_ms, correct_keystrokes=payload.correct_keystrokes,
        total_keystrokes=payload.total_keystrokes, assisted_keystrokes=payload.assisted_keystrokes,
        metrics_version=payload.metrics_version, max_combo=payload.max_combo if payload.metrics_version==2 else None,
        difficulty={'version':payload.difficulty_version,'pressure_score':payload.pressure_score,
                    'rolling_human_wpm':payload.rolling_human_wpm,'minimum_target_seconds':payload.minimum_target_seconds},
        max_perfect_streak=payload.max_perfect_streak,
        learning_attempts=payload.learning_attempts if payload.metrics_version==2 else None,
        first_successes=payload.first_successes if payload.metrics_version==2 else None,
        first_success_rate=round(payload.first_successes*100/payload.learning_attempts, 1) if payload.metrics_version==2 and payload.learning_attempts else None,
        hints_used=payload.hints_used if payload.metrics_version==2 else None,
        replay_count=payload.replay_count if payload.metrics_version==2 else None,
        avatar_url=user.avatar_url if (user.avatar_url or '').startswith('https://') else '')


def store_scores(db, run, result, now, finalized=False):
    from meowcha_career import remember_career
    old = db.get(MeowchaScoreRecord, (run.run_id, 'ALL'))
    old_snapshot=dict(old.snapshot) if old else None
    old_accepted=old.accepted_at if old else None
    if old:
        for key in ('score', 'words_slain', 'active_ms', 'correct_keystrokes', 'total_keystrokes', 'assisted_words', 'assisted_keystrokes'):
            if result.get(key, 0) < old.snapshot.get(key, 0):
                raise HTTPException(422, 'Run counters cannot move backwards')
        if old.snapshot.get('assisted'):
            result['assisted'] = True
    week, start, _ = week_window(now)
    periods = ['ALL'] + ([week] if not run.resumed else [])
    for period in periods:
        row = db.get(MeowchaScoreRecord, (run.run_id, period))
        baseline={}
        if period!='ALL':
            if row:baseline=row.snapshot.get('weekly_baseline',{})
            elif run.started_at<start:
                previous=db.query(MeowchaScoreRecord).filter(MeowchaScoreRecord.run_id==run.run_id,
                    MeowchaScoreRecord.period!='ALL',MeowchaScoreRecord.period<week).order_by(MeowchaScoreRecord.period.desc()).first()
                source=previous.snapshot if previous else old_snapshot if old_snapshot and old_accepted<start else result
                baseline={key:source.get(key) for key in ('score','words_slain','active_ms','correct_keystrokes','total_keystrokes',
                    'assisted_words','assisted_keystrokes','learning_attempts','first_successes','hints_used','replay_count')}
        if not row:
            row = MeowchaScoreRecord(run_id=run.run_id, period=period, user_id=run.user_id)
            db.add(row)
        snapshot={**result,'finalized':finalized};score=result['score']
        if period!='ALL':
            def delta(key):return max(0,(result.get(key) or 0)-(baseline.get(key) or 0))
            score=delta('score');keys,total,elapsed=delta('correct_keystrokes'),delta('total_keystrokes'),max(1000,delta('active_ms'))
            weekly={**result,'score':score,'words_slain':delta('words_slain'),'wpm':round(keys*12000/elapsed),
                'accuracy':round(keys*100/total,1) if total else 100.0,'weekly_tuvi':score,
                'hints_used':delta('hints_used') if result.get('hints_used') is not None else None,
                'replay_count':delta('replay_count') if result.get('replay_count') is not None else None,
                'max_combo':None if baseline else result.get('max_combo'),
                'first_success_rate':round(delta('first_successes')*100/delta('learning_attempts'),1) if delta('learning_attempts') else None}
            if weekly['wpm']>300:score=0;weekly['score']=0;weekly['weekly_tuvi']=0
            snapshot.update(weekly_baseline=baseline,weekly_result=weekly)
        row.score,row.snapshot,row.accepted_at=score,snapshot,now
    remember_career(db,run.user_id,result['score'],result['realm_idx'],result['wpm'])


def checkpoint_run(db, user, payload):
    require_user(user)
    db.query(User).filter(User.id==user.id).with_for_update().one()
    run = db.query(MeowchaRun).filter(MeowchaRun.run_id==str(payload.run_id), MeowchaRun.user_id==user.id).with_for_update().first()
    if not run:
        raise HTTPException(404, 'Unknown run for this player')
    if run.completed_at:
        return {**run.result, 'duplicate': True}
    now = utc_now()
    result = prepare_result(run, user, payload, now)
    store_scores(db, run, result, now)
    db.commit()
    return result


def hall_records(db, assisted, deck_id, scope='ALL_TIME', week=None, now=None):
    key, start, end = week_window(now, week)
    completed = db.query(MeowchaRun).filter(MeowchaRun.completed_at.isnot(None),
        MeowchaRun.assisted==assisted, MeowchaRun.deck_id==deck_id)
    if scope=='WEEKLY':
        completed = completed.filter(MeowchaRun.started_at>=start,MeowchaRun.resumed==False,
            MeowchaRun.completed_at>=start, MeowchaRun.completed_at<end)
    records = {r.run_id: {**(r.result or {}), 'game_mode': r.game_mode, 'score': r.score,
        'run_id': r.run_id, 'user_id': r.user_id, 'finalized': True} for r in completed}
    checkpoints = db.query(MeowchaScoreRecord, MeowchaRun).join(MeowchaRun,
        MeowchaRun.run_id==MeowchaScoreRecord.run_id).filter(
        MeowchaScoreRecord.period==('ALL' if scope=='ALL_TIME' else key), MeowchaRun.deck_id==deck_id)
    for record, run in checkpoints:
        snapshot=record.snapshot
        if scope=='WEEKLY':
            if not snapshot.get('finalized') or record.score<=0:continue
            snapshot=snapshot.get('weekly_result',snapshot)
        if bool(snapshot.get('assisted'))!=assisted:
            continue
        if record.run_id not in records or record.score>records[record.run_id]['score']:
            records[record.run_id] = {**snapshot, 'run_id': run.run_id, 'user_id': run.user_id, 'game_mode': run.game_mode,'finalized':bool(record.snapshot.get('finalized'))}
    return list(records.values())


def board_key(hall, deck, assisted):
    return f'{hall}:{deck}:{int(assisted)}'


def seal_week(db, week, now=None):
    from meowcha_halls import build_hall
    now = now or utc_now()
    key, start, end = week_window(now, week)
    if end>now:
        return False
    if db.get(MeowchaSeason, key):
        return False
    season = MeowchaSeason(week=key, ended_at=end, sealed_at=now, boards={})
    db.add(season)
    try:
        db.flush()  # Unique claim stays uncommitted until boards AND honors are ready.
    except IntegrityError:
        db.rollback()
        return False
    boards, notices = {}, defaultdict(list)
    for deck in DECKS:
        for assisted in (False, True):
            for hall in ('OVERALL', 'DIRECT', 'CLOZE', 'AUDIO'):
                board = build_hall(db, hall, assisted, deck, None, scope='WEEKLY', week=key, now=now)
                boards[board_key(hall, deck, assisted)] = board['rows']
                for row in board['rows']:
                    title=RANK_TITLES[row['rank']-1] if not assisted and row['rank']<=10 else None
                    specialty=SPECIALTIES[hall] if title else None
                    row['title'],row['specialty']=title,specialty
                    db.add(MeowchaWeeklyStanding(week=key,user_id=row['user_id'],hall=hall,deck_id=deck,assisted=assisted,
                        rank=row['rank'],weekly_score=row['score'],best_run_id=row.get('run_id'),title=title,specialty=specialty,snapshot=row))
                    notices[row['user_id']].append({'hall': hall, 'deck_id': deck, 'assisted': assisted,
                        'rank': row['rank'], 'score': row['score'], 'players': board['total_players'],
                        'title':title,'specialty':specialty,'highest_realm':row.get('highest_realm',row.get('realm'))})
    season.boards = boards
    for user_id, placements in notices.items():
        db.add(MeowchaHonor(week=key, user_id=user_id, placements=placements, created_at=now))
        preference=db.get(MeowchaRacePreference,user_id);owner=db.get(User,user_id)
        awards=[p for p in placements if p.get('title')]
        if awards and preference and preference.discord_enabled and owner and str(owner.discord_id or '').isdigit():
            db.add(MeowchaWeeklyNotification(week=key,user_id=user_id,kind='discord_award',state='pending',
                detail={'awards':awards,'discord_id':owner.discord_id}))
    db.commit()
    return True


def settle_due_weeks(db, now=None):
    now = now or utc_now()
    _, current, _ = week_window(now)
    earliest_run = db.query(func.min(MeowchaRun.completed_at)).scalar()
    earliest_score = db.query(func.min(MeowchaScoreRecord.accepted_at)).scalar()
    dates = [d for d in (earliest_run, earliest_score) if d]
    if not dates:
        return 0
    latest = db.query(func.max(MeowchaSeason.week)).scalar()
    key, start, end = week_window(now, latest) if latest else week_window(min(dates))
    if latest:
        start = end
    count = 0
    for _ in range(8):  # Catch up after downtime without a long transaction/request.
        if start>=current:
            break
        key = start.replace(tzinfo=timezone.utc).astimezone(VN).date().isoformat()
        count += int(seal_week(db, key, now))
        start += timedelta(days=7)
    return count


async def season_loop():
    def tick():
        with SessionLocal() as db:
            settle_due_weeks(db)
    while True:
        try:
            await asyncio.to_thread(tick)
        except asyncio.CancelledError:
            raise
        except Exception:
            logging.getLogger('meowcha').exception('Weekly season settlement failed; retrying')
        await asyncio.sleep(30)
