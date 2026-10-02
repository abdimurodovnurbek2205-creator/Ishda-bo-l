'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';
import { DedicatedWorkerIcon } from '@/components/DedicatedWorkerIcon';

function OneIdLogoSvg({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 70 36" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Vertical text ONE */}
      <g transform="translate(10, 29) rotate(-90)">
        <text
          x="0"
          y="0"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="9"
          fontWeight="900"
          fill="#002C6C"
          letterSpacing="1.2"
        >
          ONE
        </text>
      </g>

      {/* Circle dot above I */}
      <circle cx="26" cy="7" r="2.8" fill="#002C6C" />

      {/* Pillar I */}
      <rect x="23" y="13" width="6" height="20" rx="1.5" fill="#002C6C" />

      {/* Curved D emblem */}
      <path
        d="M34 13 H46 C54 13 60 17.5 60 23 C60 28.5 54 33 46 33 H34 V13 Z M40 18 V28 H45.5 C49.5 28 53 26 53 23 C53 20 49.5 18 45.5 18 H40 Z"
        fill="#002C6C"
      />
    </svg>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if redirecting back from OneID callback with token or error
    const token = searchParams.get('token');
    const err = searchParams.get('error');

    if (token) {
      localStorage.setItem('auth_token', token);
      router.push('/');
      return;
    }

    if (err) {
      setError(err);
    }

    // Clear initial input state
    const t = setTimeout(() => {
      setIdentifier('');
      setPassword('');
    }, 150);
    return () => clearTimeout(t);
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Kirishda xatolik');
      }

      localStorage.setItem('auth_token', data.token);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-7 space-y-5 text-xs">
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50/80 border border-rose-200/80 backdrop-blur-sm text-rose-700 font-semibold text-center text-xs shadow-sm">
          {error}
        </div>
      )}

      {/* 1. Regular Login Form */}
      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
        <input type="text" name="prevent_autofill_user" style={{ display: 'none' }} tabIndex={-1} />
        <input type="password" name="prevent_autofill_pass" style={{ display: 'none' }} tabIndex={-1} />

        <div>
          <label className="block font-bold text-slate-700 mb-1.5 text-xs">Telefon Raqamingiz</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              autoComplete="off"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="+998901234567"
              className="w-full pl-10 pr-3.5 py-2.5 bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none transition-all text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1.5 text-xs">Parolingiz</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
              className="w-full pl-10 pr-3.5 py-2.5 bg-white/70 backdrop-blur-sm border border-slate-200/80 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none transition-all text-xs"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-600/25 active:scale-[0.99] cursor-pointer text-xs"
        >
          {loading ? 'Tekshirilmoqda...' : 'Tizimga Kirish'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-slate-200/80"></div>
        <span className="flex-shrink mx-3 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
          Yoki
        </span>
        <div className="flex-grow border-t border-slate-200/80"></div>
      </div>

      {/* 2. Official OneID Login Link */}
      <div>
        <a
          href="/api/auth/oneid/login"
          className="w-full bg-white/90 hover:bg-white active:scale-[0.99] text-[#002C6C] font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-3 shadow-md shadow-sky-950/5 transition-all cursor-pointer border-2 border-[#002C6C]/30 hover:border-[#002C6C] text-decoration-none backdrop-blur-sm"
        >
          <div className="bg-[#002C6C]/5 p-1 rounded-lg flex items-center justify-center border border-[#002C6C]/10">
            <OneIdLogoSvg className="h-6 w-auto shrink-0" />
          </div>
          <span className="text-xs font-extrabold tracking-wide text-[#002C6C]">OneID orqali Kirish</span>
        </a>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-glass-pattern">
      {/* Ambient background glow orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-sky-300/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-300/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-blue-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="glass-panel rounded-3xl shadow-2xl shadow-sky-950/10 max-w-md w-full overflow-hidden border border-white/80 backdrop-blur-xl relative">
        {/* Header */}
        <div className="bg-gradient-to-br from-sky-600/90 via-sky-700/90 to-blue-800/90 p-7 text-white text-center relative overflow-hidden backdrop-blur-md">
          <div className="absolute inset-0 bg-white/5 pointer-events-none" />
          <div className="flex justify-center mb-3">
            <DedicatedWorkerIcon size="lg" showTooltip={false} />
          </div>
          <h2 className="text-lg font-black tracking-wider">BANDIXON MONITORING</h2>
          <p className="text-[11px] text-sky-100/90 mt-1 font-medium">Bandixon tuman O‘simliklar karantini va himoyasi bo‘limi</p>
        </div>

        <Suspense fallback={<div className="p-6 text-center text-xs text-slate-500">Yuklanmoqda...</div>}>
          <LoginFormContent />
        </Suspense>
      </div>
    </div>
  );
}
