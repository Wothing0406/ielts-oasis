// components/meowcha/MeowchaGame.tsx - Master Game Engine Wrapper
"use client";

import React, { useRef, useEffect } from "react";

interface MeowchaGameProps {
  className?: string;
  initialSlot?: any;
  onScoreSubmitted?: (score: number, realm: string) => void;
}

export const MeowchaGame: React.FC<MeowchaGameProps> = ({
  className,
  initialSlot,
  onScoreSubmitted
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;
      if (event.data.type === "MEOWCHA_SCORE_SUBMITTED" && onScoreSubmitted) {
        onScoreSubmitted(event.data.data?.score || 0, event.data.data?.realm || "");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onScoreSubmitted]);

  useEffect(() => {
    if (initialSlot && iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: "MEOWCHA_LOAD_SLOT",
        data: initialSlot
      }, "*");
    }
  }, [initialSlot]);

  return (
    <div className={`w-full h-full min-h-[640px] bg-black relative flex flex-col items-center justify-center overflow-hidden ${className || ""}`}>
      <iframe
        ref={iframeRef}
        src="/meowcha/index.html?embedded=true"
        className="w-full h-full border-0 block"
        allow="autoplay; fullscreen"
        title="Meowcha: Vạn Kiếm Quy Tông Master Engine"
      />
    </div>
  );
};
