'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface DedicatedWorkerIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'avatar' | 'full';
  className?: string;
  showTooltip?: boolean;
}

type WeatherType = 'SUNNY' | 'RAINY' | 'SNOWY';

export function DedicatedWorkerIcon({
  size = 'md',
  variant = 'full',
  className = '',
  showTooltip = true,
}: DedicatedWorkerIconProps) {
  const [weather, setWeather] = useState<WeatherType>('SUNNY');

  // Automatically cycle weather every 5.5 seconds: SUNNY -> RAINY -> SNOWY -> SUNNY
  useEffect(() => {
    const cycle: WeatherType[] = ['SUNNY', 'RAINY', 'SNOWY'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % cycle.length;
      setWeather(cycle[idx]);
    }, 5500);
    return () => clearInterval(interval);
  }, []);

  // Manual weather toggle on click
  const handleToggleWeather = (e: React.MouseEvent) => {
    e.stopPropagation();
    setWeather((prev) => (prev === 'SUNNY' ? 'RAINY' : prev === 'RAINY' ? 'SNOWY' : 'SUNNY'));
  };

  // Dimensions & scaling per size (Rounded square matching screenshot)
  const containerSizes = {
    sm: 'w-10 h-10 rounded-xl',
    md: 'w-14 h-14 rounded-2xl',
    lg: 'w-20 h-20 rounded-2xl',
    xl: 'w-28 h-28 rounded-3xl',
  };

  const weatherLabels = {
    SUNNY: { text: 'Quruq & Quyoshli', emoji: '☀️', phrase: 'Quyoshli kunda ham o‘z ishida' },
    RAINY: { text: 'Yomg‘irli ob-havo', emoji: '🌧️', phrase: 'Yomg‘ir yog‘sa ham o‘z ishida' },
    SNOWY: { text: 'Qorli qish kuni', emoji: '❄️', phrase: 'Qor yog‘sa ham o‘z ishida' },
  };

  return (
    <div
      onClick={handleToggleWeather}
      className={`relative group/worker cursor-pointer select-none flex-shrink-0 ${className}`}
      title={`Har qanday ob-havoda o'z ishiga mas'ul xodim — 'Ishda bo'l' timsoli (${weatherLabels[weather].text})`}
    >
      {/* Outer Glow & Glass Border Card */}
      <div
        className={`${containerSizes[size]} relative overflow-hidden border border-white/50 shadow-xl shadow-sky-950/20 transition-all duration-500 group-hover/worker:scale-105 group-hover/worker:shadow-sky-500/50 group-hover/worker:border-white/90 ring-1 ring-sky-300/40`}
      >
        {/* ========================================================= */}
        {/* 1. DYNAMIC SKY BACKGROUND (Quyoshli / Yomg'ir / Qor)     */}
        {/* ========================================================= */}
        <div
          className={`absolute inset-0 transition-all duration-1000 ${
            weather === 'SUNNY'
              ? 'bg-gradient-to-b from-sky-400 via-sky-300 to-amber-100/90'
              : weather === 'RAINY'
              ? 'bg-gradient-to-b from-slate-800 via-sky-950 to-slate-800'
              : 'bg-gradient-to-b from-slate-900 via-sky-900 to-indigo-950'
          }`}
        />

        {/* --- SUNNY WEATHER: Radiating Sun & Clear Sky --- */}
        {weather === 'SUNNY' && (
          <div className="absolute top-1.5 right-1.5 z-10 animate-in fade-in zoom-in duration-700 pointer-events-none">
            <div className="relative w-6 h-6 flex items-center justify-center">
              {/* Sun ambient glow */}
              <div className="absolute w-8 h-8 rounded-full bg-amber-400/35 blur-sm animate-pulse" />
              {/* Spinning Sun rays ring */}
              <div className="absolute w-6 h-6 rounded-full border border-amber-300/60 border-dashed animate-spin-slow" />
              {/* Golden Sun core */}
              <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-200 shadow-md shadow-amber-400/70" />
            </div>
          </div>
        )}

        {/* --- RAINY WEATHER: Clouds & Falling Raindrops --- */}
        {weather === 'RAINY' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-15 animate-in fade-in duration-700">
            {/* Top dark clouds glow */}
            <div className="absolute -top-3 inset-x-0 h-6 bg-slate-900/60 blur-xs rounded-full pointer-events-none" />
            {/* Rain streaks */}
            <div className="absolute -top-2 left-[18%] w-[1.5px] h-3.5 bg-gradient-to-b from-transparent via-cyan-100 to-sky-200 rounded-full animate-rain-1 opacity-85" />
            <div className="absolute -top-2 left-[44%] w-[1.5px] h-4 bg-gradient-to-b from-transparent via-cyan-100 to-sky-200 rounded-full animate-rain-2 opacity-90" />
            <div className="absolute -top-2 left-[70%] w-[1.5px] h-3 bg-gradient-to-b from-transparent via-cyan-100 to-sky-200 rounded-full animate-rain-3 opacity-80" />
            <div className="absolute -top-2 left-[86%] w-[1.5px] h-4 bg-gradient-to-b from-transparent via-cyan-100 to-sky-200 rounded-full animate-rain-4 opacity-85" />
          </div>
        )}

        {/* --- SNOWY WEATHER: Drifting Snowflakes --- */}
        {weather === 'SNOWY' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-15 animate-in fade-in duration-700">
            <span className="absolute top-0 left-[22%] w-1.5 h-1.5 bg-white/95 rounded-full blur-[0.3px] shadow-[0_0_2px_#fff] animate-snow-1" />
            <span className="absolute top-0 left-[60%] w-1.5 h-1.5 bg-white/95 rounded-full blur-[0.3px] shadow-[0_0_3px_#fff] animate-snow-2" />
            <span className="absolute top-0 left-[38%] w-1 h-1 bg-white/85 rounded-full blur-[0.3px] shadow-[0_0_2px_#fff] animate-snow-3" />
            <span className="absolute top-0 left-[82%] w-1.5 h-1.5 bg-white/90 rounded-full blur-[0.3px] shadow-[0_0_3px_#fff] animate-snow-4" />
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. PERSPECTIVE ROAD (Yo'lda ketayotgan bo'ladi)           */}
        {/* ========================================================= */}
        <div className="absolute inset-x-0 bottom-0 h-[42%] overflow-hidden z-10 pointer-events-none">
          {/* Asphalt Base Surface */}
          <div
            className={`w-full h-full transition-colors duration-1000 ${
              weather === 'SUNNY'
                ? 'bg-gradient-to-t from-slate-800 via-slate-700 to-slate-600'
                : weather === 'RAINY'
                ? 'bg-gradient-to-t from-slate-950 via-slate-900 to-slate-800'
                : 'bg-gradient-to-t from-slate-900 via-slate-800 to-sky-950'
            }`}
          />

          {/* Perspective Road Markings SVG */}
          <svg
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            {/* Road borders / curbs */}
            <polygon
              points="28,0 72,0 96,100 4,100"
              fill={weather === 'RAINY' ? '#0f172a' : '#1e293b'}
              opacity="0.85"
            />
            {/* Left Curb Line */}
            <line x1="28" y1="0" x2="4" y2="100" stroke="#94a3b8" strokeWidth="2.5" strokeOpacity="0.7" />
            {/* Right Curb Line */}
            <line x1="72" y1="0" x2="96" y2="100" stroke="#94a3b8" strokeWidth="2.5" strokeOpacity="0.7" />

            {/* Road Center Dashed Line (Moving forward toward the viewer) */}
            <line
              x1="50"
              y1="0"
              x2="50"
              y2="100"
              stroke="#fbbf24"
              strokeWidth="3.5"
              strokeDasharray="14 10"
              className="animate-road-move"
            />
          </svg>

          {/* Road Weather Effects */}
          {weather === 'SNOWY' && (
            <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-t from-white/70 via-white/30 to-transparent pointer-events-none" />
          )}
          {weather === 'RAINY' && (
            <div className="absolute inset-x-0 bottom-1 h-1.5 bg-gradient-to-r from-transparent via-cyan-200/35 to-transparent blur-[0.6px] pointer-events-none" />
          )}
        </div>

        {/* ========================================================= */}
        {/* 3. WAIST-UP WALKING WORKER (Beldan pastki qismi olingan)  */}
        {/* ========================================================= */}
        <div className="relative z-20 h-full w-full flex flex-col items-center justify-end pb-0 pointer-events-none">
          {/* Walking Bob Motion */}
          <div className="relative h-[88%] w-auto flex flex-col items-center justify-end animate-worker-walk">
            <Image
              src="/worker-waist.png"
              alt="Ishga borayotgan xodim (Beldan yuqori)"
              width={264}
              height={275}
              unoptimized
              priority
              className="h-full w-auto max-h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover/worker:scale-105"
            />
          </div>
        </div>

        {/* Glossy top glass reflection highlight */}
        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 via-white/10 to-transparent pointer-events-none rounded-t-2xl z-25" />

        {/* Current Weather Badge / Status Indicator (Top-Left) */}
        <div className="absolute top-1 left-1 z-30 flex items-center gap-1 bg-slate-950/65 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/20 text-[9px] shadow-sm">
          <span>{weatherLabels[weather].emoji}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
      </div>

      {/* Tooltip on Hover */}
      {showTooltip && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover/worker:flex items-center z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-950/95 text-white text-[11px] font-semibold py-1.5 px-3 rounded-xl border border-sky-400/40 shadow-xl backdrop-blur-md whitespace-nowrap flex items-center gap-2">
            <span>{weatherLabels[weather].emoji}</span>
            <span>
              <strong>{weatherLabels[weather].text}:</strong> {weatherLabels[weather].phrase} (Ishda bo‘l)
            </span>
          </div>
          <div className="w-2 h-2 bg-slate-950 border-l border-b border-sky-400/40 transform rotate-45 -ml-1"></div>
        </div>
      )}
    </div>
  );
}
