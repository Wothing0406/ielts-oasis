"""Add checkpoint/season/honor tables; never rewrite legacy runs or saves."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from database import engine
from meowcha_seasons import (MeowchaScoreRecord,MeowchaSeason,MeowchaHonor,MeowchaWeeklyStanding,
    MeowchaRacePreference,MeowchaWeeklyNotification)
from meowcha_career import MeowchaCareer
from meowcha_discord import MeowchaDiscordAnnouncement


def migrate(bind):
    for model in (MeowchaScoreRecord,MeowchaSeason,MeowchaHonor,MeowchaWeeklyStanding,
        MeowchaRacePreference,MeowchaWeeklyNotification,MeowchaCareer,MeowchaDiscordAnnouncement):
        model.__table__.create(bind=bind,checkfirst=True)


if __name__=='__main__':
    migrate(engine)
    print('Meowcha score records, seasons and honors ready; previous data retained.')
