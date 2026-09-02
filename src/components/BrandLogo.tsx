import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showSubtitle?: boolean;
  className?: string;
  variant?: 'full' | 'icon-only' | 'stacked';
  darkTheme?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  variant = 'full',
  darkTheme = false,
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-32 h-32',
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base font-black',
    lg: 'text-xl font-black',
    xl: 'text-3xl font-black',
    '2xl': 'text-4xl font-black',
  };

  return (
    <div id="brightly-brand-logo" className={`flex ${variant === 'stacked' ? 'flex-col items-center text-center gap-2' : 'items-center gap-3'} ${className}`}>
      {/* 3D Master Vector Emblem */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]} transition-transform duration-200 hover:scale-105`}>
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full filter drop-shadow-md"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="brightly-sun-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF176" />
              <stop offset="45%" stopColor="#FFB300" />
              <stop offset="100%" stopColor="#F57C00" />
            </linearGradient>

            <linearGradient id="brightly-roof-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#42A5F5" />
              <stop offset="40%" stopColor="#1E88E5" />
              <stop offset="100%" stopColor="#0D47A1" />
            </linearGradient>

            <linearGradient id="brightly-roof-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#90CAF9" />
              <stop offset="100%" stopColor="#1976D2" />
            </linearGradient>

            <linearGradient id="brightly-gold-stem" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD54F" />
              <stop offset="50%" stopColor="#FFA000" />
              <stop offset="100%" stopColor="#E65100" />
            </linearGradient>

            <linearGradient id="brightly-blue-b" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#29B6F6" />
              <stop offset="45%" stopColor="#1976D2" />
              <stop offset="100%" stopColor="#0B3C84" />
            </linearGradient>

            <linearGradient id="brightly-child-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFE082" />
              <stop offset="50%" stopColor="#FFB300" />
              <stop offset="100%" stopColor="#FB8C00" />
            </linearGradient>

            <linearGradient id="brightly-green-leaf" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#81C784" />
              <stop offset="45%" stopColor="#43A047" />
              <stop offset="100%" stopColor="#1B5E20" />
            </linearGradient>

            <linearGradient id="brightly-book-blue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E88E5" />
              <stop offset="50%" stopColor="#1565C0" />
              <stop offset="100%" stopColor="#0A2C63" />
            </linearGradient>

            <filter id="soft-shadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.25" floodColor="#000000" />
            </filter>
          </defs>

          {/* 1. Rising Sun & Beams (Top Right) */}
          <g id="sun-element">
            {/* Sun Rays */}
            <path d="M142 42 L150 36 M158 50 L169 47 M166 65 L178 65 M160 80 L171 85 M126 26 L130 15 M108 19 L106 8"
              stroke="#FFA000" strokeWidth="4.5" strokeLinecap="round" opacity="0.9" />
            {/* Sun Orb */}
            <circle cx="140" cy="52" r="26" fill="url(#brightly-sun-grad)" filter="url(#soft-shadow)" />
          </g>

          {/* 2. Blue Chimney */}
          <g id="chimney-element">
            <rect x="132" y="44" width="16" height="52" rx="2" fill="url(#brightly-roof-grad)" stroke="#0D47A1" strokeWidth="1.5" />
            <rect x="129" y="40" width="22" height="7" rx="2.5" fill="url(#brightly-roof-highlight)" stroke="#0D47A1" strokeWidth="1.5" />
          </g>

          {/* 3. Blue House Roof Gable */}
          <g id="roof-gable">
            {/* Roof Outline & 3D bevel */}
            <path
              d="M26 84 L98 28 L170 84"
              fill="none"
              stroke="url(#brightly-roof-grad)"
              strokeWidth="19"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M27 82 L98 28 L169 82"
              fill="none"
              stroke="url(#brightly-roof-highlight)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
          </g>

          {/* 4. The Monogram House Body ('B' Shape) */}
          <g id="letter-b-house">
            {/* Left Gold Stem of 'B' */}
            <path
              d="M50 78 C65 62, 85 58, 100 58 L100 138 C80 138, 62 138, 50 138 Z"
              fill="#FFFFFF"
            />

            {/* Orange/Golden Left Arch Pillar */}
            <path
              d="M52 74 C66 60, 88 56, 100 56 L100 78 C88 78, 72 82, 64 92 L64 138 L52 138 Z"
              fill="url(#brightly-gold-stem)"
            />

            {/* Right Large Blue Curves of 'B' */}
            <path
              d="M100 56 C124 56, 138 68, 138 88 C138 98, 132 105, 120 108 C136 112, 146 122, 146 138 C146 154, 128 158, 100 158 L72 158 L72 138 L100 138 C116 138, 126 134, 126 124 C126 114, 114 110, 98 110 L84 110 L84 94 L98 94 C112 94, 120 90, 120 82 C120 74, 112 70, 98 70 L92 70 L92 56 Z"
              fill="url(#brightly-blue-b)"
              filter="url(#soft-shadow)"
            />

            {/* Top Loop: Golden 4-Pane Window */}
            <g id="window-panes" transform="translate(76, 62)">
              <path d="M4 16 L4 8 C4 3.5, 8 0, 13 0 C18 0, 22 3.5, 22 8 L22 16 Z" fill="none" />
              {/* 4 Panes with rounded corners */}
              <rect x="5" y="6" width="7" height="6.5" rx="1.5" fill="url(#brightly-sun-grad)" stroke="#FFF" strokeWidth="0.8" />
              <rect x="14" y="6" width="7" height="6.5" rx="1.5" fill="url(#brightly-sun-grad)" stroke="#FFF" strokeWidth="0.8" />
              <rect x="5" y="14" width="7" height="6.5" rx="1.5" fill="url(#brightly-sun-grad)" stroke="#FFF" strokeWidth="0.8" />
              <rect x="14" y="14" width="7" height="6.5" rx="1.5" fill="url(#brightly-sun-grad)" stroke="#FFF" strokeWidth="0.8" />
            </g>

            {/* Bottom Loop: Joyful Child Silhouette (Arms Raised in Victory) */}
            <g id="child-silhouette">
              {/* Child Head */}
              <circle cx="102" cy="116" r="6.5" fill="url(#brightly-child-gold)" stroke="#FF8F00" strokeWidth="1" />
              {/* Child Torso & Raised Arms in 'V' */}
              <path
                d="M86 116 L98 126 L98 140 L106 140 L106 126 L118 116 C112 122, 107 125, 102 128 C97 125, 92 122, 86 116 Z"
                fill="url(#brightly-child-gold)"
                stroke="#FF8F00"
                strokeWidth="1"
                strokeLinejoin="round"
              />
            </g>
          </g>

          {/* 5. Foundation: The Open Book (Green, White & Royal Blue Layers) */}
          <g id="open-book-base">
            {/* Layer A: Green Wings (Top Pages) */}
            <path
              d="M34 146 C60 134, 88 144, 98 158 C108 144, 136 134, 162 146 C165 147, 166 150, 164 153 C138 142, 110 152, 98 165 C86 152, 58 142, 32 153 C30 150, 31 147, 34 146 Z"
              fill="url(#brightly-green-leaf)"
            />

            {/* Layer B: Crisp White Book Pages */}
            <path
              d="M28 156 C56 144, 86 152, 98 167 C110 152, 140 144, 168 156 C170 158, 170 160, 167 162 C140 151, 110 160, 98 174 C86 160, 56 151, 29 162 C26 160, 26 158, 28 156 Z"
              fill="#FFFFFF"
              stroke="#E0E0E0"
              strokeWidth="0.8"
            />

            {/* Layer C: Deep Royal Blue Base Cover & Spine Foundation */}
            <path
              d="M24 166 C54 152, 86 160, 98 176 C110 160, 142 152, 172 166 C176 168, 177 172, 172 175 C142 164, 110 172, 98 186 C86 172, 54 164, 24 175 C19 172, 20 168, 24 166 Z"
              fill="url(#brightly-book-blue)"
              filter="url(#soft-shadow)"
            />

            {/* Book Spine Center Button / Connector */}
            <ellipse cx="98" cy="183" rx="8" ry="4" fill="#0D47A1" stroke="#42A5F5" strokeWidth="1" />
          </g>
        </svg>
      </div>

      {/* Brand Typography */}
      {variant !== 'icon-only' && (
        <div className={`flex flex-col leading-tight ${variant === 'stacked' ? 'items-center' : ''}`}>
          <div className={`font-black tracking-tight ${darkTheme ? 'text-white' : 'text-[#026838]'} uppercase font-display ${titleSizes[size]}`}>
            BRIGHTLY
          </div>
          <div className={`font-black tracking-wider text-[#D97706] uppercase font-display -mt-1 ${titleSizes[size]}`}>
            HOME LESSON
          </div>
          {showSubtitle && size !== 'sm' && (
            <span className={`text-[10px] font-extrabold ${darkTheme ? 'text-emerald-300' : 'text-[#43A047]'} tracking-wider uppercase mt-0.5`}>
              Nigerian Primary 1–6 (NERDC)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

