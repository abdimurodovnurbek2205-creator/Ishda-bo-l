'use client';

import React from 'react';
import { User, LogOut, Radio, Globe } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Bosh sahifa' }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-xs">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Tizim faol
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* District indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
          <Globe className="w-3.5 h-3.5 text-sky-600" />
          <span>Surxondaryo | Bandixon</span>
        </div>

        {/* User profile info */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-xs border border-sky-700">
            BS
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">Bo‘riyev Shuxrat Xursandovich</p>
            <p className="text-[10px] text-sky-600 font-medium">Bo‘lim boshlig‘i (Kuzatuvchi)</p>
          </div>
          <Link
            href="/login"
            onClick={() => localStorage.removeItem('auth_token')}
            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100 transition-colors"
            title="Tizimdan Chiqish"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
