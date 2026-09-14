// components/meowcha/MeowchaArena.tsx - Native HTML5 Canvas 60FPS Battle Engine

import React, { useRef, useEffect, useState } from "react";
import { 
  Asteroid, Projectile, Particle, FloatingText, Realm, REALMS, Talent 
} from "@/types/meowcha";

interface MeowchaArenaProps {
  asteroids: Asteroid[];
  projectiles: Projectile[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  currentRealmIdx: number;
  catState: "idle" | "attack" | "hurt" | "ultimate" | "defeated";
  activeTargetId: string | null;
  activeTalents?: Talent[];
  onCanvasClick?: () => void;
}

export const MeowchaArena: React.FC<MeowchaArenaProps> = ({
  asteroids,
  projectiles,
  particles,
  floatingTexts,
  currentRealmIdx,
  catState,
  activeTargetId,
  activeTalents = [],
  onCanvasClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const catSpritesRef = useRef<Record<string, HTMLImageElement>>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload game sprites
  useEffect(() => {
    let loadedCount = 0;
    const requiredImages: Record<string, string> = {
      bg: "/meowcha/bg_study_sanctuary.jpg",
      cat_idle: "/meowcha/sprites/cat_idle.png",
      cat_weak: "/meowcha/sprites/cat_weak_attack.png",
      cat_golden: "/meowcha/sprites/cat_golden_core.png",
      cat_nascent: "/meowcha/sprites/cat_nascent_soul.png",
      cat_celestial: "/meowcha/sprites/cat_celestial_sovereign.png",
      cat_blast: "/meowcha/sprites/cat_ultimate_blast.png",
      cat_hurt: "/meowcha/sprites/cat_hurt.png"
    };

    const total = Object.keys(requiredImages).length;

    Object.entries(requiredImages).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        if (key === "bg") bgImageRef.current = img;
        else catSpritesRef.current[key] = img;

        if (loadedCount === total) {
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === total) setImagesLoaded(true);
      };
    });
  }, []);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // 1. CLEAR & BACKGROUND
      ctx.clearRect(0, 0, w, h);

      if (bgImageRef.current && bgImageRef.current.complete) {
        // Draw background with subtle dark vignette
        ctx.drawImage(bgImageRef.current, 0, 0, w, h);
        ctx.fillStyle = "rgba(10, 15, 12, 0.25)";
        ctx.fillRect(0, 0, w, h);
      } else {
        // Fallback celestial starry night gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, "#060b08");
        bgGrad.addColorStop(0.6, "#132317");
        bgGrad.addColorStop(1, "#1c2e1b");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
      }

      // 2. CELESTIAL ALTAR & LOTUS PLATFORM
      const altarX = w / 2;
      const altarY = h - 110;

      // Draw floating misty cloud aura under altar
      ctx.save();
      const cloudGrad = ctx.createRadialGradient(altarX, altarY + 25, 20, altarX, altarY + 25, 140);
      cloudGrad.addColorStop(0, "rgba(220, 245, 225, 0.22)");
      cloudGrad.addColorStop(0.7, "rgba(152, 176, 111, 0.08)");
      cloudGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = cloudGrad;
      ctx.beginPath();
      ctx.ellipse(altarX, altarY + 25, 160, 45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. CAT SPRITE & CULTIVATION AURA
      const realm = REALMS[currentRealmIdx] || REALMS[0];
      const auraColor = realm.auraColor;

      // Cultivation Yin-Yang / Lotus Ring around Cat
      ctx.save();
      const time = performance.now() * 0.002;
      ctx.strokeStyle = auraColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = auraColor;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(altarX, altarY - 20, 48 + Math.sin(time * 2) * 3, 0, Math.PI * 2);
      ctx.stroke();

      // Subtle outer dashed rotating rune ring
      ctx.setLineDash([8, 8]);
      ctx.lineDashOffset = -time * 20;
      ctx.strokeStyle = "rgba(255, 223, 121, 0.4)";
      ctx.beginPath();
      ctx.arc(altarX, altarY - 20, 58, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Select sprite based on state and realm
      let spriteImg: HTMLImageElement | undefined;
      const isDefeated = catState === "defeated";

      if (isDefeated) {
        spriteImg = catSpritesRef.current["cat_defeated"] || catSpritesRef.current["cat_hurt"];
      } else if (catState === "hurt") {
        spriteImg = catSpritesRef.current["cat_hurt"];
      } else if (catState === "attack" || catState === "ultimate") {
        // Mỗi dạng thần giữ nguyên hình thái tôn giả của mình kèm hào quang chưởng ấn
        if (currentRealmIdx >= 4) spriteImg = catSpritesRef.current["cat_celestial"];
        else if (currentRealmIdx === 3) spriteImg = catSpritesRef.current["cat_nascent"];
        else if (currentRealmIdx === 2) spriteImg = catSpritesRef.current["cat_golden"];
        else if (currentRealmIdx === 1) spriteImg = catSpritesRef.current["cat_weak"];
        else spriteImg = catSpritesRef.current["cat_blast"] || catSpritesRef.current["cat_idle"];
      } else {
        if (currentRealmIdx >= 4) spriteImg = catSpritesRef.current["cat_celestial"];
        else if (currentRealmIdx === 3) spriteImg = catSpritesRef.current["cat_nascent"];
        else if (currentRealmIdx === 2) spriteImg = catSpritesRef.current["cat_golden"];
        else if (currentRealmIdx === 1) spriteImg = catSpritesRef.current["cat_weak"];
        else spriteImg = catSpritesRef.current["cat_idle"];
      }

      // =====================================================================
      // TALENT VISUAL TRANSMUTATION ("HÓA MẠNH NHẤT" / THẦN THÔNG ĐỈNH PHONG)
      // =====================================================================
      if (!isDefeated && activeTalents && activeTalents.length > 0) {
        ctx.save();

        // 1. KIM THÂN BẤT DIỆT (Golden Shield)
        const shieldTalent = activeTalents.find(t => t.baseId === "golden_shield");
        if (shieldTalent) {
          const isMax = shieldTalent.level === 3;
          ctx.save();
          ctx.strokeStyle = isMax ? "#fbbf24" : "rgba(251, 191, 36, 0.6)";
          ctx.lineWidth = isMax ? 3.5 : 2;
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = isMax ? 25 : 12;
          ctx.beginPath();
          ctx.ellipse(altarX, altarY - 20, 68 + Math.sin(time * 4) * (isMax ? 6 : 3), 48 + (isMax ? 8 : 4), 0, Math.PI, Math.PI * 2);
          ctx.stroke();

          if (isMax) {
            ctx.setLineDash([8, 6]);
            ctx.lineDashOffset = -time * 30;
            ctx.beginPath();
            ctx.arc(altarX, altarY - 25, 75, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        }

        // 2. VÔ SONG TẬT PHONG (Swift Blade)
        const swiftTalent = activeTalents.find(t => t.baseId === "swift_blade");
        if (swiftTalent) {
          const isMax = swiftTalent.level === 3;
          ctx.save();
          ctx.strokeStyle = isMax ? "#38bdf8" : "rgba(56, 189, 248, 0.5)";
          ctx.lineWidth = isMax ? 2.5 : 1.5;
          ctx.shadowColor = "#0284c7";
          ctx.shadowBlur = isMax ? 18 : 8;

          const blades = isMax ? 4 : 2;
          for (let b = 0; b < blades; b++) {
            const bAngle = time * (isMax ? 6 : 3) + (Math.PI * 2 / blades) * b;
            const bx = altarX + Math.cos(bAngle) * 55;
            const by = altarY - 35 + Math.sin(bAngle) * 22;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx - Math.cos(bAngle + 0.6) * 18, by - Math.sin(bAngle + 0.6) * 18);
            ctx.stroke();
          }
          ctx.restore();
        }

        // 3. DIỆT THẾ THẦN KIẾM (Divine Crit)
        const critTalent = activeTalents.find(t => t.baseId === "divine_crit");
        if (critTalent) {
          const isMax = critTalent.level === 3;
          ctx.save();
          ctx.strokeStyle = isMax ? "#f59e0b" : "rgba(245, 158, 11, 0.6)";
          ctx.lineWidth = isMax ? 2.2 : 1.2;
          ctx.shadowColor = "#eab308";
          ctx.shadowBlur = isMax ? 20 : 10;
          const sparkCount = isMax ? 4 : 2;
          for (let s = 0; s < sparkCount; s++) {
            const angle = time * 8 + s * 1.5;
            const sx = altarX + 20 + Math.cos(angle) * 15;
            const sy = altarY - 45 + Math.sin(angle) * 15;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + (Math.random() - 0.5) * 14, sy + (Math.random() - 0.5) * 14);
            ctx.stroke();
          }
          ctx.restore();
        }

        // 4. HUYẾT HẢI THẦN ĐỒNG (Blood Drain)
        const bloodTalent = activeTalents.find(t => t.baseId === "blood_drain");
        if (bloodTalent) {
          const isMax = bloodTalent.level === 3;
          ctx.save();
          ctx.fillStyle = isMax ? "rgba(244, 63, 94, 0.4)" : "rgba(244, 63, 94, 0.2)";
          ctx.shadowColor = "#f43f5e";
          ctx.shadowBlur = isMax ? 20 : 10;
          for (let o = 0; o < (isMax ? 5 : 2); o++) {
            const ox = altarX - 35 + o * 18 + Math.sin(time * 3 + o) * 8;
            const oy = altarY - 10 - ((time * 40 + o * 25) % 65);
            ctx.beginPath();
            ctx.arc(ox, oy, isMax ? 3.5 : 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // 5. CỬU LONG TRẤN THIÊN (Dragon Wrath)
        const dragonTalent = activeTalents.find(t => t.baseId === "dragon_wrath");
        if (dragonTalent) {
          const isMax = dragonTalent.level === 3;
          ctx.save();
          ctx.strokeStyle = isMax ? "#eab308" : "rgba(234, 179, 8, 0.5)";
          ctx.lineWidth = isMax ? 3 : 1.5;
          ctx.shadowColor = "#ca8a04";
          ctx.shadowBlur = isMax ? 24 : 12;
          ctx.beginPath();
          ctx.arc(altarX, altarY - 60, 60 + Math.sin(time * 3) * 5, -Math.PI * 0.8, -Math.PI * 0.2);
          ctx.stroke();
          if (isMax) {
            ctx.beginPath();
            ctx.moveTo(altarX - 25, altarY - 95);
            ctx.quadraticCurveTo(altarX - 45, altarY - 120, altarX - 60, altarY - 105);
            ctx.moveTo(altarX + 25, altarY - 95);
            ctx.quadraticCurveTo(altarX + 45, altarY - 120, altarX + 60, altarY - 105);
            ctx.stroke();
          }
          ctx.restore();
        }

        // 6. VẠN GIỚI ĐẠO TÂM (Wisdom Aura)
        const wisdomTalent = activeTalents.find(t => t.baseId === "wisdom_aura");
        if (wisdomTalent) {
          const isMax = wisdomTalent.level === 3;
          ctx.save();
          ctx.strokeStyle = isMax ? "#c084fc" : "rgba(192, 132, 252, 0.4)";
          ctx.lineWidth = isMax ? 2 : 1;
          ctx.shadowColor = "#9333ea";
          ctx.shadowBlur = isMax ? 18 : 8;
          ctx.beginPath();
          ctx.ellipse(altarX, altarY + 22, 90, 30, time * 0.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        ctx.restore();
      }

      // Draw Character Sprite
      if (spriteImg && spriteImg.complete) {
        const catW = 96;
        const catH = 96;
        const floatY = isDefeated ? 6 : Math.sin(time * 3) * 4;

        if (isDefeated) {
          // HIỆU ỨNG ĐẠO THÂN TIÊU BIẾN / HỒN PHÁCH XUẤT KHIẾU (CELESTIAL SOUL DISSOLUTION)
          ctx.save();
          ctx.globalAlpha = 0.85;
          ctx.drawImage(spriteImg, altarX - catW / 2, altarY - catH + 30, catW, catH * 0.7);

          ctx.globalAlpha = 0.45 + Math.sin(time * 4) * 0.2;
          ctx.shadowColor = "#60a5fa";
          ctx.shadowBlur = 20;
          ctx.drawImage(spriteImg, altarX - catW / 2, altarY - catH - 25 - Math.sin(time * 2) * 15, catW, catH);

          ctx.strokeStyle = "rgba(147, 197, 253, 0.6)";
          ctx.lineWidth = 1.5;
          for (let i = 0; i < 5; i++) {
            const rx = altarX + Math.sin(time * 3 + i) * 35;
            const ry = altarY - 50 - i * 18 - (time * 15 % 30);
            ctx.beginPath();
            ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        } else {
          ctx.drawImage(spriteImg, altarX - catW / 2, altarY - catH + 15 + floatY, catW, catH);
        }
      }

      // HIỆU ỨNG CHIÊU THỨC CHƯỞNG ẤN RIÊNG TỪNG DẠNG THẦN KHI TẤN CÔNG
      if ((catState === "attack" || catState === "ultimate") && !isDefeated) {
        ctx.save();
        if (currentRealmIdx === 0) {
          // Luyện Khí: Thanh Trúc Kiếm Chưởng - Vòng xoáy lá trúc xanh ngắt
          ctx.strokeStyle = "#4ade80";
          ctx.lineWidth = 2.5;
          ctx.shadowColor = "#22c55e";
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(altarX, altarY - 45, 38 + Math.sin(time * 10) * 8, 0, Math.PI * 2);
          ctx.stroke();
        } else if (currentRealmIdx === 1) {
          // Trúc Cơ: Bích Hải Chưởng Ấn - Sóng ngọc bích tỏa rộng
          ctx.strokeStyle = "#2dd4bf";
          ctx.lineWidth = 3.5;
          ctx.shadowColor = "#0d9488";
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.ellipse(altarX, altarY - 45, 50, 25, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (currentRealmIdx === 2) {
          // Kim Đan: Thái Ất Chân Hỏa Chưởng - Nhật luân hoàng kim chói lòa
          ctx.fillStyle = "rgba(251, 191, 36, 0.35)";
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = 4;
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 25;
          ctx.beginPath();
          ctx.arc(altarX, altarY - 45, 45, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (currentRealmIdx === 3) {
          // Nguyên Anh: Cửu Thiên Lôi Đình Chưởng - Vạn trượng thần lôi giáng thế
          ctx.strokeStyle = "#c084fc";
          ctx.lineWidth = 3.5;
          ctx.shadowColor = "#9333ea";
          ctx.shadowBlur = 24;
          for (let l = 0; l < 4; l++) {
            const angle = (Math.PI / 2) * l + time * 5;
            ctx.beginPath();
            ctx.moveTo(altarX, altarY - 45);
            ctx.lineTo(altarX + Math.cos(angle) * 55, altarY - 45 + Math.sin(angle) * 55);
            ctx.stroke();
          }
        } else {
          // Độ Kiếp / Thiên Tôn: Vạn Kiếp Long Ngâm Chưởng - Thần Long hoàng kim thăng thiên
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 5;
          ctx.shadowColor = "#d97706";
          ctx.shadowBlur = 30;
          ctx.beginPath();
          ctx.arc(altarX, altarY - 50, 65, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 4. DRAW 4 DYNAMIC ASTEROID TYPES
      asteroids.forEach(ast => {
        ctx.save();
        ctx.translate(ast.x, ast.y);

        const r = ast.radius;
        const pTime = performance.now() * 0.003;
        const isTarget = ast.id === activeTargetId;

        // Active target reticle
        if (isTarget) {
          ctx.save();
          ctx.strokeStyle = "#ffdf79";
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.lineDashOffset = -pTime * 25;
          ctx.beginPath();
          ctx.arc(0, 0, r + 18, 0, Math.PI * 2);
          ctx.stroke();

          // Reticle pointer notches
          for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i + pTime;
            const nx = Math.cos(angle) * (r + 14);
            const ny = Math.sin(angle) * (r + 14);
            ctx.fillStyle = "#ffdf79";
            ctx.beginPath();
            ctx.arc(nx, ny, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        if (ast.type === "FROST") {
          // BĂNG PHÁCH: Crystalline jagged ice core with rotating blizzard
          ctx.rotate(ast.rotation);
          const iceGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, r);
          iceGrad.addColorStop(0, "#ffffff");
          iceGrad.addColorStop(0.4, "#7dd3fc");
          iceGrad.addColorStop(0.8, "#0284c7");
          iceGrad.addColorStop(1, "rgba(2, 132, 199, 0.1)");
          ctx.fillStyle = iceGrad;
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = 18;

          // 8-point ice star
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const a = (Math.PI / 4) * i;
            const dist = i % 2 === 0 ? r : r * 0.65;
            const px = Math.cos(a) * dist;
            const py = Math.sin(a) * dist;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();

        } else if (ast.type === "INFERNO") {
          // HỎA DIỄM: Swirling fiery tongues and volcanic core
          ctx.rotate(-ast.rotation * 1.4);
          const fireGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, r * 1.1);
          fireGrad.addColorStop(0, "#fef08a");
          fireGrad.addColorStop(0.3, "#f97316");
          fireGrad.addColorStop(0.7, "#dc2626");
          fireGrad.addColorStop(1, "rgba(220, 38, 38, 0)");
          ctx.fillStyle = fireGrad;
          ctx.shadowColor = "#f97316";
          ctx.shadowBlur = 24;

          ctx.beginPath();
          const flamePoints = 9;
          for (let i = 0; i < flamePoints; i++) {
            const a = (Math.PI * 2 / flamePoints) * i;
            const wave = Math.sin(pTime * 5 + i) * 6;
            const dist = r + wave;
            const px = Math.cos(a) * dist;
            const py = Math.sin(a) * dist;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();

        } else if (ast.type === "VOID") {
          // HƯ KHÔNG: Event horizon cosmic vortex
          ctx.rotate(ast.rotation * 0.8);
          const voidGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.2);
          voidGrad.addColorStop(0, "#090514");
          voidGrad.addColorStop(0.4, "#3b0764");
          voidGrad.addColorStop(0.7, "#7e22ce");
          voidGrad.addColorStop(1, "rgba(126, 34, 206, 0)");
          ctx.fillStyle = voidGrad;
          ctx.shadowColor = "#a855f7";
          ctx.shadowBlur = 20;

          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();

          // Orbiting void suction tentacles
          ctx.strokeStyle = "rgba(192, 132, 252, 0.7)";
          ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, r * (0.4 + i * 0.25), pTime * (i + 1), pTime * (i + 1) + Math.PI);
            ctx.stroke();
          }

        } else {
          // HUYẾT LÔI: Pulsing blood heart with crackling electric arcs
          const pulseR = r + Math.sin(pTime * 8) * 4;
          const bloodGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, pulseR * 1.15);
          bloodGrad.addColorStop(0, "#fecdd3");
          bloodGrad.addColorStop(0.3, "#e11d48");
          bloodGrad.addColorStop(0.7, "#881337");
          bloodGrad.addColorStop(1, "rgba(136, 19, 55, 0)");
          ctx.fillStyle = bloodGrad;
          ctx.shadowColor = "#f43f5e";
          ctx.shadowBlur = 25;

          ctx.beginPath();
          ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
          ctx.fill();

          // Electric lightning arcs
          ctx.strokeStyle = "#fed7aa";
          ctx.lineWidth = 1.8;
          for (let i = 0; i < 4; i++) {
            const a1 = (Math.PI / 2) * i + pTime * 4;
            const lx1 = Math.cos(a1) * (pulseR * 0.7);
            const ly1 = Math.sin(a1) * (pulseR * 0.7);
            const midX = (Math.cos(a1 + 0.3) * (pulseR * 1.25)) + (Math.random() * 6 - 3);
            const midY = (Math.sin(a1 + 0.3) * (pulseR * 1.25)) + (Math.random() * 6 - 3);
            const lx2 = Math.cos(a1 + 0.6) * (pulseR * 0.8);
            const ly2 = Math.sin(a1 + 0.6) * (pulseR * 0.8);

            ctx.beginPath();
            ctx.moveTo(lx1, ly1);
            ctx.lineTo(midX, midY);
            ctx.lineTo(lx2, ly2);
            ctx.stroke();
          }
        }

        ctx.restore(); // end asteroid matrix

        // 5. WORD BANNER ON TOP OF ASTEROID
        ctx.save();
        const bannerW = Math.max(90, ast.word.length * 13 + 24);
        const bannerH = 34;
        const bx = ast.x - bannerW / 2;
        const by = ast.y + ast.radius + 6;

        // Banner backdrop
        ctx.fillStyle = "rgba(17, 24, 18, 0.88)";
        ctx.strokeStyle = isTarget ? "#ffdf79" : "rgba(152, 176, 111, 0.6)";
        ctx.lineWidth = isTarget ? 2 : 1.2;
        ctx.shadowColor = isTarget ? "#ffdf79" : "rgba(0,0,0,0.5)";
        ctx.shadowBlur = isTarget ? 10 : 4;

        ctx.beginPath();
        ctx.roundRect(bx, by, bannerW, bannerH, 6);
        ctx.fill();
        ctx.stroke();

        // Type matching text
        ctx.font = "bold 15px monospace";
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";

        const textStartX = bx + 12;
        const textY = by + bannerH / 2;

        const typedPart = ast.word.substring(0, ast.typed.length);
        const remainingPart = ast.word.substring(ast.typed.length);

        // Highlight typed characters in Gold / Emerald
        ctx.fillStyle = "#ffdf79";
        ctx.fillText(typedPart, textStartX, textY);

        const typedWidth = ctx.measureText(typedPart).width;

        // Un-typed characters in Crisp White
        ctx.fillStyle = "#f9f5e8";
        ctx.fillText(remainingPart, textStartX + typedWidth, textY);

        ctx.restore();
      });

      // 6. DRAW UNIQUE PROJECTILES ACCORDING TO REALM FORM
      projectiles.forEach(p => {
        ctx.save();

        if (p.type === "bamboo") {
          // Luyện Khí: Emerald Bamboo Blade
          ctx.strokeStyle = "#4ade80";
          ctx.lineWidth = 3;
          ctx.shadowColor = "#22c55e";
          ctx.shadowBlur = 12;

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - (p.targetX - p.startX) * 0.08, p.y - (p.targetY - p.startY) * 0.08);
          ctx.stroke();

          ctx.fillStyle = "#86efac";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fill();

        } else if (p.type === "jade") {
          // Trúc Cơ: Dual Jade Crescent boomerangs
          ctx.strokeStyle = "#2dd4bf";
          ctx.lineWidth = 3.5;
          ctx.shadowColor = "#14b8a6";
          ctx.shadowBlur = 16;

          const spin = performance.now() * 0.01;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 10, spin, spin + Math.PI * 1.2);
          ctx.stroke();

        } else if (p.type === "solar") {
          // Kim Đan: Blazing Solar Beam
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 5;
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 20;

          ctx.beginPath();
          ctx.moveTo(p.startX, p.startY);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
          ctx.fill();

        } else if (p.type === "lightning") {
          // Nguyên Anh: Jagged Purple Lightning Bolts
          ctx.strokeStyle = "#c084fc";
          ctx.lineWidth = 3;
          ctx.shadowColor = "#9333ea";
          ctx.shadowBlur = 22;

          ctx.beginPath();
          ctx.moveTo(p.startX, p.startY);
          const steps = 6;
          for (let s = 1; s <= steps; s++) {
            const frac = s / steps;
            const sx = p.startX + (p.x - p.startX) * frac + (Math.random() * 16 - 8);
            const sy = p.startY + (p.y - p.startY) * frac + (Math.random() * 16 - 8);
            ctx.lineTo(sx, sy);
          }
          ctx.stroke();

        } else {
          // Độ Kiếp: Golden Eastern Celestial Dragon
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 6;
          ctx.shadowColor = "#d97706";
          ctx.shadowBlur = 25;

          // Dragon Head
          ctx.fillStyle = "#fef08a";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Dragon sinuous body trail
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          p.trail.forEach((pt, idx) => {
            const wave = Math.sin(idx * 0.8 + performance.now() * 0.01) * 8;
            ctx.lineTo(pt.x + wave, pt.y);
          });
          ctx.stroke();
        }

        ctx.restore();
      });

      // 7. DRAW PARTICLES
      particles.forEach(pt => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.shadowColor = pt.color;
        ctx.shadowBlur = 6;

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 8. DRAW FLOATING COMBAT TEXT (IPA CARDS & SCORE)
      floatingTexts.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);

        if (ft.type === "ipa_card") {
          // Special Xianxia IPA Card
          const cardW = 200;
          const cardH = 50;
          ctx.fillStyle = "rgba(22, 14, 8, 0.94)";
          ctx.strokeStyle = "#ffdf79";
          ctx.lineWidth = 1.8;
          ctx.shadowColor = "#ffdf79";
          ctx.shadowBlur = 12;

          ctx.beginPath();
          ctx.roundRect(ft.x - cardW / 2, ft.y - cardH / 2, cardW, cardH, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#ffdf79";
          ctx.font = "bold 13px serif";
          ctx.textAlign = "center";
          ctx.fillText(ft.text, ft.x, ft.y - 7);

          if (ft.subtext) {
            ctx.fillStyle = "#98b06f";
            ctx.font = "italic 11px sans-serif";
            ctx.fillText(ft.subtext, ft.x, ft.y + 13);
          }
        } else {
          // Combo & Score numbers
          ctx.fillStyle = ft.color;
          ctx.shadowColor = ft.color;
          ctx.shadowBlur = 8;
          ctx.font = `bold ${ft.fontSize}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(ft.text, ft.x, ft.y);
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [asteroids, projectiles, particles, floatingTexts, currentRealmIdx, catState, activeTargetId, activeTalents, imagesLoaded]);

  // High-DPI Canvas Resizing
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !canvas.parentElement) return;

      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div 
      className="relative w-full h-full overflow-hidden select-none bg-black flex items-center justify-center cursor-crosshair"
      onClick={onCanvasClick}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};
