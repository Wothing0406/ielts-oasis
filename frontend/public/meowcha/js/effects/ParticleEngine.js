/**
 * ParticleEngine.js - Động Cơ Hạt Tối Ưu Cho Hiệu Ứng Tiên Hiệp
 * Hỗ trợ khói trà, tàn kiếm khí, lá trúc, cánh sen, vụn tinh thạch và tia sét
 */
(function(root) {
  class ParticleEngine {
    constructor() {
      this.particles = [];
      this.maxParticles = 350;
    }

    clear() {
      this.particles = [];
    }

    // Mảnh vỡ pixel rơi rụng khi phá nát ma thạch (Retro Pixel Art Debris)
    createPixelShards(x, y, colors = ["#F97316", "#FEF08A", "#2D1E16", "#EF4444"], count = 38) {
      const colorList = Array.isArray(colors) ? colors : [colors];
      for (let i = 0; i < count; i++) {
        if (this.particles.length >= this.maxParticles) break;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7.5 + 2.5;
        const col = colorList[Math.floor(Math.random() * colorList.length)];
        this.particles.push({
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2.5, // Nẩy tung lên trước khi rơi
          rot: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.35,
          color: col,
          size: Math.floor(Math.random() * 4) + 4, // 4, 5, 6, 7px vuông vức chuẩn pixel
          alpha: 1.0,
          decay: 0.018 + Math.random() * 0.015,
          gravity: 0.18, // Rơi theo trọng lực chân thực
          shape: "pixel"
        });
      }
    }

    // Tạo vụ nổ hạt khi phá vỡ ma thạch
    createExplosion(x, y, color = "#38BDF8", count = 24) {
      for (let i = 0; i < count; i++) {
        if (this.particles.length >= this.maxParticles) break;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6.5 + 2.0;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: color,
          size: Math.random() * 4.5 + 2.0,
          alpha: 1.0,
          decay: 0.02 + Math.random() * 0.025,
          gravity: 0.08,
          shape: Math.random() > 0.4 ? "circle" : "spark"
        });
      }
    }

    // VỤ NỔ CỔ NGỮ TIÊN ĐẠO • HOA SEN & SÓNG BÁT QUÁI (XIANXIA CELESTIAL WORD BURST)
    createXianxiaWordBurst(x, y, realmIdx = 0) {
      const paletteByRealm = [
        ["#10B981", "#34D399", "#FDE047", "#6EE7B7"], // Realm 0: Trúc Phong Ngọc Bích
        ["#06B6D4", "#38BDF8", "#E0F2FE", "#FDE047"], // Realm 1: Hàn Băng Song Kiếm
        ["#F59E0B", "#FDE047", "#EF4444", "#FEF08A"], // Realm 2: Kim Đan Bát Quái
        ["#8B5CF6", "#C084FC", "#38BDF8", "#FDE047"], // Realm 3: Cửu Thiên Tử Lôi
        ["#FDE047", "#DC2626", "#F59E0B", "#FFFFFF"], // Realm 4: Vạn Kiếm Chân Long
      ];
      const colors = paletteByRealm[Math.min(4, Math.max(0, realmIdx))] || paletteByRealm[0];
      const mainCol = colors[0];
      const goldCol = "#FDE047";

      // 1. Sóng xung kích vòng Bát Quái nở rộ (Expanding Shockwave Rings)
      for (let r = 0; r < 2; r++) {
        if (this.particles.length >= this.maxParticles) break;
        this.particles.push({
          x: x,
          y: y,
          vx: 0,
          vy: 0,
          size: 10 + r * 14,
          vSize: 3.8 + r * 1.6,
          color: r === 0 ? goldCol : mainCol,
          lineWidth: 2.2 - r * 0.6,
          alpha: 1.0,
          decay: 0.038,
          shape: "ring"
        });
      }

      // 2. Cánh sen & tàn kiếm khí tiên đạo bung tỏa 8 phương (Lotus Petals)
      const petalCount = 12;
      for (let i = 0; i < petalCount; i++) {
        if (this.particles.length >= this.maxParticles) break;
        const angle = (i / petalCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
        const speed = Math.random() * 4.5 + 3.0;
        const col = colors[Math.floor(Math.random() * colors.length)];
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rot: angle,
          vRot: (Math.random() - 0.5) * 0.15,
          color: col,
          size: Math.random() * 5.0 + 4.5,
          alpha: 1.0,
          decay: 0.024,
          gravity: 0.04,
          shape: "petal"
        });
      }

      // 3. Phù tự cổ phong bay bổng hóa giải ma khí (Ancient Daoist Hanzi Runes)
      const runes = ["悟", "斬", "道", "仙", "破"];
      const runeCount = 5;
      for (let i = 0; i < runeCount; i++) {
        if (this.particles.length >= this.maxParticles) break;
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 18;
        this.particles.push({
          x: x + Math.cos(angle) * dist,
          y: y + Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 1.4,
          vy: -(Math.random() * 2.2 + 1.2), // Bay bổng lên trời
          color: goldCol,
          glow: mainCol,
          text: runes[i % runes.length],
          size: 13,
          alpha: 1.0,
          decay: 0.022,
          gravity: -0.02,
          shape: "rune"
        });
      }

      // 4. Tia kiếm khí bạo liệt (Sword Sparks)
      for (let i = 0; i < 16; i++) {
        if (this.particles.length >= this.maxParticles) break;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7.0 + 3.0;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: Math.random() > 0.4 ? goldCol : mainCol,
          size: Math.random() * 3.5 + 2.0,
          alpha: 1.0,
          decay: 0.035,
          gravity: 0.06,
          shape: "spark"
        });
      }
    }

    // Tia kiếm khí va chạm khi gõ đúng chữ
    createHitSparks(x, y, color = "#FDE047", count = 8) {
      for (let i = 0; i < count; i++) {
        if (this.particles.length >= this.maxParticles) break;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4.0 + 1.5;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: color,
          size: Math.random() * 3.0 + 1.5,
          alpha: 1.0,
          decay: 0.04 + Math.random() * 0.03,
          gravity: 0.04,
          shape: "spark"
        });
      }
    }

    // Lá trúc rơi (Cảnh giới 0 & 1)
    createBambooLeaves(x, y, count = 5) {
      for (let i = 0; i < count; i++) {
        if (this.particles.length >= this.maxParticles) break;
        this.particles.push({
          x: x + (Math.random() - 0.5) * 40,
          y: y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 2.5,
          vy: Math.random() * 2.0 + 1.0,
          rot: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.1,
          color: "#10B981",
          size: Math.random() * 6 + 4,
          alpha: 0.9,
          decay: 0.015,
          gravity: 0.03,
          shape: "leaf"
        });
      }
    }

    // Mảnh vỡ linh thuẫn khi khiên bị đánh trúng
    createShieldShards(x, y, color = "#EAB308", count = 16) {
      for (let i = 0; i < count; i++) {
        if (this.particles.length >= this.maxParticles) break;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5.0 + 2.0;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rot: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.2,
          color: color,
          size: Math.random() * 8 + 4,
          alpha: 1.0,
          decay: 0.03,
          gravity: 0.1,
          shape: "shard"
        });
      }
    }

    update() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity || 0;
        p.alpha -= p.decay;
        if (p.vRot) p.rot += p.vRot;
        if (p.shape === "ring" && p.vSize) p.size += p.vSize;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
        }
      }
    }

    draw(ctx) {
      if (this.particles.length === 0) return;
      ctx.save();
      for (const p of this.particles) {
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;

        if (p.shape === "ring") {
          ctx.save();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.lineWidth || 2.0;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (p.shape === "rune") {
          ctx.save();
          ctx.font = `900 ${p.size || 13}px 'Cinzel', serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.glow || "#F59E0B";
          ctx.shadowBlur = 8;
          ctx.fillText(p.text, p.x, p.y);
          ctx.restore();
        } else if (p.shape === "petal") {
          ctx.save();
          ctx.translate(p.x, p.y);
          if (p.rot) ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.shape === "spark") {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
          ctx.stroke();
        } else if (p.shape === "leaf") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot || 0);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.shape === "shard") {
          ctx.save();
          ctx.translate(p.x, p.y);
          if (p.rot) ctx.rotate(p.rot);
          ctx.beginPath();
          ctx.moveTo(-p.size / 2, -p.size / 2);
          ctx.lineTo(p.size / 2, 0);
          ctx.lineTo(-p.size / 4, p.size / 2);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else if (p.shape === "pixel") {
          ctx.save();
          ctx.translate(p.x, p.y);
          if (p.rot) ctx.rotate(p.rot);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        } else if (p.shape === "mote") {
          ctx.save();
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // Bụi linh khí (Qi Motes) vàng lấp lánh bay lơ lửng ngẫu nhiên (Lobby & In-game Atmosphere)
    spawnQiMote(canvasWidth, canvasHeight) {
      if (this.particles.length >= this.maxParticles) return;
      this.particles.push({
        x: Math.random() * canvasWidth,
        y: canvasHeight + 10,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(Math.random() * 0.7 + 0.3),
        color: Math.random() > 0.35 ? "#FDE047" : "#34D399",
        size: Math.random() * 2.4 + 1.2,
        alpha: Math.random() * 0.7 + 0.3,
        decay: 0.003 + Math.random() * 0.003,
        gravity: -0.004, // Bay bổng lên trời
        shape: "mote"
      });
    }
  }

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.ParticleEngine = ParticleEngine;
})(typeof window !== 'undefined' ? window : globalThis);
