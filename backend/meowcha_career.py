"""Monotonic career identity, separate from current saves and weekly race gains."""
from sqlalchemy import Column,Integer,String,ForeignKey
from database import Base
from models import MeowchaLeaderboard,MeowchaUserProfile
from meowcha_integrity import MeowchaRun,MeowchaSaveSnapshot,REALMS


class MeowchaCareer(Base):
    __tablename__='meowcha_careers'
    user_id=Column(Integer,ForeignKey('users.id'),primary_key=True)
    highest_tuvi=Column(Integer,nullable=False,default=0)
    highest_realm_idx=Column(Integer,nullable=False,default=0)
    highest_wpm=Column(Integer,nullable=False,default=0)
    score_source=Column(String(24),nullable=False,default='progress')


def realm_index(value):
    text=str(value or '').casefold()
    if 'thái thượng kiếm tôn' in text:return 4
    for i,name in reversed(list(enumerate(REALMS))):
        if name.replace(' Kỳ','').casefold() in text:return i
    return 0


def career_records(db,owner_ids=None):
    from meowcha_seasons import MeowchaScoreRecord
    result={}
    def rows(model):
        query=db.query(model)
        return query.filter(model.user_id.in_(owner_ids)).all() if owner_ids is not None else query.all()
    def add(user_id,score=0,realm=0,wpm=0,source='validated'):
        if not user_id:return
        def number(value,ceiling):
            try:return max(0,min(ceiling,int(value or 0)))
            except (ValueError,TypeError,OverflowError):return 0
        score,realm,wpm=number(score,100_000_000),number(realm,4),number(wpm,300)
        row=result.setdefault(user_id,dict(highest_tuvi=0,highest_realm_idx=0,highest_wpm=0,score_source=source))
        if int(score or 0)>row['highest_tuvi']:row['highest_tuvi']=int(score);row['score_source']=source
        row['highest_realm_idx']=max(row['highest_realm_idx'],min(4,max(0,int(realm or 0))))
        row['highest_wpm']=max(row['highest_wpm'],int(wpm or 0))
    for row in rows(MeowchaCareer):add(row.user_id,row.highest_tuvi,row.highest_realm_idx,row.highest_wpm,row.score_source)
    for row in rows(MeowchaLeaderboard):add(row.user_id,row.score,realm_index(row.realm),row.wpm,'legacy')
    for row in rows(MeowchaUserProfile):add(row.user_id,realm=row.highest_realm_idx,wpm=row.highest_wpm)
    for row in rows(MeowchaRun):
        if row.completed_at:add(row.user_id,row.score,(row.result or {}).get('realm_idx',0),(row.result or {}).get('wpm',0))
    for row in rows(MeowchaScoreRecord):
        if row.period=='ALL':add(row.user_id,row.score,row.snapshot.get('realm_idx',0),row.snapshot.get('wpm',0))
    for row in rows(MeowchaSaveSnapshot):
        for mode in (row.snapshot or {}).get('modes',{}).values():
            # This is the stored personal record, never the current cultivation score.
            # Its unknown mode/typing provenance is never imported into a weekly hall.
            if isinstance(mode,dict):add(row.user_id,mode.get('highScore',0),mode.get('realmIdx',0),source='progress')
    for row in result.values():row['highest_realm']=REALMS[row['highest_realm_idx']]
    return result


def remember_career(db,user_id,score,realm,wpm=0,source='validated'):
    row=db.get(MeowchaCareer,user_id)
    if not row:
        old=career_records(db,[user_id]).get(user_id,{})
        row=MeowchaCareer(user_id=user_id,highest_tuvi=old.get('highest_tuvi',0),highest_realm_idx=old.get('highest_realm_idx',0),
            highest_wpm=old.get('highest_wpm',0),score_source=old.get('score_source',source));db.add(row)
    if score>(row.highest_tuvi or 0):row.highest_tuvi=score;row.score_source=source
    row.highest_realm_idx=max(row.highest_realm_idx or 0,min(4,max(0,realm)))
    row.highest_wpm=max(row.highest_wpm or 0,wpm)


def backfill_careers(db):
    for user_id,row in career_records(db).items():
        remember_career(db,user_id,row['highest_tuvi'],row['highest_realm_idx'],row['highest_wpm'],row['score_source'])
    db.commit()
