'use client';

import React, { useEffect, useState } from 'react';
import { User, LogOut, Radio, Globe, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Bosh sahifa' }: HeaderProps) {
  const [userName, setUserName] = useState('Bo‘riyev Shuxrat Xursandovich');
  const [userRole, setUserRole] = useState('Bo‘lim boshlig‘i (Karantin)');
  const [initials, setInitials] = useState('BS');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.user?.name) {
            setUserName(data.user.name);
            const init = data.user.name
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((n: string) => n[0])
              .join('')
              .toUpperCase();
            setInitials(init || 'BS');
          }
          if (data?.employee?.position) {
            setUserRole(data.employee.position);
          }
        })
        .catch(() => {});
    }
  }, []);

  return (
    <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-white/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_4px_25px_rgba(2,132,199,0.06)]">
      <div className="flex items-center gap-3">
        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">{title}</h2>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-300/60 shadow-2xs backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Tizim faol
        </span>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* District indicator - Glass pill */}
        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-800 bg-white/80 hover:bg-white px-3.5 py-1.5 rounded-2xl border border-sky-200/60 transition-all shadow-xs cursor-default backdrop-blur-md">
          <Globe className="w-3.5 h-3.5 text-sky-600 animate-spin-slow" />
          <span>Surxondaryo | Bandixon</span>
        </div>

        {/* User profile info */}
        <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-sky-100">
          <div className="group flex items-center gap-2.5 p-1 rounded-2xl hover:bg-white/80 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:shadow-md group-hover:scale-105 transition-all">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-extrabold text-slate-900 leading-tight group-hover:text-sky-600 transition-colors">
                {userName}
              </p>
              <p className="text-[10px] text-sky-700 font-semibold">{userRole}</p>
            </div>
          </div>

          <Link
            href="/login"
            onClick={() => localStorage.removeItem('auth_token')}
            className="p-2 text-slate-400 hover:text-rose-600 rounded-2xl hover:bg-rose-50 transition-all active:scale-95"
            title="Tizimdan chiqish"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
