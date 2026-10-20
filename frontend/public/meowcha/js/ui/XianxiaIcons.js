/**
 * XianxiaIcons.js - Thư Viện SVG Cổ Phong & Dấu Ấn Mèo Tiên (Xianxia Chibi Cat Cultivator SVGs)
 * Thay thế hoàn toàn các emoji đơn giản bằng vector SVG sắc nét:
 * Móng Mèo Tiên, Phi Kiếm, Ngọc Giản, Đài Sen, Lôi Ấn, Lư Hương Giải Trừ, Triện Chu Sa.
 */
(function(root) {
  const XianxiaIcons = {
    // 1. Dấu Chân Móng Mèo Tiên Mạ Vàng (Cute Chibi Cat Paw Cultivator Seal)
    catPaw: function(size = 18, color = "#FDE047", glow = true) {
      const filterId = "pawGlow" + Math.floor(Math.random() * 10000);
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" class="xianxia-svg-icon" style="vertical-align: middle;">
        ${glow ? `<defs><filter id="${filterId}"><feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="${color}" flood-opacity="0.6"/></filter></defs>` : ''}
        <g ${glow ? `filter="url(#${filterId})"` : ''}>
          <!-- Đệm chính bàn chân mèo (Trái tim đảo / Đệm thịt) -->
          <path d="M12 11.5 C9.2 11.5 7.5 13.8 7.5 16.5 C7.5 19.2 9.4 21 12 21 C14.6 21 16.5 19.2 16.5 16.5 C16.5 13.8 14.8 11.5 12 11.5 Z" fill="${color}" fill-opacity="0.85" stroke="${color}" stroke-width="1.2"/>
          <!-- 4 Đệm móng ngón mèo tiên -->
          <circle cx="6.5" cy="10" r="2.2" fill="${color}"/>
          <circle cx="10" cy="6.8" r="2.4" fill="${color}"/>
          <circle cx="14" cy="6.8" r="2.4" fill="${color}"/>
          <circle cx="17.5" cy="10" r="2.2" fill="${color}"/>
        </g>
      </svg>`;
    },

    // 2. Phi Kiếm Tiên Đạo Sắc Bén (Xianxia Flying Sword)
    sword: function(size = 18, color = "#67E8F9") {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="xianxia-svg-icon" style="vertical-align: middle;">
        <!-- Lưỡi kiếm -->
        <path d="M19 5 L9 15 L7 14 L5 16 L8 19 L10 17 L9 15 Z" fill="${color}" fill-opacity="0.25"/>
        <line x1="19" y1="5" x2="10" y2="14"/>
        <path d="M19 5 L21 3 L19 5 Z"/>
        <!-- Chuôi kiếm & Đốc kiếm khảm ngọc -->
        <line x1="6" y1="18" x2="3" y2="21"/>
        <circle cx="3" cy="21" r="1.2" fill="${color}"/>
        <line x1="5.5" y1="14.5" x2="9.5" y2="18.5"/>
      </svg>`;
    },

    // 3. Cuộn Trục Ngọc Giản Cổ Phong (Xianxia Bamboo Scroll / Jade Slip)
    scroll: function(size = 18, color = "#FDE047") {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="xianxia-svg-icon" style="vertical-align: middle;">
        <path d="M19 17V5a2 2 0 0 0-2-2H4"/>
        <path d="M8 21h12a2 2 0 0 0 2-2v-1.5a2.5 2.5 0 0 0-2.5-2.5H4"/>
        <path d="M4 19a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z" fill="${color}" fill-opacity="0.15"/>
        <line x1="7" y1="7" x2="15" y2="7"/>
        <line x1="7" y1="11" x2="13" y2="11"/>
      </svg>`;
    },

    // 4. Đài Sen Tiên Đạo Nở Rộ (Sacred Lotus Bloom)
    lotus: function(size = 18, color = "#F59E0B") {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="xianxia-svg-icon" style="vertical-align: middle;">
        <!-- Cánh sen trung tâm -->
        <path d="M12 4 C10 8 10 14 12 18 C14 14 14 8 12 4 Z" fill="${color}" fill-opacity="0.4"/>
        <!-- Cánh sen trái & phải -->
        <path d="M12 18 C8 17 5 13 6 8 C9 10 11 14 12 18 Z" fill="${color}" fill-opacity="0.25"/>
        <path d="M12 18 C16 17 19 13 18 8 C15 10 13 14 12 18 Z" fill="${color}" fill-opacity="0.25"/>
        <circle cx="12" cy="18.5" r="1.5" fill="${color}"/>
      </svg>`;
    },

    // 5. Thiên Lôi Tử Điện Ấn (Heavenly Lightning Arc)
    thunder: function(size = 18, color = "#C084FC") {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="xianxia-svg-icon" style="vertical-align: middle;">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="${color}" fill-opacity="0.35"/>
      </svg>`;
    },

    // 6. Lư Đồng Phong Ấn Hóa Vàng (Alchemy Cauldron / Urn - Thay emoji thùng rác xóa slot)
    trashUrn: function(size = 16, color = "#F87171") {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="xianxia-svg-icon" style="vertical-align: middle;">
        <!-- Nắp đỉnh đồng -->
        <path d="M3 6h18"/>
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        <!-- Thân đỉnh đồng có chân vạc -->
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" fill="${color}" fill-opacity="0.12"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
      </svg>`;
    },

    // 7. Dấu Triện Chu Sa Cổ Phong (Cinnabar Imperial Stamp Seal [ 印 ])
    cinnabarSeal: function(size = 18, color = "#EF4444") {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" class="xianxia-svg-icon" style="vertical-align: middle;">
        <rect x="3" y="3" width="18" height="18" rx="3" stroke="${color}" stroke-width="2" fill="${color}" fill-opacity="0.18"/>
        <!-- Chữ Triện phù văn [ 印 ] cách điệu cổ phong -->
        <path d="M8 7v10M8 12h8M16 7v6a2 2 0 0 1-2 2h-2" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>
      </svg>`;
    },

    // 8. Ấn Triệt Tiêu Viền Vân Mây (Cloud Cross Close Button - Thay dấu X thô)
    closeCross: function(size = 16, color = "#FDE047") {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="xianxia-svg-icon" style="vertical-align: middle;">
        <circle cx="12" cy="12" r="9" stroke="${color}" stroke-width="1.4" stroke-dasharray="3 2" fill="rgba(10,5,2,0.4)"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>`;
    },

    // 9. Chuông Khánh Tiên Âm / Pháp Bảo Phát Thanh (Celestial Sound Horn)
    soundBell: function(size = 18, color = "#38BDF8") {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="xianxia-svg-icon" style="vertical-align: middle;">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="${color}" fill-opacity="0.25"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
      </svg>`;
    },

    // 10. Mũi Tên Phong Ấn Cổ Kính (Xianxia Pagination Arrow)
    arrowLeft: function(size = 16, color = "#FDE047") {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="xianxia-svg-icon" style="vertical-align: middle;">
        <polyline points="15 18 9 12 15 6"/>
      </svg>`;
    },
    arrowRight: function(size = 16, color = "#FDE047") {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="xianxia-svg-icon" style="vertical-align: middle;">
        <polyline points="9 18 15 12 9 6"/>
      </svg>`;
    },

    // 11. Sách Thánh Điển Tàng Thư (Ancient Sacred Tome)
    tome: function(size = 18, color = "#34D399") {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="xianxia-svg-icon" style="vertical-align: middle;">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="${color}" fill-opacity="0.2"/>
        <line x1="8" y1="7" x2="16" y2="7"/>
        <line x1="8" y1="11" x2="14" y2="11"/>
      </svg>`;
    },

    // 12. Phù Văn Bát Giác Kim Tinh (Eight-pointed Celestial Gold Star)
    star: function(size = 14, color = "#FDE047") {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="1" class="xianxia-svg-icon" style="vertical-align: middle;">
        <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/>
      </svg>`;
    },

    // 13. Phù Tự Kim Cương Ấn (Ancient Rhombus Seal)
    sealDiamond: function(size = 14, color = "#F59E0B") {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" class="xianxia-svg-icon" style="vertical-align: middle;">
        <rect x="12" y="3" width="12.7" height="12.7" transform="rotate(45 12 3)" fill="${color}" fill-opacity="0.25"/>
        <circle cx="12" cy="12" r="2" fill="${color}"/>
      </svg>`;
    },

    // 14. Chu Sa Khắc Bảng Ấn (Ancient Cinnabar Checkmark)
    check: function(size = 14, color = "#34D399") {
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="xianxia-svg-icon" style="vertical-align: middle;">
        <polyline points="20 6 9 17 4 12"/>
      </svg>`;
    }
  };

  root.Meowcha = root.Meowcha || {};
  root.Meowcha.XianxiaIcons = XianxiaIcons;
})(typeof window !== 'undefined' ? window : globalThis);
