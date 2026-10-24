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
  screenShake?: number;
  onCanvasClick?: () => void;
}

const V_WIDTH = 800;
const V_HEIGHT = 700;

export const MeowchaArena: React.FC<MeowchaArenaProps> = ({
  asteroids,
  projectiles,
  particles,
  floatingTexts,
  currentRealmIdx,
  catState,
  activeTargetId,
  activeTalents = [],
  screenShake = 0,
  onCanvasClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spritesRef = useRef<Record<string, HTMLImageElement>>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload all 14 game sprites
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
      cat_hurt: "/meowcha/sprites/cat_hurt.png",
      cat_defeated: "/meowcha/sprites/cat_defeated.png",
      prop_asteroid: "/meowcha/sprites/prop_asteroid.png",
      prop_bamboo_sword: "/meowcha/sprites/prop_bamboo_sword.png",
      prop_jade_sword: "/meowcha/sprites/prop_jade_sword.png",
      prop_sword_slash: "/meowcha/sprites/prop_sword_slash.png",
      prop_tea_explosion: "/meowcha/sprites/prop_tea_explosion.png"
    };

    const total = Object.keys(requiredImages).length;

    Object.entries(requiredImages).forEach(([key, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        spritesRef.current[key] = img;
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
      // 1. UNIFIED VIRTUAL COORDINATE TRANSFORMATION WITH ASPECT RATIO PRESERVATION
      const parent = canvas.parentElement;
      const cssW = parent ? parent.clientWidth : 800;
      const cssH = parent ? parent.clientHeight : 700;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      const targetCanvasW = Math.floor(cssW * dpr);
      const targetCanvasH = Math.floor(cssH * dpr);

      if (canvas.width !== targetCanvasW || canvas.height !== targetCanvasH) {
        canvas.width = targetCanvasW;
        canvas.height = targetCanvasH;
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
      }

      // Reset transform before drawing full-bleed background
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // 2. BACKGROUND & SANCTUARY ATMOSPHERE (FULL BLEED COVER)
      const bgImg = spritesRef.current["bg"];
      if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
        // Draw full cover on entire canvas
        ctx.drawImage(bgImg, 0, 0, targetCanvasW, targetCanvasH);
        ctx.fillStyle = "rgba(4, 10, 6, 0.22)";
        ctx.fillRect(0, 0, targetCanvasW, targetCanvasH);
      } else {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, targetCanvasH);
        bgGrad.addColorStop(0, "#050b07");
        bgGrad.addColorStop(0.6, "#0d1f14");
        bgGrad.addColorStop(1, "#14291c");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, targetCanvasW, targetCanvasH);
      }

      // Compute uniform scale to fit 800x700 virtual space without stretching/squashing
      const scale = Math.min(targetCanvasW / V_WIDTH, targetCanvasH / V_HEIGHT);
      const offsetX = (targetCanvasW - V_WIDTH * scale) / 2;
      const offsetY = (targetCanvasH - V_HEIGHT * scale) / 2;

      ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

      // SCREEN SHAKE EFFECT ("HIỆU ỨNG RUNG")
      if (screenShake > 0) {
        const sx = (Math.random() - 0.5) * screenShake;
        const sy = (Math.random() - 0.5) * screenShake;
        ctx.translate(sx, sy);
      }

      const time = performance.now() * 0.002;

      // 3. CELESTIAL ALTAR & LOTUS PLATFORM
      // Anchored permanently at (400, 635)
      const altarX = 400;
      const altarY = 635;

      // Misty Cloud Aura under Altar
      ctx.save();
      const cloudGrad = ctx.createRadialGradient(altarX, altarY + 22, 15, altarX, altarY + 22, 140);
      cloudGrad.addColorStop(0, "rgba(220, 245, 225, 0.32)");
      cloudGrad.addColorStop(0.6, "rgba(152, 176, 111, 0.12)");
      cloudGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = cloudGrad;
      ctx.beginPath();
      ctx.ellipse(altarX, altarY + 22, 160, 45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Cultivation Yin-Yang / Lotus Ring around Cat
      const realm = REALMS[currentRealmIdx] || REALMS[0];
      const auraColor = realm.auraColor;

      ctx.save();
      ctx.strokeStyle = auraColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = auraColor;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(altarX, altarY - 20, 52 + Math.sin(time * 2.5) * 4, 0, Math.PI * 2);
      ctx.stroke();

      // Dashed rotating Bagua rune ring
      ctx.setLineDash([8, 8]);
      ctx.lineDashOffset = -time * 24;
      ctx.strokeStyle = "rgba(255, 223, 121, 0.5)";
      ctx.beginPath();
      ctx.arc(altarX, altarY - 20, 64, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      const isDefeated = catState === "defeated";

      // 3.5. REALM-SPECIFIC CELESTIAL PHENOMENA (Kim Đan Bagua, Nguyên Anh Plasma, Thiên Tôn Swords)
      if (!isDefeated) {
        if (currentRealmIdx === 2) {
          // KIM ĐAN KỲ: Rotating 8-Trigram Golden Bagua Wheel behind Golden Core Cat
          ctx.save();
          ctx.translate(altarX, altarY - 50);
          ctx.rotate(time * 0.8);
          ctx.strokeStyle = "rgba(251, 191, 36, 0.65)";
          ctx.lineWidth = 2.2;
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(0, 0, 56, 0, Math.PI * 2);
          ctx.stroke();

          for (let i = 0; i < 8; i++) {
            const ang = (Math.PI / 4) * i;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ang) * 24, Math.sin(ang) * 24);
            ctx.lineTo(Math.cos(ang) * 54, Math.sin(ang) * 54);
            ctx.stroke();
          }
          ctx.restore();
        } else if (currentRealmIdx === 3) {
          // NGUYÊN ANH KỲ: 3 Crackling Purple Plasma Orbs orbiting the Nascent Soul Cat
          ctx.save();
          ctx.translate(altarX, altarY - 50);
          for (let i = 0; i < 3; i++) {
            const ang = time * 2.2 + (Math.PI * 2 / 3) * i;
            const ox = Math.cos(ang) * 58;
            const oy = Math.sin(ang) * 26;
            ctx.fillStyle = "#c084fc";
            ctx.shadowColor = "#9333ea";
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.arc(ox, oy, 7, 0, Math.PI * 2);
            ctx.fill();

            const nextAng = time * 2.2 + (Math.PI * 2 / 3) * ((i + 1) % 3);
            const nox = Math.cos(nextAng) * 58;
            const noy = Math.sin(nextAng) * 26;
            ctx.strokeStyle = "rgba(216, 180, 254, 0.75)";
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(ox, oy);
            ctx.lineTo((ox + nox) / 2 + (Math.random() - 0.5) * 12, (oy + noy) / 2 + (Math.random() - 0.5) * 12);
            ctx.lineTo(nox, noy);
            ctx.stroke();
          }
          ctx.restore();
        } else if (currentRealmIdx >= 4) {
          // ĐỘ KIẾP / THIÊN TÔN: 6 Orbiting Sacred Golden Flying Swords
          ctx.save();
          ctx.translate(altarX, altarY - 55);
          for (let i = 0; i < 6; i++) {
            const ang = time * 1.6 + (Math.PI * 2 / 6) * i;
            const ox = Math.cos(ang) * 68;
            const oy = Math.sin(ang) * 32;
            ctx.save();
            ctx.translate(ox, oy);
            ctx.rotate(ang + Math.PI / 2);
            ctx.fillStyle = "#fbbf24";
            ctx.shadowColor = "#f59e0b";
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.moveTo(0, -18);
            ctx.lineTo(5, 16);
            ctx.lineTo(-5, 16);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -14);
            ctx.lineTo(0, 14);
            ctx.stroke();
            ctx.restore();
          }
          ctx.restore();
        }
      }

      // 4. TALENT VISUAL TRANSMUTATION ("HÓA MẠNH NHẤT")
      if (!isDefeated && activeTalents && activeTalents.length > 0) {
        ctx.save();

        // 1. KIM THÂN BẤT DIỆT (Golden Shield)
        const shieldTalent = activeTalents.find(t => t.baseId === "golden_shield");
        if (shieldTalent) {
          const isMax = shieldTalent.level === 3;
          ctx.save();
          ctx.strokeStyle = isMax ? "#fbbf24" : "rgba(251, 191, 36, 0.65)";
          ctx.lineWidth = isMax ? 3.5 : 2;
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = isMax ? 25 : 12;
          ctx.beginPath();
          ctx.ellipse(altarX, altarY - 20, 72 + Math.sin(time * 4) * (isMax ? 6 : 3), 52 + (isMax ? 8 : 4), 0, Math.PI, Math.PI * 2);
          ctx.stroke();

          if (isMax) {
            ctx.setLineDash([8, 6]);
            ctx.lineDashOffset = -time * 30;
            ctx.beginPath();
            ctx.arc(altarX, altarY - 25, 80, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        }

        // 2. VÔ SONG TẬT PHONG (Swift Blade)
        const swiftTalent = activeTalents.find(t => t.baseId === "swift_blade");
        if (swiftTalent) {
          const isMax = swiftTalent.level === 3;
          ctx.save();
          ctx.strokeStyle = isMax ? "#38bdf8" : "rgba(56, 189, 248, 0.55)";
          ctx.lineWidth = isMax ? 2.5 : 1.5;
          ctx.shadowColor = "#0284c7";
          ctx.shadowBlur = isMax ? 20 : 10;

          const blades = isMax ? 4 : 2;
          for (let b = 0; b < blades; b++) {
            const bAngle = time * (isMax ? 6 : 3) + (Math.PI * 2 / blades) * b;
            const bx = altarX + Math.cos(bAngle) * 60;
            const by = altarY - 35 + Math.sin(bAngle) * 24;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx - Math.cos(bAngle + 0.6) * 20, by - Math.sin(bAngle + 0.6) * 20);
            ctx.stroke();
          }
          ctx.restore();
        }

        // 3. DIỆT THẾ THẦN KIẾM (Divine Crit)
        const critTalent = activeTalents.find(t => t.baseId === "divine_crit");
        if (critTalent) {
          const isMax = critTalent.level === 3;
          ctx.save();
          ctx.strokeStyle = isMax ? "#f59e0b" : "rgba(245, 158, 11, 0.65)";
          ctx.lineWidth = isMax ? 2.5 : 1.5;
          ctx.shadowColor = "#eab308";
          ctx.shadowBlur = isMax ? 22 : 12;
          const sparkCount = isMax ? 5 : 2;
          for (let s = 0; s < sparkCount; s++) {
            const angle = time * 8 + s * 1.5;
            const sx = altarX + 22 + Math.cos(angle) * 16;
            const sy = altarY - 45 + Math.sin(angle) * 16;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + (Math.random() - 0.5) * 16, sy + (Math.random() - 0.5) * 16);
            ctx.stroke();
          }
          ctx.restore();
        }

        // 4. HUYẾT HẢI THẦN ĐỒNG (Blood Drain)
        const bloodTalent = activeTalents.find(t => t.baseId === "blood_drain");
        if (bloodTalent) {
          const isMax = bloodTalent.level === 3;
          ctx.save();
          ctx.fillStyle = isMax ? "rgba(244, 63, 94, 0.5)" : "rgba(244, 63, 94, 0.25)";
          ctx.shadowColor = "#f43f5e";
          ctx.shadowBlur = isMax ? 20 : 10;
          for (let o = 0; o < (isMax ? 5 : 2); o++) {
            const ox = altarX - 40 + o * 20 + Math.sin(time * 3 + o) * 8;
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
          ctx.strokeStyle = isMax ? "#eab308" : "rgba(234, 179, 8, 0.55)";
          ctx.lineWidth = isMax ? 3.5 : 1.8;
          ctx.shadowColor = "#ca8a04";
          ctx.shadowBlur = isMax ? 25 : 12;
          ctx.beginPath();
          ctx.arc(altarX, altarY - 60, 65 + Math.sin(time * 3) * 5, -Math.PI * 0.8, -Math.PI * 0.2);
          ctx.stroke();
          ctx.restore();
        }

        // 6. VẠN GIỚI ĐẠO TÂM (Wisdom Aura)
        const wisdomTalent = activeTalents.find(t => t.baseId === "wisdom_aura");
        if (wisdomTalent) {
          const isMax = wisdomTalent.level === 3;
          ctx.save();
          ctx.strokeStyle = isMax ? "#c084fc" : "rgba(192, 132, 252, 0.45)";
          ctx.lineWidth = isMax ? 2.5 : 1.2;
          ctx.shadowColor = "#9333ea";
          ctx.shadowBlur = isMax ? 20 : 10;
          ctx.beginPath();
          ctx.ellipse(altarX, altarY + 22, 95, 32, time * 0.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        ctx.restore();
      }

      // 5. CAT CHARACTER SPRITE RENDERING FOR ALL REALMS & FORMS
      let spriteImg: HTMLImageElement | undefined;

      if (isDefeated) {
        spriteImg = spritesRef.current["cat_defeated"] || spritesRef.current["cat_hurt"];
      } else if (catState === "hurt") {
        spriteImg = spritesRef.current["cat_hurt"];
      } else if (catState === "ultimate") {
        // VẠN KIẾM QUY TÔNG: Higher realms retain their divine form with ultimate radiance aura!
        if (currentRealmIdx >= 4) spriteImg = spritesRef.current["cat_celestial"];
        else if (currentRealmIdx === 3) spriteImg = spritesRef.current["cat_nascent"];
        else if (currentRealmIdx === 2) spriteImg = spritesRef.current["cat_golden"];
        else spriteImg = spritesRef.current["cat_blast"] || spritesRef.current["cat_weak"];
      } else if (catState === "attack") {
        if (currentRealmIdx >= 4) spriteImg = spritesRef.current["cat_celestial"];
        else if (currentRealmIdx === 3) spriteImg = spritesRef.current["cat_nascent"];
        else if (currentRealmIdx === 2) spriteImg = spritesRef.current["cat_golden"];
        else if (currentRealmIdx === 1) spriteImg = spritesRef.current["cat_weak"];
        else spriteImg = spritesRef.current["cat_weak"];
      } else {
        // Idle
        if (currentRealmIdx >= 4) spriteImg = spritesRef.current["cat_celestial"];
        else if (currentRealmIdx === 3) spriteImg = spritesRef.current["cat_nascent"];
        else if (currentRealmIdx === 2) spriteImg = spritesRef.current["cat_golden"];
        else if (currentRealmIdx === 1) spriteImg = spritesRef.current["cat_idle"];
        else spriteImg = spritesRef.current["cat_idle"];
      }

      // Draw Cat Character
      const catW = 140;
      const catH = 140;
      const floatY = isDefeated ? 6 : Math.sin(time * 3) * 4;

      if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
        if (isDefeated) {
          // CELESTIAL SOUL DISSOLUTION
          ctx.save();
          ctx.globalAlpha = 0.8;
          ctx.drawImage(spriteImg, altarX - catW / 2, altarY - catH + 30, catW, catH * 0.7);

          ctx.globalAlpha = 0.45 + Math.sin(time * 4) * 0.2;
          ctx.shadowColor = "#60a5fa";
          ctx.shadowBlur = 24;
          ctx.drawImage(spriteImg, altarX - catW / 2, altarY - catH - 25 - Math.sin(time * 2) * 15, catW, catH);
          ctx.restore();
        } else {
          ctx.save();
          // Ultimate blast radiance
          if (catState === "ultimate") {
            ctx.shadowColor = "#ffdf79";
            ctx.shadowBlur = 30;
          }
          ctx.drawImage(spriteImg, altarX - catW / 2, altarY - catH + 18 + floatY, catW, catH);
          ctx.restore();
        }
      }

      // Draw Horizontal Bamboo Sword on Tatami Mat in Front of Cat (as seen in Image 1)
      const bambooSwordImg = spritesRef.current["prop_bamboo_sword"];
      if (bambooSwordImg && bambooSwordImg.complete && bambooSwordImg.naturalWidth > 0 && !isDefeated) {
        ctx.save();
        ctx.translate(altarX, altarY + 8);
        ctx.rotate(Math.PI / 2); // Lay horizontal across altar
        ctx.shadowColor = "#4ade80";
        ctx.shadowBlur = 8;
        ctx.drawImage(bambooSwordImg, -10, -32, 20, 64);
        ctx.restore();
      }

      // 6. REALM CHIÊU THỨC CHƯỞNG ẤN (QI SKILLS & BARRAGE AURA)
      if ((catState === "attack" || catState === "ultimate") && !isDefeated) {
        ctx.save();
        if (currentRealmIdx === 0) {
          // Luyện Khí: Thanh Trúc Kiếm Chưởng - Vòng xoáy lá trúc xanh ngọc bích
          ctx.strokeStyle = "#4ade80";
          ctx.lineWidth = catState === "ultimate" ? 4 : 2.5;
          ctx.shadowColor = "#22c55e";
          ctx.shadowBlur = catState === "ultimate" ? 28 : 16;
          ctx.beginPath();
          ctx.arc(altarX, altarY - 50, 42 + Math.sin(time * 12) * 8, 0, Math.PI * 2);
          ctx.stroke();

          // Spiral sword qi
          for (let q = 0; q < 3; q++) {
            const qAngle = time * 8 + (Math.PI * 2 / 3) * q;
            ctx.beginPath();
            ctx.moveTo(altarX + Math.cos(qAngle) * 30, altarY - 50 + Math.sin(qAngle) * 30);
            ctx.lineTo(altarX + Math.cos(qAngle + 0.8) * 65, altarY - 50 + Math.sin(qAngle + 0.8) * 65);
            ctx.stroke();
          }
        } else if (currentRealmIdx === 1) {
          // Trúc Cơ: Bích Hải Chưởng Ấn - Sóng ngọc bích tỏa rộng
          ctx.strokeStyle = "#2dd4bf";
          ctx.lineWidth = 4;
          ctx.shadowColor = "#0d9488";
          ctx.shadowBlur = 24;
          ctx.beginPath();
          ctx.ellipse(altarX, altarY - 50, 56, 28, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (currentRealmIdx === 2) {
          // Kim Đan: Thái Ất Chân Hỏa - Nhật luân hoàng kim rực sáng
          ctx.fillStyle = "rgba(251, 191, 36, 0.35)";
          ctx.strokeStyle = "#f59e0b";
          ctx.lineWidth = 4.5;
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 30;
          ctx.beginPath();
          ctx.arc(altarX, altarY - 50, 50, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (currentRealmIdx === 3) {
          // Nguyên Anh: Cửu Thiên Lôi Đình - Vạn trượng thần lôi
          ctx.strokeStyle = "#c084fc";
          ctx.lineWidth = 4;
          ctx.shadowColor = "#9333ea";
          ctx.shadowBlur = 28;
          for (let l = 0; l < 5; l++) {
            const angle = (Math.PI * 2 / 5) * l + time * 6;
            ctx.beginPath();
            ctx.moveTo(altarX, altarY - 50);
            ctx.lineTo(altarX + Math.cos(angle) * 65, altarY - 50 + Math.sin(angle) * 65);
            ctx.stroke();
          }
        } else {
          // Độ Kiếp / Thiên Tôn: Vạn Kiếp Long Ngâm - Thần Long xuất thế
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 5.5;
          ctx.shadowColor = "#d97706";
          ctx.shadowBlur = 35;
          ctx.beginPath();
          ctx.arc(altarX, altarY - 55, 72, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 7. DRAW ASTEROIDS & AUTHENTIC TALISMAN WORD BOX (EXACT TO IMAGE 1)
      asteroids.forEach(ast => {
        ctx.save();
        ctx.translate(ast.x, ast.y);

        const r = Math.max(ast.radius, 48);
        const pTime = performance.now() * 0.003;

        // A. CELESTIAL METEOR SHAPES PER REALM / ASTEROID TYPE
        if (ast.type === "FROST") {
          // BĂNG PHÁCH THẠCH (As shown in Image 1): Faceted Glowing Blue Ice Crystal
          ctx.rotate(ast.rotation * 0.6);

          // Deep Ice Core Glow
          const iceHalo = ctx.createRadialGradient(0, 0, 5, 0, 0, r * 1.5);
          iceHalo.addColorStop(0, "rgba(255, 255, 255, 0.95)");
          iceHalo.addColorStop(0.3, "rgba(125, 211, 252, 0.85)");
          iceHalo.addColorStop(0.7, "rgba(2, 132, 199, 0.45)");
          iceHalo.addColorStop(1, "rgba(2, 132, 199, 0)");
          ctx.fillStyle = iceHalo;
          ctx.beginPath();
          ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
          ctx.fill();

          // 3D Faceted Crystal Polygon (Gemstone cut)
          const crystalPoints = [
            { x: 0, y: -r * 1.15 },
            { x: r * 0.95, y: -r * 0.45 },
            { x: r * 0.75, y: r * 0.85 },
            { x: -r * 0.75, y: r * 0.85 },
            { x: -r * 0.95, y: -r * 0.45 },
          ];

          // Base crystal
          ctx.fillStyle = "#38bdf8";
          ctx.strokeStyle = "#bae6fd";
          ctx.lineWidth = 2.5;
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = 18;
          ctx.beginPath();
          crystalPoints.forEach((pt, i) => {
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Facet inner lines
          ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
          ctx.lineWidth = 1.4;
          crystalPoints.forEach(pt => {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(pt.x, pt.y);
            ctx.stroke();
          });

        } else if (ast.type === "INFERNO") {
          // U HỎA THẠCH: Volcanic Magma Core with Flame Tongues
          ctx.rotate(-ast.rotation * 1.2);
          const fireHalo = ctx.createRadialGradient(0, 0, 4, 0, 0, r * 1.5);
          fireHalo.addColorStop(0, "rgba(254, 240, 138, 0.95)");
          fireHalo.addColorStop(0.35, "rgba(249, 115, 22, 0.75)");
          fireHalo.addColorStop(0.75, "rgba(220, 38, 38, 0.4)");
          fireHalo.addColorStop(1, "rgba(220, 38, 38, 0)");
          ctx.fillStyle = fireHalo;
          ctx.beginPath();
          ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#431407";
          ctx.strokeStyle = "#f97316";
          ctx.lineWidth = 2.5;
          ctx.shadowColor = "#ea580c";
          ctx.shadowBlur = 20;
          ctx.beginPath();
          const spikes = 9;
          for (let i = 0; i < spikes; i++) {
            const angle = (Math.PI * 2 / spikes) * i;
            const dist = r * (i % 2 === 0 ? 1 : 0.8) + Math.sin(pTime * 6 + i) * 4;
            const sx = Math.cos(angle) * dist;
            const sy = Math.sin(angle) * dist;
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

        } else if (ast.type === "VOID") {
          // HƯ KHÔNG THẠCH: Cosmic Singularity Nebula
          ctx.rotate(ast.rotation * 0.7);
          const voidHalo = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.5);
          voidHalo.addColorStop(0, "#090514");
          voidHalo.addColorStop(0.4, "#581c87");
          voidHalo.addColorStop(0.7, "#9333ea");
          voidHalo.addColorStop(1, "rgba(147, 51, 234, 0)");
          ctx.fillStyle = voidHalo;
          ctx.beginPath();
          ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#1e1035";
          ctx.strokeStyle = "#c084fc";
          ctx.lineWidth = 2.5;
          ctx.shadowColor = "#a855f7";
          ctx.shadowBlur = 22;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = "rgba(216, 180, 254, 0.7)";
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.ellipse(0, 0, r * 1.25, r * 0.45, pTime * 2, 0, Math.PI * 2);
          ctx.stroke();

        } else {
          // HUYẾT LÔI THẠCH: Crimson Thunder Obsidian with Crackling Arcs
          const pulseR = r + Math.sin(pTime * 8) * 3;
          const bloodHalo = ctx.createRadialGradient(0, 0, 4, 0, 0, pulseR * 1.5);
          bloodHalo.addColorStop(0, "#fecdd3");
          bloodHalo.addColorStop(0.35, "#e11d48");
          bloodHalo.addColorStop(0.75, "#881337");
          bloodHalo.addColorStop(1, "rgba(136, 19, 55, 0)");
          ctx.fillStyle = bloodHalo;
          ctx.beginPath();
          ctx.arc(0, 0, pulseR * 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#3f0a14";
          ctx.strokeStyle = "#f43f5e";
          ctx.lineWidth = 2.5;
          ctx.shadowColor = "#e11d48";
          ctx.shadowBlur = 25;
          ctx.beginPath();
          ctx.arc(0, 0, pulseR * 0.85, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = "#fecdd3";
          ctx.lineWidth = 1.8;
          for (let i = 0; i < 4; i++) {
            const a = (Math.PI / 2) * i + pTime * 4;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * (pulseR * 0.6), Math.sin(a) * (pulseR * 0.6));
            ctx.lineTo(Math.cos(a + 0.3) * (pulseR * 1.2), Math.sin(a + 0.3) * (pulseR * 1.2));
            ctx.stroke();
          }
        }

        ctx.restore(); // end asteroid transform

        // B. CELESTIAL TALISMAN WORD BOX (EXACT DESIGN FROM IMAGE 1: [ 冰  V I G O R  魄 ])
        ctx.save();

        let sealLeft = "冰";
        let sealRight = "魄";
        let plaqueBg = "rgba(224, 242, 254, 0.94)";
        let plaqueBorder = "#38bdf8";
        let plaqueText = "#0f172a";
        let typedColor = "#059669";
        let nextBg = "rgba(251, 191, 36, 0.45)";
        let nextBorder = "#f59e0b";

        if (ast.type === "INFERNO") {
          sealLeft = "炎"; sealRight = "魂";
          plaqueBg = "rgba(254, 243, 199, 0.94)";
          plaqueBorder = "#f97316";
          plaqueText = "#431407";
          typedColor = "#ea580c";
        } else if (ast.type === "VOID") {
          sealLeft = "虚"; sealRight = "劫";
          plaqueBg = "rgba(243, 232, 255, 0.94)";
          plaqueBorder = "#a855f7";
          plaqueText = "#3b0764";
          typedColor = "#7e22ce";
        } else if (ast.type === "BLOOD_THUNDER") {
          sealLeft = "雷"; sealRight = "煞";
          plaqueBg = "rgba(255, 228, 230, 0.94)";
          plaqueBorder = "#f43f5e";
          plaqueText = "#4c0519";
          typedColor = "#be123c";
        }

        const charCount = ast.word.length;
        const charSpacing = 24;
        const textWidth = charCount * charSpacing;
        const boxPadding = 34;
        const boxW = Math.max(140, textWidth + boxPadding * 2);
        const boxH = 36;

        // Position plaque centered directly ACROSS the asteroid gemstone (as seen in Image 1)
        const bx = ast.x - boxW / 2;
        const by = ast.y - boxH / 2;

        // Plaque Outer Container
        ctx.fillStyle = plaqueBg;
        ctx.strokeStyle = plaqueBorder;
        ctx.lineWidth = 2.2;
        ctx.shadowColor = plaqueBorder;
        ctx.shadowBlur = 14;

        ctx.beginPath();
        ctx.roundRect(bx, by, boxW, boxH, 6);
        ctx.fill();
        ctx.stroke();

        // Left Seal Tile Box [ 冰 ]
        const sealTileW = 28;
        const sealTileH = boxH - 6;
        ctx.fillStyle = ast.type === "FROST" ? "rgba(186, 230, 253, 0.65)" : "rgba(255, 255, 255, 0.5)";
        ctx.strokeStyle = plaqueBorder;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(bx + 3, by + 3, sealTileW, sealTileH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = plaqueBorder;
        ctx.font = "bold 15px 'Noto Serif', serif";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(sealLeft, bx + 3 + sealTileW / 2, by + boxH / 2);

        // Right Seal Tile Box [ 魄 ]
        ctx.beginPath();
        ctx.roundRect(bx + boxW - 3 - sealTileW, by + 3, sealTileW, sealTileH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillText(sealRight, bx + boxW - 3 - sealTileW / 2, by + boxH / 2);

        // Inner Word Characters (Serif / Crisp Cultivation Typography)
        const textStartX = bx + (boxW - textWidth) / 2 + charSpacing / 2;
        const textY = by + boxH / 2;

        for (let i = 0; i < charCount; i++) {
          const char = ast.word[i];
          const cx = textStartX + i * charSpacing;

          const isCharTyped = i < ast.typed.length;
          const isNextTarget = i === ast.typed.length;

          if (isCharTyped) {
            // Typed: Glowing Emerald/Theme color
            ctx.fillStyle = typedColor;
            ctx.font = "bold 17px 'Cinzel', 'Times New Roman', Georgia, serif";
            ctx.fillText(char, cx, textY);
          } else if (isNextTarget) {
            // Next Target: Highlighted with amber background and bouncing caret
            ctx.fillStyle = nextBg;
            ctx.beginPath();
            ctx.roundRect(cx - 10, by + 4, 20, boxH - 8, 3);
            ctx.fill();

            ctx.strokeStyle = nextBorder;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = "#b45309";
            ctx.font = "bold 18px 'Cinzel', 'Times New Roman', Georgia, serif";
            ctx.fillText(char, cx, textY);

            // Bouncing Caret
            const bounce = Math.sin(time * 8) * 3;
            ctx.fillStyle = "#d97706";
            ctx.beginPath();
            ctx.moveTo(cx - 4, by - 2 + bounce);
            ctx.lineTo(cx + 4, by - 2 + bounce);
            ctx.lineTo(cx, by + 2 + bounce);
            ctx.closePath();
            ctx.fill();
          } else {
            // Untyped: Clean dark text
            ctx.fillStyle = plaqueText;
            ctx.font = "bold 17px 'Cinzel', 'Times New Roman', Georgia, serif";
            ctx.fillText(char, cx, textY);
          }
        }

        ctx.restore();
      });

      // 8. DRAW PROJECTILES (AUTHENTIC FLYING SWORDS & BARRAGES)
      projectiles.forEach(p => {
        ctx.save();
        const angle = Math.atan2(p.targetY - p.y, p.targetX - p.x);

        if (p.type === "bamboo") {
          // Thanh Trúc Kiếm
          const swordImg = spritesRef.current["prop_bamboo_sword"];
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(angle + Math.PI / 2);

          if (swordImg && swordImg.complete && swordImg.naturalWidth > 0) {
            const sw = 22;
            const sh = 48;
            ctx.shadowColor = "#4ade80";
            ctx.shadowBlur = 14;
            ctx.drawImage(swordImg, -sw / 2, -sh / 2, sw, sh);
          } else {
            ctx.strokeStyle = "#4ade80";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, -22);
            ctx.lineTo(0, 22);
            ctx.stroke();
          }
          ctx.restore();

          // Emerald comet trail
          p.trail.forEach((pt, i) => {
            ctx.save();
            ctx.globalAlpha = ((i + 1) / p.trail.length) * 0.55;
            ctx.fillStyle = "#86efac";
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });

        } else if (p.type === "jade") {
          // Bích Ngọc Thần Kiếm
          const swordImg = spritesRef.current["prop_jade_sword"];
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(angle + Math.PI / 2);

          if (swordImg && swordImg.complete && swordImg.naturalWidth > 0) {
            const sw = 24;
            const sh = 52;
            ctx.shadowColor = "#2dd4bf";
            ctx.shadowBlur = 18;
            ctx.drawImage(swordImg, -sw / 2, -sh / 2, sw, sh);
          } else {
            ctx.strokeStyle = "#2dd4bf";
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(0, -24);
            ctx.lineTo(0, 24);
            ctx.stroke();
          }
          ctx.restore();

          // Jade trail
          p.trail.forEach((pt, i) => {
            ctx.save();
            ctx.globalAlpha = ((i + 1) / p.trail.length) * 0.55;
            ctx.fillStyle = "#5eead4";
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });

        } else if (p.type === "solar") {
          // Thái Ất Chân Hỏa Kiếm
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 5;
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 22;

          ctx.beginPath();
          ctx.moveTo(p.startX, p.startY);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
          ctx.fill();

        } else if (p.type === "lightning") {
          // Cửu Thiên Lôi Kiếm
          ctx.strokeStyle = "#c084fc";
          ctx.lineWidth = 3.5;
          ctx.shadowColor = "#9333ea";
          ctx.shadowBlur = 24;

          ctx.beginPath();
          ctx.moveTo(p.startX, p.startY);
          const steps = 6;
          for (let s = 1; s <= steps; s++) {
            const frac = s / steps;
            const sx = p.startX + (p.targetX - p.startX) * frac + (Math.random() * 16 - 8);
            const sy = p.startY + (p.targetY - p.startY) * frac + (Math.random() * 16 - 8);
            ctx.lineTo(sx, sy);
          }
          ctx.stroke();

        } else {
          // Vạn Kiếp Long Ngâm Kiếm (Golden Celestial Dragon)
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 6;
          ctx.shadowColor = "#d97706";
          ctx.shadowBlur = 26;

          ctx.fillStyle = "#fef08a";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          p.trail.forEach((pt, idx) => {
            const wave = Math.sin(idx * 0.8 + time * 6) * 8;
            ctx.lineTo(pt.x + wave, pt.y);
          });
          ctx.stroke();
        }

        ctx.restore();
      });

      // 9. DRAW PARTICLES & IMPACT EFFECTS
      particles.forEach(pt => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);

        if (pt.shape === "tea_explosion") {
          // Vụ nổ trà xanh Matcha Shockwave
          const expImg = spritesRef.current["prop_tea_explosion"];
          if (expImg && expImg.complete && expImg.naturalWidth > 0) {
            const sz = pt.size * (1.8 - pt.alpha * 0.8);
            ctx.shadowColor = "#4ade80";
            ctx.shadowBlur = 22;
            ctx.drawImage(expImg, pt.x - sz / 2, pt.y - sz / 2, sz, sz);
          }
        } else if (pt.shape === "slash") {
          // Kiếm Khí Trảm Kích Slash
          const slashImg = spritesRef.current["prop_sword_slash"];
          if (slashImg && slashImg.complete && slashImg.naturalWidth > 0) {
            const sz = pt.size * 1.3;
            ctx.shadowColor = "#fde047";
            ctx.shadowBlur = 18;
            ctx.drawImage(slashImg, pt.x - sz / 2, pt.y - sz / 2, sz, sz);
          }
        } else {
          ctx.fillStyle = pt.color;
          ctx.shadowColor = pt.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // 10. DRAW FLOATING COMBAT TEXT & TRIUMPHANT IPA FLASHCARDS
      floatingTexts.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);

        if (ft.type === "ipa_card") {
          // TRIUMPHANT XIANXIA IPA FLASHCARD (Only shown upon slaying word!)
          const cardW = 230;
          const cardH = 54;
          ctx.fillStyle = "rgba(10, 31, 19, 0.96)";
          ctx.strokeStyle = "#ca8a04";
          ctx.lineWidth = 2;
          ctx.shadowColor = "#fbbf24";
          ctx.shadowBlur = 16;

          ctx.beginPath();
          ctx.roundRect(ft.x - cardW / 2, ft.y - cardH / 2, cardW, cardH, 8);
          ctx.fill();
          ctx.stroke();

          // Header Seal dot
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          ctx.arc(ft.x - cardW / 2 + 10, ft.y, 3, 0, Math.PI * 2);
          ctx.arc(ft.x + cardW / 2 - 10, ft.y, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#ffdf79";
          ctx.font = "bold 14px serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(ft.text, ft.x, ft.y - 9);

          if (ft.subtext) {
            ctx.fillStyle = "#6ee7b7";
            ctx.font = "italic 11.5px sans-serif";
            ctx.fillText(ft.subtext, ft.x, ft.y + 11);
          }
        } else {
          // Combo & Score
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
  }, [asteroids, projectiles, particles, floatingTexts, currentRealmIdx, catState, activeTargetId, activeTalents, screenShake, imagesLoaded]);

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
