'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  MapPin,
  History,
  Clock,
  FileSpreadsheet,
  ShieldAlert,
  Settings,
  Radio,
  ChevronRight,
} from 'lucide-react';
import { DedicatedWorkerIcon } from './DedicatedWorkerIcon';

const NAV_ITEMS = [
  { name: 'Bosh sahifa', href: '/', icon: LayoutDashboard },
  { name: 'Jonli xarita', href: '/live-map', icon: MapPin },
  { name: 'Xodimlar', href: '/employees', icon: Users },
  { name: 'Lokatsiya tarixi', href: '/history', icon: History },
  { name: 'Ish vaqti', href: '/sessions', icon: Clock },
  { name: 'Hisobotlar', href: '/reports', icon: FileSpreadsheet },
  { name: 'Geozonalar', href: '/geofences', icon: ShieldAlert },
  { name: 'Sozlamalar', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-950/90 via-slate-900/90 to-sky-950/90 backdrop-blur-2xl text-white min-h-screen flex flex-col border-r border-sky-400/20 flex-shrink-0 relative z-20 shadow-2xl">
      {/* Header Logo */}
      <Link
        href="/"
        className="p-3 border-b border-sky-500/20 flex items-center gap-3 group cursor-pointer hover:bg-white/5 transition-all text-decoration-none"
      >
        <DedicatedWorkerIcon size="md" />
        <div className="overflow-hidden">
          <h1 className="font-black text-xs sm:text-sm tracking-tight leading-tight text-white group-hover:text-sky-300 transition-colors">
            BANDIXON MONITORING
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <p className="text-[10px] text-sky-400 font-bold tracking-wide truncate">GPS Nazorat Tizimi</p>
          </div>
          <span className="inline-block mt-0.5 text-[9px] text-sky-200/70 font-medium tracking-tight">
            Har ob-havoda xizmatda
          </span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/35 border border-white/20'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white hover:translate-x-1 backdrop-blur-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-300'
                  }`}
                />
                <span>{item.name}</span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all ${
                  isActive ? 'opacity-100 text-white' : 'text-slate-400 group-hover:translate-x-0.5'
                }`}
              />
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-sky-500/20 bg-slate-950/70 backdrop-blur-md text-xs text-slate-400 space-y-1">
        <div className="flex items-center justify-between">
          <p className="font-extrabold text-slate-200 text-xs">Surxondaryo viloyati</p>
          <span className="px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 text-[10px] font-mono font-bold border border-sky-500/40">
            v1.2 PRO
          </span>
        </div>
        <p className="text-[11px] text-sky-400/90 font-semibold leading-snug">
          Bandixon tuman O‘simliklar karantini va himoyasi bo‘limi
        </p>
      </div>
    </aside>
  );
}
