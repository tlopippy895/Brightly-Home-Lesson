import React from 'react';
import brightlyLogoImg from '../assets/images/brightly_app_logo_1790170019136.jpg';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showSubtitle?: boolean;
  className?: string;
  variant?: 'full' | 'icon-only' | 'stacked' | 'inline';
  darkTheme?: boolean;
  colorScheme?: 'classic' | 'blue' | 'white';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  variant = 'full',
  darkTheme = false,
  colorScheme = 'blue',
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-28 h-28',
  };

  const titleSizes = {
    sm: 'text-base font-black',
    md: 'text-xl font-black',
    lg: 'text-2xl font-black',
    xl: 'text-3xl font-black',
    '2xl': 'text-4xl font-black',
  };

  const isBlue = colorScheme === 'blue' && !darkTheme;

  return (
    <div 
      id="brightly-brand-logo" 
      className={`flex ${variant === 'stacked' ? 'flex-col items-center text-center gap-1.5' : 'items-center gap-2.5 sm:gap-3'} ${className}`}
    >
      {/* Authentic Logo Emblem */}
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
        <div className={`flex flex-col leading-tight ${variant === 'stacked' ? 'items-center text-center' : ''}`}>
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight ${darkTheme ? 'text-white' : isBlue ? 'text-[#0284C7]' : 'text-[#006738]'} font-display ${titleSizes[size]}`}>
              Brightly
            </span>
            <span className={`font-black tracking-tight ${darkTheme ? 'text-amber-300' : isBlue ? 'text-[#0284C7]' : 'text-[#D97706]'} font-display ${titleSizes[size]}`}>
              Home Lesson
            </span>
          </div>
          {showSubtitle && (
            <span className={`text-[9px] sm:text-[10px] font-black ${darkTheme ? 'text-emerald-200' : 'text-[#0284C7]/80'} tracking-widest uppercase mt-0.5`}>
              LEARN. UNDERSTAND. PRACTICE. MASTER.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
