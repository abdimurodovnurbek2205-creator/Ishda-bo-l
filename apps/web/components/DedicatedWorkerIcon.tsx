'use client';

import React from 'react';
import Image from 'next/image';

interface DedicatedWorkerIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'avatar' | 'full';
  className?: string;
  showTooltip?: boolean;
}

export function DedicatedWorkerIcon({
  size = 'md',
  variant = 'avatar',
  className = '',
  showTooltip = true,
}: DedicatedWorkerIconProps) {
  // Size mappings
  const sizeClasses = {
    sm: 'w-9 h-9 rounded-xl',
    md: 'w-12 h-12 rounded-2xl',
    lg: 'w-16 h-16 rounded-2xl',
    xl: 'w-24 h-24 rounded-3xl',
  };

  const imgSizes = {
    sm: 34,
    md: 46,
    lg: 60,
    xl: 92,
  };

  const imgSrc = variant === 'full' ? '/worker-transparent.png' : '/worker-avatar.png';

  return (
    <div
      className={`relative group/worker cursor-pointer select-none flex-shrink-0 ${className}`}
      title="Har qanday ob-havoda o'z ishiga mas'ul xodim — 'Ishda bo'l' timsoli"
    >
      {/* Icon Badge Container */}
      <div
        className={`${sizeClasses[size]} relative overflow-hidden bg-gradient-to-b from-sky-400 via-sky-600 to-blue-800 border border-white/50 shadow-lg shadow-sky-600/35 transition-all duration-300 group-hover/worker:scale-105 group-hover/worker:shadow-sky-500/60 group-hover/worker:border-white/80 ring-1 ring-sky-300/40 flex items-end justify-center`}
      >
        {/* Sky / Atmospheric background glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/70 via-transparent to-sky-300/20 pointer-events-none" />

        {/* --- WEATHER LAYER 1: RAIN STREAKS (Yomg'ir) --- */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          <div className="absolute top-0 left-[18%] w-[1.5px] h-3.5 bg-gradient-to-b from-transparent via-cyan-100 to-sky-200 rounded-full animate-rain-1 opacity-75" />
          <div className="absolute top-0 left-[48%] w-[1.5px] h-4 bg-gradient-to-b from-transparent via-cyan-100 to-sky-200 rounded-full animate-rain-2 opacity-80" />
          <div className="absolute top-0 left-[75%] w-[1.5px] h-3 bg-gradient-to-b from-transparent via-cyan-100 to-sky-200 rounded-full animate-rain-3 opacity-70" />
          <div className="absolute top-0 left-[88%] w-[1.5px] h-3.5 bg-gradient-to-b from-transparent via-cyan-100 to-sky-200 rounded-full animate-rain-4 opacity-75" />
        </div>

        {/* --- WEATHER LAYER 2: SNOW FLAKES (Qor) --- */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          <span className="absolute top-0 left-[25%] w-1 h-1 bg-white/90 rounded-full blur-[0.4px] shadow-[0_0_2px_#fff] animate-snow-1" />
          <span className="absolute top-0 left-[62%] w-1.5 h-1.5 bg-white/95 rounded-full blur-[0.4px] shadow-[0_0_3px_#fff] animate-snow-2" />
          <span className="absolute top-0 left-[38%] w-1 h-1 bg-white/85 rounded-full blur-[0.4px] shadow-[0_0_2px_#fff] animate-snow-3" />
          <span className="absolute top-0 left-[82%] w-1.5 h-1.5 bg-white/90 rounded-full blur-[0.4px] shadow-[0_0_3px_#fff] animate-snow-4" />
        </div>

        {/* --- WALKING WORKER CHARACTER (Ishga borayotgan xodim) --- */}
        <div className="relative z-20 flex flex-col items-center justify-end pb-0.5 animate-worker-walk">
          <Image
            src={imgSrc}
            alt="Ishga borayotgan xodim"
            width={imgSizes[size]}
            height={imgSizes[size]}
            unoptimized
            className="object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover/worker:scale-105"
            priority
          />
          {/* Walking shadow */}
          <div className="w-5 h-1 bg-blue-950/60 rounded-full blur-[1px] -mt-1 animate-step-shadow" />
        </div>

        {/* Glossy top glass reflection highlight */}
        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/35 via-white/10 to-transparent pointer-events-none rounded-t-2xl z-30" />

        {/* Active Pulse Badge (Tizimda faol timsol) */}
        <span className="absolute top-1 right-1 z-30 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 ring-1 ring-white/80"></span>
        </span>
      </div>

      {/* Tooltip on Hover */}
      {showTooltip && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover/worker:flex items-center z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-950/95 text-white text-[11px] font-semibold py-1.5 px-3 rounded-xl border border-sky-400/40 shadow-xl backdrop-blur-md whitespace-nowrap flex items-center gap-1.5">
            <span className="text-sky-300">🌧️❄️</span>
            <span>Har qanday ob-havoda o‘z ishida!</span>
          </div>
          <div className="w-2 h-2 bg-slate-950 border-l border-b border-sky-400/40 transform rotate-45 -ml-1"></div>
        </div>
      )}
    </div>
  );
}
