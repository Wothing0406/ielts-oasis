import subprocess
import time
import json
import urllib.request
import asyncio
import websockets
import os
import base64
import sys

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PORT = 9230
HTTP_PORT = 8095

def start_http_server():
    cmd = [sys.executable, "-m", "http.server", str(HTTP_PORT), "--directory", "frontend/public/meowcha"]
    proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    return proc

def start_chrome():
    profile_dir = os.path.abspath("scratch_chrome_device_profile")
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
                msg = await asyncio.wait_for(ws.recv(), timeout=15.0)
                d = json.loads(msg)
                if d.get("id") == msg_id:
                    return d.get("result", {})

        await call_cdp("Runtime.enable", msg_id=1)
        await call_cdp("Page.enable", msg_id=2)
        
        # ========================================================
        # TEST 1: PC DESKTOP (Windows NT, 1280x800)
        # ========================================================
        print("Testing PC Desktop mode...")
        await call_cdp("Network.setUserAgentOverride", {
            "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "platform": "Win32"
        }, msg_id=10)
        await call_cdp("Emulation.setDeviceMetricsOverride", {"width": 1280, "height": 800, "deviceScaleFactor": 1, "mobile": False}, msg_id=11)
        await call_cdp("Page.navigate", {"url": f"http://127.0.0.1:{HTTP_PORT}/index.html?v=11.8"}, msg_id=12)
        await asyncio.sleep(3.0)

        # Start Battle on PC
        expr_start_pc = """
        (function() {
            const app = window.MeowchaGameInstance;
            if (app) {
                app.startBattle();
                const kb = document.getElementById('virtualKeyboardContainer');
                const kbStyle = kb ? window.getComputedStyle(kb).display : 'null';
                const D = window.Meowcha && window.Meowcha.Device;
                return {
                    started: true,
                    kbDisplay: kbStyle,
                    deviceType: D ? D.info.type : 'unknown',
                    isDesktop: D ? D.info.isDesktop : false,
                    shouldShowVirtualKeyboard: D ? D.shouldShowVirtualKeyboard() : null
                };
            }
            return { error: 'no app' };
        })()
        """
        res_pc = await call_cdp("Runtime.evaluate", {"expression": expr_start_pc, "returnByValue": True}, msg_id=20)
        print("PC Battle Evaluation Result:", res_pc.get("result", {}).get("value"))

        shot_pc = await call_cdp("Page.captureScreenshot", {"format": "png"}, msg_id=25)
        out_pc = r"C:\Users\QuangDev\.gemini\antigravity\brain\80d67750-92a0-4ea2-acef-9c903064f940\verify_pc_battle_no_keyboard.png"
        with open(out_pc, "wb") as f:
            f.write(base64.b64decode(shot_pc["data"]))
        print("Saved PC battle screenshot:", out_pc)

        # ========================================================
        # TEST 2: MOBILE NATIVE (iPhone / Android, 390x844)
        # ========================================================
        print("Testing Mobile Native mode...")
        await call_cdp("Network.setUserAgentOverride", {
            "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
            "platform": "iPhone"
        }, msg_id=30)
        await call_cdp("Emulation.setDeviceMetricsOverride", {"width": 390, "height": 844, "deviceScaleFactor": 3, "mobile": True}, msg_id=31)
        await call_cdp("Page.navigate", {"url": f"http://127.0.0.1:{HTTP_PORT}/index.html?v=11.8"}, msg_id=32)
        await asyncio.sleep(3.0)

        # Start Battle on Mobile
        expr_start_mob = """
        (function() {
            const app = window.MeowchaGameInstance;
            if (app) {
                app.startBattle();
                const kb = document.getElementById('virtualKeyboardContainer');
                const kbStyle = kb ? window.getComputedStyle(kb).display : 'null';
                const D = window.Meowcha && window.Meowcha.Device;
                return {
                    started: true,
                    kbDisplay: kbStyle,
                    deviceType: D ? D.info.type : 'unknown',
                    isMobile: D ? D.info.isMobile : false,
                    shouldShowVirtualKeyboard: D ? D.shouldShowVirtualKeyboard() : null
                };
            }
            return { error: 'no app' };
        })()
        """
        res_mob = await call_cdp("Runtime.evaluate", {"expression": expr_start_mob, "returnByValue": True}, msg_id=40)
        print("Mobile Battle Evaluation Result:", res_mob.get("result", {}).get("value"))

        shot_mob = await call_cdp("Page.captureScreenshot", {"format": "png"}, msg_id=45)
        out_mob = r"C:\Users\QuangDev\.gemini\antigravity\brain\80d67750-92a0-4ea2-acef-9c903064f940\verify_mobile_battle_with_keyboard.png"
        with open(out_mob, "wb") as f:
            f.write(base64.b64decode(shot_mob["data"]))
        print("Saved Mobile battle screenshot:", out_mob)

        # Test Minimizing Keyboard on Mobile
        expr_min_mob = """
        (function() {
            const btn = document.getElementById('btnMinimizeKeyboard');
            if (btn) {
                btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
                const kb = document.getElementById('virtualKeyboardContainer');
                const restoreBtn = document.getElementById('floatingKbRestoreBtn');
                return {
                    minimized: true,
                    kbDisplay: kb ? window.getComputedStyle(kb).display : null,
                    restoreDisplay: restoreBtn ? window.getComputedStyle(restoreBtn).display : null
                };
            }
            return { error: 'btn not found' };
        })()
        """
        res_min = await call_cdp("Runtime.evaluate", {"expression": expr_min_mob, "returnByValue": True}, msg_id=50)
        print("Mobile Minimize Keyboard Result:", res_min.get("result", {}).get("value"))

        shot_min = await call_cdp("Page.captureScreenshot", {"format": "png"}, msg_id=55)
        out_min = r"C:\Users\QuangDev\.gemini\antigravity\brain\80d67750-92a0-4ea2-acef-9c903064f940\verify_mobile_battle_minimized_keyboard.png"
        with open(out_min, "wb") as f:
            f.write(base64.b64decode(shot_min["data"]))
        print("Saved Mobile minimized keyboard screenshot:", out_min)

if __name__ == "__main__":
    http_proc = start_http_server()
    chrome_proc = start_chrome()
    try:
        asyncio.run(run_test())
    finally:
        chrome_proc.terminate()
        http_proc.terminate()
