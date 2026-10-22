"use client";

import React, { useEffect, useState } from "react";

export const dynamic = 'force-dynamic';

export default function MeowchaGamePage() {
  const [iframeSrc, setIframeSrc] = useState("/meowcha/index.html?v=11.7");

  useEffect(() => {
    try {
      const token = localStorage.getItem("oasis_token");
      const user = localStorage.getItem("oasis_user");
      const params = new URLSearchParams();
      params.set("v", "11.5");
      if (token) params.set("token", token);
      if (user) params.set("user", user);
      setIframeSrc(`/meowcha/index.html?${params.toString()}`);
    } catch (e) {
      console.warn("[MeowchaPage] Could not read localStorage:", e);
    }
  }, []);

  return (
    <main className="fixed inset-0 w-screen h-[100dvh] overflow-hidden bg-[#05040a] z-50 p-0 m-0 border-none select-none">
      <iframe
        src={iframeSrc}
        className="w-full h-full border-none block m-0 p-0 overflow-hidden"
        title="Meowcha IELTS Game"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        allow="autoplay; fullscreen; clipboard-write; clipboard-read"
        scrolling="no"
      />
    </main>
  );
}
