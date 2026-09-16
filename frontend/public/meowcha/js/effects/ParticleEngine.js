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

        if (p.shape === "spark") {
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
