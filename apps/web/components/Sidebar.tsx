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
  Shield,
} from 'lucide-react';

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
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col border-r border-slate-800 flex-shrink-0">
      {/* Header Logo */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-sky-500 p-2 rounded-lg text-white">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-sm leading-tight text-slate-100">BANDIXON MONITORING</h1>
          <p className="text-xs text-sky-400 font-medium">GPS Nazorat Tizimi</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
        <p className="font-semibold text-slate-300">Surxondaryo viloyati</p>
        <p className="text-[11px] text-sky-400 font-medium">Bandixon tuman O‘simliklar karantini va himoyasi bo‘limi</p>
        <p className="mt-2 text-[10px] text-slate-500">v1.0.0 Production MVP</p>
      </div>
    </aside>
  );
}
