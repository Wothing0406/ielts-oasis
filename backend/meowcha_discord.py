"""Existing-bot commands and at-most-once weekly delivery. No second bot/token.

A durable claim precedes network I/O. Ambiguous deliveries are NOT retried: web
award history remains available if Discord DMs are closed or a worker stops.
"""
import asyncio
import os
import hashlib
from datetime import datetime,timezone
from sqlalchemy.exc import IntegrityError
from database import Base,SessionLocal
from sqlalchemy import Column,String,DateTime
from models import User
from meowcha_seasons import (MeowchaWeeklyNotification,MeowchaRacePreference,MeowchaSeason,
    settle_due_weeks,utc_now,period_meta,board_key)
from meowcha_race import race_view
from meowcha_halls import build_hall

URL='https://ieltsoasis.site/games/meowcha'
NAMES={'OVERALL':'Tổng Đạo','DIRECT':'Trực Diện','CLOZE':'Ngộ Đạo','AUDIO':'Thính Âm'}


class MeowchaDiscordAnnouncement(Base):
    __tablename__='meowcha_discord_announcements'
    week=Column(String(10),primary_key=True)
    channel_id=Column(String(30),primary_key=True)
    state=Column(String(16),nullable=False)
    delivered_at=Column(DateTime,nullable=True)


def countdown(period,now=None):
    end=datetime.fromisoformat(period['season_ends_at'].replace('Z','+00:00'))
    seconds=max(0,int((end-(now or datetime.now(timezone.utc))).total_seconds()))
    days,seconds=divmod(seconds,86400);hours,seconds=divmod(seconds,3600);minutes,seconds=divmod(seconds,60)
    return f'{days} ngày {hours:02}:{minutes:02}:{seconds:02}'


def number(value):return f'{int(value or 0):,}'.replace(',','.')


def award_nonce(week,target,kind='award'):
    return hashlib.sha256(f'meowcha:{week}:{target}:{kind}'.encode()).hexdigest()[:24]


def discord_snapshot(discord_id,hall='OVERALL',session_factory=SessionLocal):
    with session_factory() as db:
        user=db.query(User).filter(User.discord_id==str(discord_id)).first()
        if not user:return None
        view=race_view(db,user.id,hall)
        board=build_hall(db,hall,False,'oxford_5000',10,user.id,scope='WEEKLY',week=view['period']['week'])
        view['rows']=board['rows']
        view['ranks']={mode:build_hall(db,mode,False,'oxford_5000',10,user.id,scope='WEEKLY',week=view['period']['week'])['self'] for mode in NAMES}
        return view


def set_discord_preference(discord_id,enabled,session_factory=SessionLocal):
    with session_factory() as db:
        user=db.query(User).filter(User.discord_id==str(discord_id)).with_for_update().first()
        if not user:return False
        row=db.get(MeowchaRacePreference,user.id)
        if not row:row=MeowchaRacePreference(user_id=user.id);db.add(row)
        row.discord_enabled=enabled;db.commit();return True


def claim_award(key,session_factory=SessionLocal):
    with session_factory() as db:
        row=db.get(MeowchaWeeklyNotification,key)
        if not row or row.state!='pending':return None
        owner=db.get(User,row.user_id);pref=db.get(MeowchaRacePreference,row.user_id)
        if not owner or not pref or not pref.discord_enabled or str(owner.discord_id or '')!=str(row.detail.get('discord_id','')):
            db.query(MeowchaWeeklyNotification).filter_by(week=row.week,user_id=row.user_id,kind=row.kind,state='pending').update({'state':'skipped'});db.commit();return None
        claimed=db.query(MeowchaWeeklyNotification).filter_by(week=row.week,user_id=row.user_id,kind=row.kind,state='pending').update(
            {'state':'sending','claimed_at':utc_now()},synchronize_session=False)
        detail={**row.detail,'week':row.week};db.commit()
        return detail if claimed else None


def finish_award(key,state,session_factory=SessionLocal):
    with session_factory() as db:
        row=db.get(MeowchaWeeklyNotification,key)
        if row and row.state=='sending':
            row.state=state
            if state=='delivered':row.delivered_at=utc_now()
            db.commit()


async def deliver_awards(sender,session_factory=SessionLocal):
    def pending():
        with session_factory() as db:
            settle_due_weeks(db)
            return [(r.week,r.user_id,r.kind) for r in db.query(MeowchaWeeklyNotification).filter_by(kind='discord_award',state='pending').limit(50)]
    sent=0
    for key in await asyncio.to_thread(pending):
        detail=await asyncio.to_thread(claim_award,key,session_factory)
        if not detail:continue
        try:
            await asyncio.wait_for(sender(detail['discord_id'],detail),timeout=20)
            state='delivered';sent+=1
        except Exception as error:
            state='blocked' if getattr(error,'status',None)==403 or type(error).__name__ in ('Forbidden','DMClosed') else 'uncertain'
        await asyncio.to_thread(finish_award,key,state,session_factory)
    return sent


async def deliver_public(sender,channel_id,session_factory=SessionLocal):
    if not str(channel_id or '').isdigit():return 0
    def claim():
        with session_factory() as db:
            latest=db.query(MeowchaSeason).order_by(MeowchaSeason.week.desc()).first()
            if not latest or db.get(MeowchaDiscordAnnouncement,(latest.week,str(channel_id))):return None
            if not latest.boards.get(board_key('OVERALL','oxford_5000',False)):return None
            db.add(MeowchaDiscordAnnouncement(week=latest.week,channel_id=str(channel_id),state='sending'))
            try:db.commit()
            except IntegrityError:db.rollback();return None
            return {'week':latest.week,'rows':latest.boards.get(board_key('OVERALL','oxford_5000',False),[])[:3]}
    detail=await asyncio.to_thread(claim)
    if not detail:return 0
    try:await asyncio.wait_for(sender(str(channel_id),detail),20);state='delivered'
    except Exception:state='uncertain'
    def finish():
        with session_factory() as db:
            row=db.get(MeowchaDiscordAnnouncement,(detail['week'],str(channel_id)));row.state=state
            if state=='delivered':row.delivered_at=utc_now()
            db.commit()
    await asyncio.to_thread(finish)
    return int(state=='delivered')


def register_meowcha(bot):
    import discord
    from discord import app_commands
    choices=[app_commands.Choice(name=name,value=key) for key,name in NAMES.items()]
    async def linked(interaction,hall):
        await interaction.response.defer(ephemeral=True)
        view=await asyncio.to_thread(discord_snapshot,str(interaction.user.id),hall)
        if not view:await interaction.followup.send('Đăng nhập web bằng Discord để liên kết Tiên Hữu: '+URL,ephemeral=True)
        return view
    def embed_for(view,hall,title=None):
        period=view['period'];embed=discord.Embed(title=title or f'BẢNG PHONG THẦN • TUẦN {period["season_number"]}',url=URL,color=0x58AB88)
        embed.description=NAMES[hall]+' • Còn '+countdown(period)+'\nChốt thứ Hai 00:00 (giờ Việt Nam).'
        return embed
    def self_field(embed,view):
        own=view['self'];text=f'#{own["rank"]} • {number(own["score"])} Tu Vi' if own else 'Chưa có ván hoàn tất trong tuần. Thiên bảng đang chờ đạo hữu!'
        if view['score_gap'] is not None:text+='\nCách hạng trên: '+number(view['score_gap'])+' Tu Vi'
        embed.add_field(name='Đạo hữu',value=text,inline=False)

    @bot.tree.command(name='phongthan',description='Thiên bảng MEOW-CHA top 10 tuần này')
    @app_commands.choices(mode=choices)
    async def phongthan(interaction:discord.Interaction,mode:str='OVERALL'):
        view=await linked(interaction,mode)
        if not view:return
        embed=embed_for(view,mode)
        rows=['#'+str(row['rank'])+' '+discord.utils.escape_markdown(row['player_name'][:40])+' — '+number(row['score'])+' Tu Vi • '+row['realm'] for row in view['rows']]
        embed.add_field(name='Thiên bảng Top 10',value='\n'.join(rows) or 'Tuần mới đã khai mở, chưa có ván hoàn tất.',inline=False)
        self_field(embed,view);await interaction.followup.send(embed=embed,ephemeral=True,allowed_mentions=discord.AllowedMentions.none())

    @bot.tree.command(name='hangcuatoi',description='Hạng tuần và kỷ lục MEOW-CHA của bạn')
    async def hangcuatoi(interaction:discord.Interaction):
        view=await linked(interaction,'OVERALL')
        if not view:return
        embed=embed_for(view,'OVERALL','TIÊN HỮU • CHIẾN TÍCH TUẦN')
        for mode,row in view['ranks'].items():embed.add_field(name=NAMES[mode],value=f'#{row["rank"]} • {number(row["score"])} Tu Vi' if row else 'Chưa có thành tích',inline=True)
        career=view['career']
        if career:embed.add_field(name='Kỷ lục vĩnh viễn',value=number(career['highest_tuvi'])+' Tu Vi • '+career['highest_realm'],inline=False)
        await interaction.followup.send(embed=embed,ephemeral=True)

    @bot.tree.command(name='duatop',description='Khoảng cách lên hạng và thời gian đua top MEOW-CHA')
    @app_commands.choices(mode=choices)
    async def duatop(interaction:discord.Interaction,mode:str='OVERALL'):
        view=await linked(interaction,mode)
        if not view:return
        embed=embed_for(view,mode,'THIÊN BẢNG TRANH PHONG');self_field(embed,view)
        await interaction.followup.send(embed=embed,ephemeral=True)

    @bot.tree.command(name='thongbaophongthan',description='Bật/tắt DM vinh danh Top 10 tuần MEOW-CHA')
    async def thongbao(interaction:discord.Interaction,bat:bool):
        await interaction.response.defer(ephemeral=True)
        enabled=await asyncio.to_thread(set_discord_preference,str(interaction.user.id),bat)
        await interaction.followup.send(('Đã '+('bật' if bat else 'tắt')+' DM vinh danh Top 10 tuần.') if enabled else 'Đăng nhập web bằng Discord để liên kết trước: '+URL,ephemeral=True)

    async def send_dm(discord_id,detail):
        user=bot.get_user(int(discord_id)) or await bot.fetch_user(int(discord_id))
        embed=discord.Embed(title='THIÊN ĐẠO BAN CHIẾU',description='Phong Thần tuần '+detail['week']+' • Thiên bảng tuần mới đã khai mở.',url=URL,color=0xE7BC68)
        for award in detail['awards'][:20]:embed.add_field(name=f'#{award["rank"]} {award["title"]} · {award["specialty"]}',value=number(award['score'])+' Tu Vi • '+award.get('highest_realm','')+' • '+NAMES[award['hall']],inline=False)
        await user.send(embed=embed,nonce=award_nonce(detail['week'],discord_id),allowed_mentions=discord.AllowedMentions.none())
    async def send_public(channel_id,detail):
        channel=bot.get_channel(int(channel_id)) or await bot.fetch_channel(int(channel_id))
        embed=discord.Embed(title='PHONG THẦN TUẦN '+detail['week'],url=URL,color=0xE7BC68)
        embed.description='\n'.join('#'+str(r['rank'])+' '+discord.utils.escape_markdown(r['player_name'][:40])+' — '+number(r['score'])+' Tu Vi' for r in detail['rows']) or 'Thiên bảng tuần mới đã khai mở.'
        await channel.send(embed=embed,nonce=award_nonce(detail['week'],channel_id,'public'),allowed_mentions=discord.AllowedMentions.none())
    async def job():
        await deliver_awards(send_dm)
        await deliver_public(send_public,os.getenv('MEOWCHA_AWARDS_CHANNEL_ID',''))
    return job
