"use client";

import React from 'react';
import { 
  Flame, Trophy, Target, Sparkles, Lightbulb, X, Zap, 
  Coffee, MessageSquare, Mic, Gamepad2, Bot, Star
} from 'lucide-react';

/* =========================================================================
   INTERFACES (Frontend Architecture Standard)
   ========================================================================= */

export type TStickerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type TBearVariant = 'default' | 'speaking' | 'thinking' | 'happy' | 'listening';

export interface IMatchaBearStickerProps {
  size?: TStickerSize;
  variant?: TBearVariant;
  className?: string;
  showRipple?: boolean;
}

export interface ILearnerStickerProps {
  size?: TStickerSize;
  className?: string;
}

export type TStickerBadgeType = 
  | 'streak' 
  | 'trophy' 
  | 'target' 
  | 'spark' 
  | 'bulb' 
  | 'cross' 
  | 'lightning' 
  | 'tea' 
  | 'speech' 
  | 'mic' 
  | 'game' 
  | 'robot';

export interface IMatchaStickerBadgeProps {
  type: TStickerBadgeType;
  label?: string | React.ReactNode;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  animate?: boolean;
}

/* =========================================================================
   SIZE MAPPINGS
   ========================================================================= */

const SIZE_MAP: Record<TStickerSize, { box: string; svg: number }> = {
  xs: { box: 'w-6 h-6', svg: 24 },
  sm: { box: 'w-8 h-8', svg: 32 },
  md: { box: 'w-11 h-11', svg: 44 },
  lg: { box: 'w-14 h-14', svg: 56 },
  xl: { box: 'w-20 h-20', svg: 80 },
};

/* =========================================================================
   1. MATCHA BEAR STICKER (Custom Cute Vector Mascot)
   ========================================================================= */

export const MatchaBearSticker: React.FC<IMatchaBearStickerProps> = ({
  size = 'md',
  variant = 'default',
  className = '',
  showRipple = true,
}) => {
  const { box } = SIZE_MAP[size];

  // Dynamic animations based on variant
  const isSpeaking = variant === 'speaking';
  const isThinking = variant === 'thinking';
  const isHappy = variant === 'happy';

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 select-none group transition-transform duration-200 hover:scale-110 ${box} ${className}`}
    >
      {/* Speaking Ripple Halo */}
      {isSpeaking && showRipple && (
        <span className="absolute -inset-1 rounded-full bg-emerald-400/30 animate-ping pointer-events-none" />
      )}

      {/* Thinking Glow Aura */}
      {isThinking && (
        <span className="absolute -inset-1 rounded-full bg-amber-300/40 animate-pulse pointer-events-none" />
      )}

      {/* Die-cut Vinyl Sticker Frame */}
      <div className="w-full h-full rounded-2xl md:rounded-3xl bg-gradient-to-b from-[#FFFDF5] to-[#F4EED9] p-0.5 shadow-[0_3px_8px_rgba(93,64,55,0.14)] border-2 border-white ring-1 ring-emerald-900/10 flex items-center justify-center overflow-hidden">
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full drop-shadow-xs" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Bear Outer Ears */}
          <circle cx="28" cy="28" r="16" fill="#8D6E63" stroke="#5D4037" strokeWidth="4" />
          <circle cx="28" cy="28" r="9" fill="#E8D5B5" />
          <circle cx="72" cy="28" r="16" fill="#8D6E63" stroke="#5D4037" strokeWidth="4" />
          <circle cx="72" cy="28" r="9" fill="#E8D5B5" />

          {/* Bear Head */}
          <ellipse cx="50" cy="56" rx="36" ry="34" fill="#8D6E63" stroke="#5D4037" strokeWidth="4" />

          {/* Cute Matcha Leaf Beret on Left Ear */}
          <path 
            d="M 22 18 C 18 10, 32 6, 36 14 C 40 22, 26 26, 22 18 Z" 
            fill="#789262" 
            stroke="#1F4E3D" 
            strokeWidth="2.5" 
          />
          <path d="M 24 16 Q 30 14 34 16" stroke="#A7D08C" strokeWidth="1.5" strokeLinecap="round" />

          {/* Snout Area */}
          <ellipse cx="50" cy="62" rx="19" ry="14" fill="#FFF8EB" stroke="#5D4037" strokeWidth="2.5" />

          {/* Nose */}
          <ellipse cx="50" cy="56" rx="6" ry="4.5" fill="#4E342E" />

          {/* Mouth (Happy / Speaking / Neutral) */}
          {isSpeaking ? (
            // Open speaking mouth
            <path 
              d="M 44 63 Q 50 72 56 63 Z" 
              fill="#D32F2F" 
              stroke="#5D4037" 
              strokeWidth="2.5" 
              strokeLinejoin="round"
            />
          ) : isHappy ? (
            // Big happy curve
            <path 
              d="M 43 62 Q 50 69 57 62" 
              stroke="#5D4037" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              fill="none" 
            />
          ) : (
            // Cute gentle smile
            <path 
              d="M 44 62 Q 50 67 56 62" 
              stroke="#5D4037" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              fill="none" 
            />
          )}

          {/* Rosy Matcha Peach Cheeks */}
          <ellipse cx="28" cy="62" rx="6.5" ry="4" fill="#FF8A80" opacity="0.75" />
          <ellipse cx="72" cy="62" rx="6.5" ry="4" fill="#FF8A80" opacity="0.75" />

          {/* Eyes */}
          {isThinking ? (
            // Looking up playfully
            <>
              <circle cx="36" cy="46" r="4.5" fill="#3E2723" />
              <circle cx="38" cy="44" r="1.8" fill="#FFFFFF" />
              <circle cx="64" cy="46" r="4.5" fill="#3E2723" />
              <circle cx="66" cy="44" r="1.8" fill="#FFFFFF" />
            </>
          ) : isHappy ? (
            // Curved happy eyes ^ ^
            <>
              <path d="M 32 48 Q 36 43 40 48" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M 60 48 Q 64 43 68 48" stroke="#3E2723" strokeWidth="3" strokeLinecap="round" fill="none" />
            </>
          ) : (
            // Sparkly round eyes
            <>
              <circle cx="36" cy="48" r="4.5" fill="#3E2723" />
              <circle cx="37.5" cy="46.5" r="1.8" fill="#FFFFFF" />
              <circle cx="64" cy="48" r="4.5" fill="#3E2723" />
              <circle cx="65.5" cy="46.5" r="1.8" fill="#FFFFFF" />
            </>
          )}
        </svg>
      </div>

      {/* Mini status badge icon overlay */}
      {isSpeaking && (
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 border border-white text-white shadow-xs">
          <Mic className="w-2.5 h-2.5 animate-pulse" />
        </span>
      )}
      {isThinking && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 border border-white text-amber-950 shadow-xs">
          <Sparkles className="w-2.5 h-2.5 animate-spin" />
        </span>
      )}
    </div>
  );
};

/* =========================================================================
   2. LEARNER STICKER (Astronaut / Study Explorer)
   ========================================================================= */

export const LearnerSticker: React.FC<ILearnerStickerProps> = ({
  size = 'md',
  className = '',
}) => {
  const { box } = SIZE_MAP[size];

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 select-none group transition-transform duration-200 hover:scale-110 ${box} ${className}`}
    >
      <div className="w-full h-full rounded-2xl md:rounded-3xl bg-gradient-to-b from-[#E8F5E9] to-[#C8E6C9] p-0.5 shadow-[0_3px_8px_rgba(46,62,43,0.12)] border-2 border-white ring-1 ring-emerald-900/10 flex items-center justify-center overflow-hidden">
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full drop-shadow-xs" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Astronaut Helmet Outer */}
          <circle cx="50" cy="50" r="38" fill="#FFFFFF" stroke="#2D6A4F" strokeWidth="4" />
          
          {/* Helmet Visor with Matcha Gloss */}
          <rect x="22" y="28" width="56" height="42" rx="20" fill="#1B4332" stroke="#2D6A4F" strokeWidth="3" />
          <path d="M 28 36 Q 50 32 72 36" stroke="#A7D08C" strokeWidth="2.5" opacity="0.8" strokeLinecap="round" />
          
          {/* Cute Eyes inside Visor */}
          <ellipse cx="40" cy="48" rx="4" ry="5" fill="#A7D08C" />
          <circle cx="41.5" cy="46.5" r="1.5" fill="#FFFFFF" />
          <ellipse cx="60" cy="48" rx="4" ry="5" fill="#A7D08C" />
          <circle cx="61.5" cy="46.5" r="1.5" fill="#FFFFFF" />

          {/* Little Cheek Glow */}
          <ellipse cx="32" cy="54" rx="4" ry="2" fill="#81C784" opacity="0.6" />
          <ellipse cx="68" cy="54" rx="4" ry="2" fill="#81C784" opacity="0.6" />

          {/* Star Twinkle on Helmet Corner */}
          <path d="M 74 20 L 76 25 L 81 27 L 76 29 L 74 34 L 72 29 L 67 27 L 72 25 Z" fill="#FBC02D" />
        </svg>
      </div>

      <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary border border-white text-emerald-950 shadow-xs">
        <Star className="w-2 h-2 fill-current" />
      </span>
    </div>
  );
};

/* =========================================================================
   3. MATCHA STICKER BADGE (Die-Cut Vinyl Micro-Pill)
   ========================================================================= */

const BADGE_CONFIG: Record<TStickerBadgeType, {
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  text: string;
  border: string;
  iconColor: string;
  defaultLabel: string;
}> = {
  streak: {
    icon: Flame,
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    text: 'text-white',
    border: 'border-white',
    iconColor: 'text-amber-100 fill-amber-200',
    defaultLabel: 'Streak',
  },
  trophy: {
    icon: Trophy,
    bg: 'bg-amber-100',
    text: 'text-amber-900',
    border: 'border-amber-200',
    iconColor: 'text-amber-600 fill-amber-400',
    defaultLabel: 'Score',
  },
  target: {
    icon: Target,
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
    border: 'border-emerald-200',
    iconColor: 'text-emerald-700',
    defaultLabel: 'Ngữ Âm Học Thuật',
  },
  spark: {
    icon: Sparkles,
    bg: 'bg-gradient-to-r from-emerald-600 to-teal-700',
    text: 'text-white',
    border: 'border-emerald-300',
    iconColor: 'text-amber-300',
    defaultLabel: 'Band 8.5+ Upgrade',
  },
  bulb: {
    icon: Lightbulb,
    bg: 'bg-amber-50',
    text: 'text-amber-950',
    border: 'border-amber-200',
    iconColor: 'text-amber-600 fill-amber-300',
    defaultLabel: 'Matcha Coach Tip',
  },
  cross: {
    icon: X,
    bg: 'bg-rose-50',
    text: 'text-rose-900',
    border: 'border-rose-200',
    iconColor: 'text-rose-600',
    defaultLabel: 'Bạn nói',
  },
  lightning: {
    icon: Zap,
    bg: 'bg-teal-50',
    text: 'text-teal-900',
    border: 'border-teal-200',
    iconColor: 'text-teal-600 fill-teal-400',
    defaultLabel: 'Nhịp độ',
  },
  tea: {
    icon: Coffee,
    bg: 'bg-[#FFF9E6]',
    text: 'text-[#5D4037]',
    border: 'border-[#A7D08C]/40',
    iconColor: 'text-[#789262]',
    defaultLabel: 'Matcha Tea',
  },
  speech: {
    icon: MessageSquare,
    bg: 'bg-emerald-50',
    text: 'text-emerald-900',
    border: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    defaultLabel: 'Tốc độ WPM',
  },
  mic: {
    icon: Mic,
    bg: 'bg-[#1F4E3D]',
    text: 'text-white',
    border: 'border-emerald-400/50',
    iconColor: 'text-emerald-300',
    defaultLabel: 'Live Voice',
  },
  game: {
    icon: Gamepad2,
    bg: 'bg-primary/20',
    text: 'text-[#2D6A4F]',
    border: 'border-primary/40',
    iconColor: 'text-primary',
    defaultLabel: 'Arcade',
  },
  robot: {
    icon: Bot,
    bg: 'bg-indigo-50',
    text: 'text-indigo-900',
    border: 'border-indigo-200',
    iconColor: 'text-indigo-600',
    defaultLabel: 'AI Coach',
  },
};

export const MatchaStickerBadge: React.FC<IMatchaStickerBadgeProps> = ({
  type,
  label,
  size = 'sm',
  className = '',
  animate = false,
}) => {
  const config = BADGE_CONFIG[type] || BADGE_CONFIG.spark;
  const IconComponent = config.icon;
  const displayLabel = label !== undefined ? label : config.defaultLabel;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px] gap-1 rounded-full',
    sm: 'px-2.5 py-1 text-xs gap-1.5 rounded-xl',
    md: 'px-3.5 py-1.5 text-xs sm:text-sm gap-2 rounded-2xl',
  }[size];

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-bold tracking-tight select-none shadow-[0_2px_6px_rgba(93,64,55,0.08)] border-2 border-white ring-1 ring-black/5 hover:-translate-y-0.5 hover:rotate-0.5 active:translate-y-0 transition-all duration-150 cursor-default ${config.bg} ${config.text} ${sizeClasses} ${className}`}
    >
      <IconComponent className={`${iconSizes} ${config.iconColor} shrink-0 ${animate ? 'animate-bounce' : ''}`} />
      {displayLabel && <span>{displayLabel}</span>}
    </span>
  );
};
