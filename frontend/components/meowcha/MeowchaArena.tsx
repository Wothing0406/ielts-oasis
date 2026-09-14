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
      // 1. UNIFIED VIRTUAL COORDINATE TRANSFORMATION (800 x 700)
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

      const scaleX = (cssW * dpr) / V_WIDTH;
      const scaleY = (cssH * dpr) / V_HEIGHT;
      ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);

      // Clear virtual frame
      ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

      const time = performance.now() * 0.002;

      // 2. BACKGROUND & SANCTUARY ATMOSPHERE
      const bgImg = spritesRef.current["bg"];
      if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
        ctx.drawImage(bgImg, 0, 0, V_WIDTH, V_HEIGHT);
        // Vignette
        ctx.fillStyle = "rgba(8, 14, 10, 0.22)";
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
      } else {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, V_HEIGHT);
        bgGrad.addColorStop(0, "#060b08");
        bgGrad.addColorStop(0.6, "#132317");
        bgGrad.addColorStop(1, "#1c2e1b");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
      }

      // 3. CELESTIAL ALTAR & LOTUS PLATFORM
      // Anchored permanently at (400, 635)
      const altarX = 400;
      const altarY = 635;

      // Misty Cloud Aura under Altar
      ctx.save();
      const cloudGrad = ctx.createRadialGradient(altarX, altarY + 22, 15, altarX, altarY + 22, 140);
      cloudGrad.addColorStop(0, "rgba(220, 245, 225, 0.28)");
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

      // 4. TALENT VISUAL TRANSMUTATION ("HÓA MẠNH NHẤT")
      const isDefeated = catState === "defeated";
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
        // VẠN KIẾM QUY TÔNG: Chưởng ấn xuất thần
        spriteImg = spritesRef.current["cat_blast"] || spritesRef.current["cat_weak"];
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
        else if (currentRealmIdx === 1) spriteImg = spritesRef.current["cat_weak"];
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

      // 7. DRAW ASTEROIDS WITH AUTHENTIC SPRITE & ELEMENTAL AURAS
      const asteroidSprite = spritesRef.current["prop_asteroid"];

      asteroids.forEach(ast => {
        ctx.save();
        ctx.translate(ast.x, ast.y);

        const r = ast.radius;
        const pTime = performance.now() * 0.003;
        const isTarget = ast.id === activeTargetId;

        // Active Target Reticle
        if (isTarget) {
          ctx.save();
          ctx.strokeStyle = "#ffdf79";
          ctx.lineWidth = 2.2;
          ctx.setLineDash([7, 4]);
          ctx.lineDashOffset = -pTime * 25;
          ctx.beginPath();
          ctx.arc(0, 0, r + 18, 0, Math.PI * 2);
          ctx.stroke();

          // Reticle pointer notches
          for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i + pTime;
            const nx = Math.cos(angle) * (r + 15);
            const ny = Math.sin(angle) * (r + 15);
            ctx.fillStyle = "#ffdf79";
            ctx.beginPath();
            ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // A. ELEMENTAL AURA (Behind Asteroid)
        ctx.save();
        const auraSize = r * 2.1;
        if (ast.type === "FROST") {
          // Băng Phách: Cyan ice aura with crystal glint
          const iceGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, auraSize * 0.7);
          iceGrad.addColorStop(0, "rgba(255, 255, 255, 0.75)");
          iceGrad.addColorStop(0.4, "rgba(125, 211, 252, 0.55)");
          iceGrad.addColorStop(0.8, "rgba(2, 132, 199, 0.35)");
          iceGrad.addColorStop(1, "rgba(2, 132, 199, 0)");
          ctx.fillStyle = iceGrad;
          ctx.beginPath();
          ctx.arc(0, 0, auraSize * 0.7, 0, Math.PI * 2);
          ctx.fill();
        } else if (ast.type === "INFERNO") {
          // Hỏa Diễm: Blazing magma flame halo
          const fireGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, auraSize * 0.75);
          fireGrad.addColorStop(0, "rgba(254, 240, 138, 0.85)");
          fireGrad.addColorStop(0.4, "rgba(249, 115, 22, 0.65)");
          fireGrad.addColorStop(0.8, "rgba(220, 38, 38, 0.35)");
          fireGrad.addColorStop(1, "rgba(220, 38, 38, 0)");
          ctx.fillStyle = fireGrad;
          ctx.beginPath();
          ctx.arc(0, 0, auraSize * 0.75, 0, Math.PI * 2);
          ctx.fill();
        } else if (ast.type === "VOID") {
          // Hư Không: Dark cosmic vortex
          const voidGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, auraSize * 0.75);
          voidGrad.addColorStop(0, "rgba(216, 180, 254, 0.85)");
          voidGrad.addColorStop(0.4, "rgba(147, 51, 234, 0.6)");
          voidGrad.addColorStop(0.8, "rgba(59, 7, 100, 0.35)");
          voidGrad.addColorStop(1, "rgba(59, 7, 100, 0)");
          ctx.fillStyle = voidGrad;
          ctx.beginPath();
          ctx.arc(0, 0, auraSize * 0.75, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Huyết Lôi: Crimson electric pulse
          const bloodGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, auraSize * 0.75);
          bloodGrad.addColorStop(0, "rgba(254, 205, 211, 0.85)");
          bloodGrad.addColorStop(0.4, "rgba(225, 29, 72, 0.65)");
          bloodGrad.addColorStop(0.8, "rgba(136, 19, 55, 0.35)");
          bloodGrad.addColorStop(1, "rgba(136, 19, 55, 0)");
          ctx.fillStyle = bloodGrad;
          ctx.beginPath();
          ctx.arc(0, 0, auraSize * 0.75, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // B. AUTHENTIC ASTEROID SPRITE
        ctx.save();
        ctx.rotate(ast.rotation);
        const spriteDrawSize = r * 2.25;

        if (asteroidSprite && asteroidSprite.complete && asteroidSprite.naturalWidth > 0) {
          ctx.drawImage(
            asteroidSprite,
            -spriteDrawSize / 2,
            -spriteDrawSize / 2,
            spriteDrawSize,
            spriteDrawSize
          );
        } else {
          // Fallback shaded rock
          ctx.fillStyle = "#38bdf8";
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        ctx.restore(); // end asteroid transform

        // 8. "KHUNG Ô CHỮ PHÙ LỤC" - DAOIST TALISMAN WORD PLAQUE WITH INDIVIDUAL LETTER CELLS
        ctx.save();

        const cellW = 26;
        const cellH = 30;
        const cellGap = 3;
        const wordLen = ast.word.length;
        const totalCellsWidth = wordLen * cellW + (wordLen - 1) * cellGap;
        const plaqueW = Math.max(130, totalCellsWidth + 24);
        const plaqueH = cellH + 34; // cell row + divider + subtext (IPA & Meaning)

        const px = ast.x - plaqueW / 2;
        const py = ast.y + ast.radius + 8;

        // Plaque Backdrop: Lacquered Xianxia plaque with gold border
        ctx.fillStyle = "rgba(13, 19, 14, 0.94)";
        ctx.strokeStyle = isTarget ? "#fbbf24" : "rgba(196, 165, 87, 0.65)";
        ctx.lineWidth = isTarget ? 2 : 1.2;
        ctx.shadowColor = isTarget ? "#fbbf24" : "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = isTarget ? 14 : 6;

        ctx.beginPath();
        ctx.roundRect(px, py, plaqueW, plaqueH, 6);
        ctx.fill();
        ctx.stroke();

        // Corner studs
        const studColor = isTarget ? "#fbbf24" : "rgba(196, 165, 87, 0.8)";
        ctx.fillStyle = studColor;
        ctx.beginPath();
        ctx.arc(px + 4, py + 4, 1.8, 0, Math.PI * 2);
        ctx.arc(px + plaqueW - 4, py + 4, 1.8, 0, Math.PI * 2);
        ctx.arc(px + 4, py + plaqueH - 4, 1.8, 0, Math.PI * 2);
        ctx.arc(px + plaqueW - 4, py + plaqueH - 4, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Target Tag badge
        if (isTarget) {
          ctx.fillStyle = "#fbbf24";
          ctx.font = "bold 9px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("✦ TRẢM ✦", px + plaqueW / 2, py - 4);
        }

        // Draw Individual Letter Cells
        const cellsStartX = px + (plaqueW - totalCellsWidth) / 2;
        const cellsY = py + 6;

        for (let i = 0; i < wordLen; i++) {
          const char = ast.word[i];
          const cx = cellsStartX + i * (cellW + cellGap);
          const cy = cellsY;

          const isCharTyped = i < ast.typed.length;
          const isNextTarget = i === ast.typed.length;

          if (isCharTyped) {
            // State: Typed (Emerald Green)
            ctx.fillStyle = "rgba(34, 197, 94, 0.35)";
            ctx.strokeStyle = "#4ade80";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(cx, cy, cellW, cellH, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#4ade80";
            ctx.font = "bold 15px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(char, cx + cellW / 2, cy + cellH / 2);

            // Subtle check dot
            ctx.fillStyle = "#86efac";
            ctx.beginPath();
            ctx.arc(cx + cellW - 4, cy + 4, 1.5, 0, Math.PI * 2);
            ctx.fill();

          } else if (isNextTarget) {
            // State: Next Target Letter (Pulsing Gold with Bouncing Caret)
            ctx.save();
            ctx.fillStyle = "rgba(245, 158, 11, 0.45)";
            ctx.strokeStyle = "#fbbf24";
            ctx.lineWidth = 2;
            ctx.shadowColor = "#fbbf24";
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.roundRect(cx, cy, cellW, cellH, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#fffbeb";
            ctx.font = "bold 17px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(char, cx + cellW / 2, cy + cellH / 2);

            // Bouncing Caret
            const caretBounce = Math.sin(time * 8) * 3;
            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            const caretX = cx + cellW / 2;
            const caretY = cy - 3 + caretBounce;
            ctx.moveTo(caretX - 4, caretY - 4);
            ctx.lineTo(caretX + 4, caretY - 4);
            ctx.lineTo(caretX, caretY);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

          } else {
            // State: Untyped (Translucent Dark)
            ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
            ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(cx, cy, cellW, cellH, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#cbd5e1";
            ctx.font = "bold 14px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(char, cx + cellW / 2, cy + cellH / 2);
          }
        }

        // Subtext Divider
        ctx.strokeStyle = "rgba(196, 165, 87, 0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + 8, py + cellH + 9);
        ctx.lineTo(px + plaqueW - 8, py + cellH + 9);
        ctx.stroke();

        // Subtext (IPA & Vietnamese Meaning)
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        const subY = py + cellH + 20;
        const subDisplay = `${ast.ipa || ""} • ${ast.meaning || ""}`;

        ctx.fillStyle = "#fef08a";
        ctx.font = "11px sans-serif";
        ctx.fillText(subDisplay, px + plaqueW / 2, subY);

        ctx.restore();
      });

      // 9. DRAW PROJECTILES (AUTHENTIC FLYING SWORDS & BARRAGES)
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

          // Dragon Head
          ctx.fillStyle = "#fef08a";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Sinuous dragon trail
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

      // 10. DRAW PARTICLES & SPECIAL IMPACT SPRITES
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
          // Standard sparks / elemental motes
          ctx.fillStyle = pt.color;
          ctx.shadowColor = pt.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // 11. DRAW FLOATING COMBAT TEXT
      floatingTexts.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);

        if (ft.type === "ipa_card") {
          // Xianxia IPA Card
          const cardW = 210;
          const cardH = 52;
          ctx.fillStyle = "rgba(20, 14, 8, 0.95)";
          ctx.strokeStyle = "#ffdf79";
          ctx.lineWidth = 1.8;
          ctx.shadowColor = "#ffdf79";
          ctx.shadowBlur = 14;

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
  }, [asteroids, projectiles, particles, floatingTexts, currentRealmIdx, catState, activeTargetId, activeTalents, imagesLoaded]);

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
