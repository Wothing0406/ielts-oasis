"use client";

import React, { useEffect, useState } from "react";

export const dynamic = 'force-dynamic';

export default function MeowchaGamePage() {
  const [iframeSrc, setIframeSrc] = useState("/meowcha/index.html?v=10.0");

  useEffect(() => {
    try {
      const token = localStorage.getItem("oasis_token");
      const user = localStorage.getItem("oasis_user");
      if (token || user) {
        const params = new URLSearchParams();
        params.set("v", "10.0");
        if (token) params.set("token", token);
        if (user) params.set("user", encodeURIComponent(user));
        setIframeSrc(`/meowcha/index.html?${params.toString()}`);
      }
    } catch (e) {
      console.warn("[MeowchaPage] Could not read localStorage:", e);
    }
  }, []);

  return (
    <main className="fixed inset-0 w-screen h-[100dvh] overflow-hidden bg-[#05040a] z-50 p-0 m-0 border-none select-none">
      <iframe
        src={iframeSrc}
        className="w-full h-full border-none block m-0 p-0 overflow-hidden"
        title="Meowcha Xianxia Game Engine"
        allow="autoplay; fullscreen; clipboard-write; clipboard-read"
        sandbox="allow-scripts allow-same-origin allow-downloads allow-forms allow-popups allow-modals allow-top-navigation-by-user-activation"
        scrolling="no"
      />
    </main>
  );
}
