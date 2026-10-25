"use client";

import { useEffect, useRef, useState } from "react";
import release from "../../../meowcha-release.json";

export default function MeowchaGamePage() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [access, setAccess] = useState<'checking'|'ready'|'locked'|'error'>('checking');
  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('oasis_token');
    fetch('/api/meowcha/session', {credentials:'same-origin',
      headers:token ? {Authorization:`Bearer ${token}`} : {}, signal:controller.signal})
      .then(async response => {
        if (response.status === 401 || response.status === 403) { setAccess('locked'); return; }
        if (!response.ok) throw new Error('session');
        const body = await response.json();
        if (!body.data?.id) throw new Error('identity');
        localStorage.setItem('oasis_user', JSON.stringify(body.data));
        setAccess('ready');
      }).catch(error => { if (error.name !== 'AbortError') setAccess('error'); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const navigateFromGame = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type !== "MEOWCHA_NAVIGATE" || event.data.path !== "/games") return;
      window.location.assign("/games");
    };
    window.addEventListener("message", navigateFromGame);
    return () => window.removeEventListener("message", navigateFromGame);
  }, []);

  return (
    <main className="fixed inset-0 w-screen h-[100dvh] overflow-hidden bg-[#05040a] z-50 p-0 m-0 border-none select-none">
      {access !== 'ready' ? <section className="mx-auto flex h-full max-w-lg flex-col items-center justify-center gap-5 px-6 text-center text-[#FFF1CE]">
        <h1 className="text-2xl font-bold">MEOW-CHA • Tiên môn</h1>
        <p role="status">{access === 'checking' ? 'Đang xác nhận tiên hữu…' : access === 'error' ? 'Chưa kết nối được với tiên môn. Tiến trình của bạn vẫn được giữ.' : 'Đăng nhập tài khoản IELTS Oasis để tiếp tục hành trình và đồng bộ đạo quả.'}</p>
        {access !== 'checking' && <a className="border border-[#B7914F] bg-[#315C4B] px-7 py-3" href={access === 'error' ? '/games/meowcha' : '/?login=true&returnTo=%2Fgames%2Fmeowcha'}>{access === 'error' ? 'Thử kết nối lại' : 'Đăng nhập IELTS Oasis'}</a>}
        <a className="underline" href="/games">Trở về Tiên Giới</a>
      </section> : <iframe
        ref={frameRef}
        src={`/meowcha/index.html?v=${release.version}`}
        className="w-full h-full border-none block m-0 p-0 overflow-hidden"
        title="Meowcha IELTS Game"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
        allow="autoplay; fullscreen; clipboard-write"
        referrerPolicy="same-origin"
      />}
    </main>
  );
}
