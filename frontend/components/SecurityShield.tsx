"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function SecurityShield({ children }: { children: React.ReactNode }) {
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const verified = sessionStorage.getItem("turnstile_verified") === "true";
    if (verified) {
      setIsVerified(true);
    }
  }, []);

  useEffect(() => {
    if (isVerified || !isMounted) return;

    let active = true;

    const renderCaptcha = () => {
      if (!active) return;
      const container = containerRef.current;
      if (container && (window as any).turnstile) {
        try {
          if (widgetIdRef.current !== null) {
            try {
              (window as any).turnstile.remove(widgetIdRef.current);
            } catch (e) {}
          }
          container.innerHTML = "";

          const turnstileDiv = document.createElement("div");
          container.appendChild(turnstileDiv);

          widgetIdRef.current = (window as any).turnstile.render(turnstileDiv, {
            sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA",
            theme: "dark",
            callback: (token: string) => {
              if (token) {
                sessionStorage.setItem("turnstile_verified", "true");
                setTimeout(() => {
                  setIsVerified(true);
                }, 1000); // Wait 1s for the success animation to show
              }
            },
            "expired-callback": () => {
              sessionStorage.removeItem("turnstile_verified");
            },
            "error-callback": () => {
              sessionStorage.removeItem("turnstile_verified");
            }
          });
        } catch (e) {
          console.error("Turnstile render error:", e);
        }
      } else {
        setTimeout(renderCaptcha, 250);
      }
    };

    renderCaptcha();

    return () => {
      active = false;
      if (widgetIdRef.current !== null && (window as any).turnstile) {
        try {
          (window as any).turnstile.remove(widgetIdRef.current);
        } catch (e) {}
      }
    };
  }, [isVerified, isMounted]);

  // Prevent rendering anything if we are on server side
  if (!isMounted) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {!isVerified && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 w-screen h-screen bg-[#0d0d0f] z-[99999999] flex flex-col justify-between items-center p-6 md:p-12 text-[#f3f4f6] select-none font-sans"
          >
            {/* Top Empty Space */}
            <div></div>

            {/* Verification Content Box */}
            <div className="w-full max-w-xl flex flex-col items-start gap-4">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#10b981] flex items-center gap-2">
                ieltsoasis.site
              </h1>
              
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#f3f4f6] mt-2">
                Thực hiện xác minh bảo mật
              </h2>

              <p className="text-sm md:text-base text-[#9ca3af] leading-relaxed mt-1 max-w-lg font-medium">
                Trang web này sử dụng dịch vụ bảo mật để chống bot độc hại. Trang này hiển thị trong khi trang web xác minh bạn không phải là bot.
              </p>

              {/* Turnstile Container Box */}
              <div 
                className="mt-6 p-4 rounded-xl border border-[#1f2937] bg-[#111827] min-h-[75px] w-full max-w-[350px] flex items-center justify-center shadow-lg"
              >
                <div ref={containerRef} id="global-turnstile-container"></div>
              </div>
            </div>

            {/* Bottom Footer Details */}
            <div className="text-[11px] text-[#4b5563] flex flex-col items-center gap-1 font-mono text-center">
              <span>Ray ID: {Math.random().toString(16).substring(2, 10).toUpperCase()} • IP: 100.127.204.9</span>
              <span>Dịch vụ bảo mật cung cấp bởi Cloudflare</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show actual app pages when verified */}
      {isVerified && children}
    </>
  );
}
