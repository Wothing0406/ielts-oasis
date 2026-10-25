"use client";

import { useEffect, useRef } from "react";

export default function MeowchaGamePage() {
  const frameRef = useRef<HTMLIFrameElement>(null);
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
      <iframe
        ref={frameRef}
        src="/meowcha/index.html?v=15.0"
        className="w-full h-full border-none block m-0 p-0 overflow-hidden"
        title="Meowcha IELTS Game"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
        allow="autoplay; fullscreen; clipboard-write"
        referrerPolicy="same-origin"
      />
    </main>
  );
}
