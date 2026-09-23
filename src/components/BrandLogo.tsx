import React from 'react';
import brightlyLogoImg from '../assets/images/brightly_app_logo_1790170019136.jpg';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showSubtitle?: boolean;
  className?: string;
  variant?: 'full' | 'icon-only' | 'stacked' | 'inline';
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
    <div 
      id="brightly-brand-logo" 
      className={`flex ${variant === 'stacked' ? 'flex-col items-center text-center gap-2' : 'items-center gap-2.5 sm:gap-3'} ${className}`}
    >
      {/* Authentic Logo Emblem from uploaded asset */}
      <div 
        className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]} rounded-2xl overflow-hidden transition-transform duration-200 hover:scale-105 ${
          darkTheme ? 'bg-white/90 p-0.5 shadow-sm' : ''
        }`}
      >
        <img
          src={brightlyLogoImg}
          alt="Brightly Home Lesson Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Brand Typography */}
      {variant !== 'icon-only' && (
        variant === 'inline' ? (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className={`font-black tracking-tight ${darkTheme ? 'text-white' : 'text-[#006738]'} uppercase font-display ${titleSizes[size]}`}>
              BRIGHTLY
            </span>
            <span className={`font-black tracking-tight text-[#D97706] uppercase font-display ${titleSizes[size]}`}>
              HOME LESSON
            </span>
          </div>
        ) : (
          <div className={`flex flex-col leading-tight ${variant === 'stacked' ? 'items-center' : ''}`}>
            <div className={`font-black tracking-tight ${darkTheme ? 'text-white' : 'text-[#006738]'} uppercase font-display ${titleSizes[size]}`}>
              BRIGHTLY
            </div>
            <div className={`font-black tracking-wider text-[#D97706] uppercase font-display -mt-1 ${titleSizes[size]}`}>
              HOME LESSON
            </div>
            {showSubtitle && size !== 'sm' && (
              <span className={`text-[10px] font-extrabold ${darkTheme ? 'text-emerald-300' : 'text-[#006738]'} tracking-wider uppercase mt-0.5`}>
                Nigerian Primary 1–6 (NERDC)
              </span>
            )}
          </div>
        )
      )}
    </div>
  );
};
