'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-sky-800 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur mx-auto flex items-center justify-center mb-3">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold">BANDIXON MONITORING</h2>
          <p className="text-xs text-sky-100 mt-1">Bandixon tuman O‘simliklar karantini va himoyasi bo‘limi</p>
          <p className="text-[11px] text-sky-200 mt-0.5 font-medium">Bo‘lim boshlig‘i va Xodimlar uchun yagona kirish</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Telefon Raqamingiz (yoki Login)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
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
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            {loading ? 'Tekshirilmoqda...' : 'Tizimga Kirish'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 space-y-1 text-center">
            <p className="font-semibold text-slate-700">Tizimga Kirish Qo‘llanmasi</p>
            <p>Bo‘lim boshlig‘i hamda barcha xodimlar o‘zlariga ajratilgan Telefon raqami va Parol orqali ushbu yagona oyna orqali kiradilar.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
