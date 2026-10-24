import subprocess
import time
import json
import urllib.request
import asyncio
import websockets
import os
import base64

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9229

def start_chrome():
    profile_dir = os.path.abspath("scratch_chrome_live_prod_v1175")
    os.makedirs(profile_dir, exist_ok=True)
    cmd = [
        CHROME_PATH,
        "--headless=new",
        f"--remote-debugging-port={PORT}",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        f"--user-data-dir={profile_dir}"
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(2)
    return proc

async def run_test():
    req = urllib.request.Request(f"http://127.0.0.1:{PORT}/json/new", method='PUT')
    res = urllib.request.urlopen(req).read()
    page_info = json.loads(res.decode('utf-8'))
    ws_url = page_info['webSocketDebuggerUrl']
    
    async with websockets.connect(ws_url, max_size=25*1024*1024) as ws:
        async def call_cdp(method, params=None, msg_id=1):
            req_body = {"id": msg_id, "method": method}
            if params:
                req_body["params"] = params
            await ws.send(json.dumps(req_body))
            while True:
                msg = await asyncio.wait_for(ws.recv(), timeout=20.0)
                d = json.loads(msg)
                if d.get("id") == msg_id:
                    return d.get("result", {})

        await call_cdp("Runtime.enable", msg_id=1)
        await call_cdp("Page.enable", msg_id=2)
        
        # Desktop Test: 1280x800
        await call_cdp("Emulation.setDeviceMetricsOverride", {"width": 1280, "height": 800, "deviceScaleFactor": 1, "mobile": False}, msg_id=3)
        await call_cdp("Page.navigate", {"url": "https://ieltsoasis.site/games/meowcha"}, msg_id=4)
        await asyncio.sleep(5.0)
        
        shot1 = await call_cdp("Page.captureScreenshot", {"format": "png"}, msg_id=10)
        out1 = r"C:\Users\QuangDev\.gemini\antigravity\brain\80d67750-92a0-4ea2-acef-9c903064f940\live_prod_v1175_desktop.png"
        with open(out1, "wb") as f:
            f.write(base64.b64decode(shot1["data"]))
        print("Saved live prod screenshot:", out1)

if __name__ == "__main__":
    chrome_proc = start_chrome()
    try:
        asyncio.run(run_test())
    finally:
        chrome_proc.terminate()
