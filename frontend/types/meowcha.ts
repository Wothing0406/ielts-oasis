// types/meowcha.ts - IELTS Oasis Cultivation Typing Game Types

export type AsteroidType = "FROST" | "INFERNO" | "VOID" | "BLOOD_THUNDER";

export type ProjectileType = "bamboo" | "jade" | "solar" | "lightning" | "dragon";

export interface Realm {
  index: number;
  name: string;
  title: string;
  skillName: string;
  sprite: string;
  auraColor: string;
  blastColor: string;
  projectileType: ProjectileType;
  reqScore: number;
  minBand: number;
  description: string;
}

export const REALMS: Realm[] = [
  {
    index: 0,
    name: "Luyện Khí Kỳ",
    title: "Tiểu Miêu Nhập Đạo",
    skillName: "Thanh Trúc Kiếm Khí",
    sprite: "/meowcha/sprites/cat_idle.png",
    auraColor: "#98b06f",
    blastColor: "#4ade80",
    projectileType: "bamboo",
    reqScore: 0,
    minBand: 0,
    description: "Ngộ đạo sơ khai, ngự kiếm trúc xanh thanh thoát trảm ma thạch Băng Phách."
  },
  {
    index: 1,
    name: "Trúc Cơ Kỳ",
    title: "Bích Ngọc Kiếm Sĩ",
    skillName: "Bích Hải Lưu Quang",
    sprite: "/meowcha/sprites/cat_weak_attack.png",
    auraColor: "#34d399",
    blastColor: "#059669",
    projectileType: "jade",
    reqScore: 500,
    minBand: 1,
    description: "Đạo cơ vững chắc, ngự song kiếm ngọc bích xé tan ma diễm Cửu U."
  },
  {
    index: 2,
    name: "Kim Đan Kỳ",
    title: "Kim Đan Chân Nhân",
    skillName: "Thái Ất Chân Hỏa Kiếm",
    sprite: "/meowcha/sprites/cat_golden_core.png",
    auraColor: "#ffdf79",
    blastColor: "#f59e0b",
    projectileType: "solar",
    reqScore: 1500,
    minBand: 2,
    description: "Ngưng kết Kim Đan bất hoại, kiếm mang Thái Dương rực lửa thiêu rụi Hư Không dị thạch."
  },
  {
    index: 3,
    name: "Nguyên Anh Kỳ",
    title: "Cửu Thiên Kiếm Tông",
    skillName: "Cửu Thiên Lôi Đình Kiếm",
    sprite: "/meowcha/sprites/cat_nascent_soul.png",
    auraColor: "#c084fc",
    blastColor: "#9333ea",
    projectileType: "lightning",
    reqScore: 3000,
    minBand: 3,
    description: "Xuất khiếu thông linh, triệu hoán vạn đạo lôi kiếp xé toạc Huyết Lôi ma quái."
  },
  {
    index: 4,
    name: "Độ Kiếp Hóa Thần",
    title: "Thái Thượng Kiếm Tôn",
    skillName: "Vạn Kiếp Long Ngâm Quy Tông",
    sprite: "/meowcha/sprites/cat_celestial_sovereign.png",
    auraColor: "#fbbf24",
    blastColor: "#fbbf24",
    projectileType: "dragon",
    reqScore: 5500,
    minBand: 3,
    description: "Phá toái hư không, triệu hoán Cửu Trảo Kim Long chấn nhiếp chư thiên vạn giới!"
  }
];

export interface VocabItem {
  id: number;
  word: string;
  ipa: string;
  type: string;
  meaning: string;
  band_level: number;
  asteroid_type: AsteroidType;
  difficulty_score: number;
}

export interface Asteroid {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  word: string;
  typed: string;
  ipa: string;
  meaning: string;
  type: AsteroidType;
  hp: number;
  maxHp: number;
  radius: number;
  speed: number;
  points: number;
  rotation: number;
  pulse: number;
  wordId: number;
}

export interface Projectile {
  id: string;
  type: ProjectileType;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  targetAsteroidId: string;
  speed: number;
  progress: number;
  color: string;
  trail: { x: number; y: number; alpha: number }[];
  damage: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  shape: "circle" | "spark" | "shard" | "flame" | "lightning" | "slash" | "tea_explosion";
}

export interface FloatingText {
  id: string;
  text: string;
  subtext?: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  alpha: number;
  vy: number;
  lifetime: number;
  type: "score" | "combo" | "ipa_card" | "breakthrough" | "heal";
}

export interface Talent {
  id: string;
  baseId: string;
  name: string;
  desc: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  type: "attack" | "speed" | "defense" | "score" | "leech" | "crit";
  level: number; // 1 | 2 | 3
  maxLevel: number;
  multiplier: number;
}

export const TALENTS_DEFINITIONS: Record<string, {
  icon: string;
  type: Talent["type"];
  tiers: {
    name: string;
    desc: string;
    rarity: Talent["rarity"];
    multiplier: number;
  }[];
}> = {
  swift_blade: {
    icon: "wind",
    type: "speed",
    tiers: [
      { name: "Tật Phong Kiếm Ý (Cấp 1)", desc: "Tăng 25% tốc độ kiếm khí và giảm 15% tốc độ ma thạch", rarity: "common", multiplier: 0.25 },
      { name: "Tật Phong Kiếm Ý (Cấp 2)", desc: "Tăng 55% tốc độ kiếm khí và giảm 25% tốc độ ma thạch", rarity: "rare", multiplier: 0.55 },
      { name: "VÔ SONG TẬT PHONG (ĐỈNH PHONG)", desc: "Tối thượng kiếm tốc: +85% tốc độ kiếm, làm chậm ma thạch 40%!", rarity: "legendary", multiplier: 0.85 }
    ]
  },
  golden_shield: {
    icon: "shield",
    type: "defense",
    tiers: [
      { name: "Hộ Thể Kim Quang (Cấp 1)", desc: "Tăng +30 HP tối đa và hồi phục 15 HP ngay lập tức", rarity: "common", multiplier: 30 },
      { name: "Hộ Thể Kim Quang (Cấp 2)", desc: "Tăng +60 HP tối đa và hồi phục 30 HP ngay lập tức", rarity: "rare", multiplier: 60 },
      { name: "BẤT DIỆT KIM THÂN (ĐỈNH PHONG)", desc: "Kim thân bất hoại: +100 HP tối đa và lập tức hồi 50 HP!", rarity: "legendary", multiplier: 100 }
    ]
  },
  blood_drain: {
    icon: "heart",
    type: "leech",
    tiers: [
      { name: "Huyết Linh Hấp Thu (Cấp 1)", desc: "Mỗi khi trảm diệt 5 từ vựng, hồi phục 1 HP đạo thể", rarity: "common", multiplier: 5 },
      { name: "Huyết Linh Hấp Thu (Cấp 2)", desc: "Mỗi khi trảm diệt 3 từ vựng, hồi phục 1 HP đạo thể", rarity: "rare", multiplier: 3 },
      { name: "HUYẾT HẢI THẦN ĐỒNG (ĐỈNH PHONG)", desc: "Đoạt thiên địa tạo hóa: Cứ mỗi 2 từ vựng hồi phục 2 HP!", rarity: "legendary", multiplier: 2 }
    ]
  },
  divine_crit: {
    icon: "zap",
    type: "crit",
    tiers: [
      { name: "Bạo Liệt Kiếm Khí (Cấp 1)", desc: "35% tỷ lệ bạo kích kiếm khí trảm gấp đôi điểm tu vi", rarity: "rare", multiplier: 2.0 },
      { name: "Bạo Liệt Kiếm Khí (Cấp 2)", desc: "55% tỷ lệ bạo kích kiếm khí trảm gấp 2.5 lần tu vi", rarity: "epic", multiplier: 2.5 },
      { name: "DIỆT THẾ THẦN KIẾM (ĐỈNH PHONG)", desc: "Chí tôn kiếm ý: 75% bạo kích trảm gấp 3.5 lần điểm tu vi!", rarity: "legendary", multiplier: 3.5 }
    ]
  },
  wisdom_aura: {
    icon: "book",
    type: "score",
    tiers: [
      { name: "Thần Thức Thông Tuệ (Cấp 1)", desc: "Tăng 50% điểm tu vi nhận được từ ma thạch cấp cao", rarity: "common", multiplier: 0.5 },
      { name: "Thần Thức Thông Tuệ (Cấp 2)", desc: "Tăng 100% điểm tu vi nhận được từ ma thạch cấp cao", rarity: "epic", multiplier: 1.0 },
      { name: "VẠN GIỚI ĐẠO TÂM (ĐỈNH PHONG)", desc: "Thông thiên triệt địa: Tăng 200% tu vi từ mọi loại ma thạch!", rarity: "legendary", multiplier: 2.0 }
    ]
  },
  dragon_wrath: {
    icon: "flame",
    type: "attack",
    tiers: [
      { name: "Chân Long Hàng Thế (Cấp 1)", desc: "Kích hoạt Long Uy, giảm 30% tốc độ rơi ma thạch toàn trường", rarity: "rare", multiplier: 0.30 },
      { name: "Chân Long Hàng Thế (Cấp 2)", desc: "Long Uy áp trận, giảm 50% tốc độ rơi ma thạch toàn trường", rarity: "epic", multiplier: 0.50 },
      { name: "CỬU LONG TRẤN THIÊN (ĐỈNH PHONG)", desc: "Cửu Trảo Kim Long giáng thế: Giảm 65% tốc độ ma thạch toàn cõi!", rarity: "legendary", multiplier: 0.65 }
    ]
  }
};

export const getTalentByLevel = (baseId: string, level: number): Talent => {
  const def = TALENTS_DEFINITIONS[baseId] || TALENTS_DEFINITIONS.swift_blade;
  const clampedLevel = Math.max(1, Math.min(3, level));
  const tier = def.tiers[clampedLevel - 1];

  return {
    id: `${baseId}_lv${clampedLevel}`,
    baseId,
    name: tier.name,
    desc: tier.desc,
    icon: def.icon,
    rarity: tier.rarity,
    type: def.type,
    level: clampedLevel,
    maxLevel: 3,
    multiplier: tier.multiplier
  };
};

export const TALENTS_POOL: Talent[] = Object.keys(TALENTS_DEFINITIONS).map(k => getTalentByLevel(k, 1));

export interface SaveSlotItem {
  slot_id: number;
  slot_name: string;
  is_occupied: boolean;
  realm: string;
  realm_idx: number;
  title: string;
  hp: number;
  max_hp: number;
  score: number;
  words_slain: number;
  band_idx: number;
  talents: Record<string, any>;
  updated_at: string;
}

export interface LeaderboardItem {
  id: number;
  rank: number;
  player_name: string;
  score: number;
  words_slain: number;
  realm: string;
  accuracy: number;
  wpm: number;
  created_at: string;
}

export interface GameStats {
  score: number;
  wordsSlain: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  wpm: number;
  accuracy: number;
  combo: number;
  maxCombo: number;
  hp: number;
  maxHp: number;
  realmIdx: number;
  qiPoints: number;
}
