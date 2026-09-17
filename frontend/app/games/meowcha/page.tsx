"use client";

import React from "react";

export const dynamic = 'force-dynamic';

export default function MeowchaGamePage() {
  return (
    <main className="fixed inset-0 w-screen h-[100dvh] overflow-hidden bg-[#05040a] z-50 p-0 m-0 border-none select-none">
      <iframe
        src="/meowcha/index.html?v=8.6"
        className="w-full h-full border-none block m-0 p-0 overflow-hidden"
        title="Meowcha Xianxia Game Engine"
        allow="autoplay; fullscreen; clipboard-write"
        scrolling="no"
      />
    </main>
  );
}
