"""Shared web/Discord views of weekly standings and once-per-week lobby recap."""
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from meowcha_seasons import (MeowchaSeason,MeowchaHonor,MeowchaRacePreference,MeowchaWeeklyNotification,
    period_meta,board_key,utc_now,week_window)
from meowcha_integrity import MeowchaRun
from meowcha_career import career_records
from meowcha_halls import build_hall


def race_view(db,user_id,hall='OVERALL',deck='oxford_5000'):
    period=period_meta('WEEKLY')
    board=build_hall(db,hall,False,deck,None,user_id,scope='WEEKLY',week=period['week'])
    own=board['self'];above=board['rows'][own['rank']-2] if own and own['rank']>1 else None
    previous=db.get(MeowchaSeason,period['previous_season_id'])
    honor=db.get(MeowchaHonor,(period['previous_season_id'],user_id))
    recap=db.get(MeowchaWeeklyNotification,(period['season_id'],user_id,'lobby_recap'))
    preference=db.get(MeowchaRacePreference,user_id)
    _,previous_start,current_start=week_window(week=period['previous_season_id'])
    previous_pending=db.query(MeowchaRun.run_id).filter(MeowchaRun.completed_at>=previous_start,MeowchaRun.completed_at<current_start).first()
    return {'period':period,'career':career_records(db,[user_id]).get(user_id),
        'self':own,'score_gap':max(0,above['score']-own['score']+1) if above else None,
        'previous_top3':previous.boards.get(board_key('OVERALL',deck,False),[])[:3] if previous else [],
        'awards':honor.placements if honor else [],'recap_seen':bool(recap and recap.recap_seen_at),
        'recap_ready':previous is not None or previous_pending is None,
        'discord_enabled':bool(preference and preference.discord_enabled)}


def mark_recap_seen(db,user_id,season_id):
    if season_id!=period_meta()['season_id']:raise HTTPException(409,'Mùa đã đổi; hãy tải thông báo tuần hiện tại.')
    row=db.get(MeowchaWeeklyNotification,(season_id,user_id,'lobby_recap'))
    if not row:
        row=MeowchaWeeklyNotification(week=season_id,user_id=user_id,kind='lobby_recap',state='delivered',detail={});db.add(row)
    row.recap_seen_at=row.recap_seen_at or utc_now()
    try:db.commit()
    except IntegrityError:db.rollback()
    return {'seen':True,'season_id':season_id}


def history_view(db,user_id):
    result=[]
    for season in db.query(MeowchaSeason).order_by(MeowchaSeason.week.desc()).limit(12):
        own=db.get(MeowchaHonor,(season.week,user_id))
        result.append({'season_id':season.week,'top3':season.boards.get(board_key('OVERALL','oxford_5000',False),[])[:3],
            'awards':own.placements if own else [],'finalized_at':season.sealed_at.isoformat()+'Z'})
    return result
