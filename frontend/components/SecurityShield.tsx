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
      return;
    }

    // Safety timeout: Never block genuine users for more than 1.8 seconds even if Cloudflare fails
    const safetyTimer = setTimeout(() => {
      sessionStorage.setItem("turnstile_verified", "true");
      setIsVerified(true);
    }, 1800);

    return () => clearTimeout(safetyTimer);
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

          // Configure Turnstile site key
          const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAD5-TTW-02kiBkSAjkDzWTyyJII";

          widgetIdRef.current = (window as any).turnstile.render(turnstileDiv, {
            sitekey: sitekey,
            theme: "dark",
            callback: (token: string) => {
              if (token) {
                sessionStorage.setItem("turnstile_verified", "true");
                setTimeout(() => {
                  setIsVerified(true);
                }, 400);
              }
            },
            "expired-callback": () => {
              sessionStorage.setItem("turnstile_verified", "true");
              setIsVerified(true);
            },
            "error-callback": () => {
              // On Cloudflare error (e.g. 400020), auto-allow access immediately
              console.warn("[SecurityShield] Cloudflare Turnstile error detected, bypassing shield.");
              sessionStorage.setItem("turnstile_verified", "true");
              setIsVerified(true);
            }
          });
        } catch (e) {
          console.error("Turnstile render error, bypassing:", e);
          sessionStorage.setItem("turnstile_verified", "true");
          setIsVerified(true);
        }
      } else {
        setTimeout(renderCaptcha, 200);
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

  const handleManualPass = () => {
    sessionStorage.setItem("turnstile_verified", "true");
    setIsVerified(true);
  };

  return (
    <>
      <AnimatePresence>
        {!isVerified && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
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
                Trang web này sử dụng dịch vụ bảo mật để chống bot độc hại. Vui lòng đợi trong giây lát...
              </p>

              {/* Turnstile Container Box */}
              <div 
                className="mt-6 p-4 rounded-xl border border-[#1f2937] bg-[#111827] min-h-[75px] w-full max-w-[350px] flex flex-col items-center justify-center shadow-lg"
              >
                <div ref={containerRef} id="global-turnstile-container"></div>
                <button
                  type="button"
                  onClick={handleManualPass}
                  className="mt-3 text-xs text-[#10b981] hover:text-[#34d399] underline transition-colors cursor-pointer"
                >
                  Bấm vào đây để vào thẳng trang web ➔
                </button>
              </div>
            </div>

            {/* Bottom Footer Details */}
            <div className="text-[11px] text-[#4b5563] flex flex-col items-center gap-1 font-mono text-center">
              <span>Performance &amp; Security Shield</span>
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
