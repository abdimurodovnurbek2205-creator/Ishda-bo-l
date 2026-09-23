'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';

function OneIdLogoSvg({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 95 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Vertical text ONE */}
      <g transform="translate(10, 32) rotate(-90)">
        <text
          x="0"
          y="0"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="9.5"
          fontWeight="900"
          fill="#0B3082"
          letterSpacing="1.2"
        >
          ONE
        </text>
      </g>

      {/* Circle dot above I */}
      <circle cx="28" cy="8" r="3" fill="#0B3082" />

      {/* Pillar I */}
      <rect x="25" y="14" width="6" height="22" rx="1.5" fill="#0B3082" />

      {/* Curved D emblem */}
      <path
        d="M36 14 H48 C56 14 62 19 62 25 C62 31 56 36 48 36 H36 V14 Z M42.5 19.5 V30.5 H47.5 C51.5 30.5 55 28 55 25 C55 22 51.5 19.5 47.5 19.5 H42.5 Z"
        fill="#0B3082"
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

  const handleOneIdLogin = () => {
    window.location.href = '/api/auth/oneid/login';
  };

  return (
    <div className="p-6 space-y-5 text-xs">
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-center">
          {error}
        </div>
      )}

      {/* 1. Regular Login Form (First) */}
      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
        <input type="text" name="prevent_autofill_user" style={{ display: 'none' }} tabIndex={-1} />
        <input type="password" name="prevent_autofill_pass" style={{ display: 'none' }} tabIndex={-1} />

        <div>
          <label className="block font-bold text-slate-700 mb-1">Telefon Raqamingiz (yoki JSHSHIR)</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              required
              autoComplete="off"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="+998901234567"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Parolingiz</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
        >
          {loading ? 'Tekshirilmoqda...' : 'Tizimga Kirish'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink mx-3 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
          Yoki
        </span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      {/* 2. Official OneID Login Button (Exact Official ONE ID Emblem Logo) */}
      <div>
        <button
          type="button"
          onClick={handleOneIdLogin}
          className="w-full bg-white hover:bg-slate-50 active:scale-[0.99] text-[#0B3082] font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-3 shadow-md transition-all cursor-pointer border-2 border-[#0B3082]/30 hover:border-[#0B3082]"
        >
          {/* Exact Official ONE ID Vector Logo */}
          <OneIdLogoSvg className="h-7 w-auto shrink-0" />
          <span className="text-xs font-bold tracking-wide text-[#0B3082]">OneID orqali Kirish</span>
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-sky-800 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur mx-auto flex items-center justify-center mb-3">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold">BANDIXON MONITORING</h2>
          <p className="text-xs text-sky-100 mt-1">Bandixon tuman O‘simliklar karantini va himoyasi bo‘limi</p>
        </div>

        <Suspense fallback={<div className="p-6 text-center text-xs text-slate-500">Yuklanmoqda...</div>}>
          <LoginFormContent />
        </Suspense>
      </div>
    </div>
  );
}
