"""Local-only visual test fixture. Uses an in-memory database; never imports main.

Run from repo root:
python -m uvicorn meowcha_preview:app --app-dir backend/tests --host 127.0.0.1 --port 8124
The fixture reproduces the game's iframe/sandbox. It is not the Next.js app or its
Cloudflare verification flow, which must be validated separately on a valid host.
"""
import os
import sys
from pathlib import Path

os.environ['DATABASE_URL'] = 'sqlite://'
root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(root / 'backend'))

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from database import Base, get_db
from meowcha_routes import router

engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)


def isolated_db():
    with Session() as db:
        yield db


app = FastAPI()
app.dependency_overrides[get_db] = isolated_db
app.include_router(router)


@app.get('/preview/meowcha', response_class=HTMLResponse)
def preview():
    return '''<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;background:#100d12"><main style="position:fixed;inset:0;height:100dvh;overflow:hidden">
    <iframe src="/meowcha/index.html?v=2026.10.24.2" title="Meowcha IELTS Game"
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
    allow="autoplay; fullscreen" style="border:0;width:100%;height:100%;display:block"></iframe>
    </main></body></html>'''


app.mount('/', StaticFiles(directory=root / 'frontend/public', html=True), name='public')
