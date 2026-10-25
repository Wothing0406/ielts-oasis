"""Mode-specific practice halls. Legacy rows never acquire invented learning metrics."""
from collections import defaultdict
from models import User
from meowcha_integrity import MeowchaRun, REALMS

MODES=('DIRECT','CLOZE','AUDIO')

def rank_key(item, mode):
    if mode=='DIRECT':
        return (item.get('wpm') or 0,item.get('accuracy') or 0,item.get('max_combo') or 0,item.get('score') or 0)
    return (item.get('accuracy') or 0,item.get('first_success_rate') if item.get('first_success_rate') is not None else -1,
            -(item.get('hints_used' if mode=='CLOZE' else 'replay_count') or 0),item.get('score',0))

def normalized(item,mode):
    if mode=='DIRECT':
        return min(1,(item.get('wpm') or 0)/120)*(item.get('accuracy') or 0)
    if item.get('first_success_rate') is None:
        return None
    return .7*(item.get('accuracy') or 0)+.3*item['first_success_rate']


def balanced_rating(progress):
    values=[progress.get(mode) or 0 for mode in MODES]
    return round(3*(.4*min(values)+.6*sum(values)/3),1)

def build_hall(db, hall, assisted, deck_id, limit, user_id=None):
    runs=db.query(MeowchaRun).filter(MeowchaRun.completed_at.isnot(None),
        MeowchaRun.assisted==assisted,MeowchaRun.deck_id==deck_id)
    if hall in MODES:
        runs=runs.filter(MeowchaRun.game_mode==hall)
    grouped=defaultdict(list)
    for run in runs:
        grouped[run.user_id].append({**(run.result or {}),'game_mode':run.game_mode,'score':run.score,
                                     'run_id':run.run_id,'user_id':run.user_id})
    owners={u.id:u for u in db.query(User).filter(User.id.in_(grouped)).all()} if grouped else {}
    rows=[]
    incomplete_self=None
    for owner_id, records in grouped.items():
        if hall in MODES:
            item=max(records,key=lambda r:(rank_key(r,hall),r['run_id']))
        else:
            best={}
            for record in records:
                value=normalized(record,record['game_mode'])
                if value is not None and (record['game_mode'] not in best or value>best[record['game_mode']][0]):
                    best[record['game_mode']]=(value,record)
            if not best:
                continue
            strongest=max(best,key=lambda mode:(best[mode][0],mode))
            realm=max((r.get('realm_idx',0) for r in records),default=0)
            item={'user_id':owner_id,'dao_hanh':balanced_rating({m:v[0] for m,v in best.items()}),
                  'total_score':sum(r['score'] for r in records),'score':sum(r['score'] for r in records),
                  'strongest_mode':strongest,'mode_progress':{m:round(best[m][0],1) if m in best else None for m in MODES},
                  'completed_runs':len(records),'words_slain':sum(r.get('words_slain',0) for r in records),
                  'realm_idx':realm,'realm':REALMS[min(4,max(0,realm))],
                  'complete_modes':list(best),'eligible':len(best)==3}
        owner=owners.get(owner_id)
        item={**item,'player_name':(getattr(owner,'full_name',None) or owner.username) if owner else 'Tiên Hữu',
              'avatar_url':(owner.avatar_url or '') if owner else ''}
        if hall=='OVERALL' and not item['eligible']:
            if owner_id==user_id:incomplete_self={**item,'rank':None}
            continue
        rows.append(item)
    rows.sort(key=lambda r:((r['dao_hanh'],r['total_score']) if hall=='OVERALL' else rank_key(r,hall),-r['user_id']),reverse=True)
    for rank,item in enumerate(rows,1):
        item['rank']=rank
    return {'rows':rows[:limit],'self':next((r for r in rows if r['user_id']==user_id),incomplete_self),'total_players':len(rows)}


def build_mastery(db,user_id,deck_id='oxford_5000'):
    runs=db.query(MeowchaRun).filter(MeowchaRun.user_id==user_id,
        MeowchaRun.completed_at.isnot(None),MeowchaRun.assisted==False,MeowchaRun.deck_id==deck_id).all()
    modes={}
    for mode in MODES:
        records=[{**(r.result or {}),'score':r.score} for r in runs if r.game_mode==mode]
        best=max(records,key=lambda r:rank_key(r,mode)) if records else None
        values=[normalized(r,mode) for r in records]
        known=[v for v in values if v is not None]
        rating=round(max(known),1) if known else None
        words=sum(r.get('words_slain',0) for r in records)
        # Familiarity needs repeated practice; one perfect answer is not mastery.
        level=min(5,int((rating or 0)/20)+1,1+words//20) if rating is not None else 0
        modes[mode]={'best':best,'rating':rating,'level':level,'words':words,'runs':len(records)}
    complete=all(m['rating'] is not None for m in modes.values())
    return {'modes':modes,'complete':complete,'dao_hanh':balanced_rating({key:value['rating'] for key,value in modes.items()}),
            'scale':300,'deck_id':deck_id}
