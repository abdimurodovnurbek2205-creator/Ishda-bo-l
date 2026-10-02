'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Settings, Shield, Bell, Map, Database, Server, Clock, Zap, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen relative text-slate-900">
      {/* Ambient background light orbs */}
      <div className="fixed top-12 right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-sky-400/25 via-cyan-300/20 to-blue-500/10 blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="fixed bottom-16 left-60 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-teal-300/20 via-sky-300/20 to-indigo-400/15 blur-3xl pointer-events-none -z-10" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <Header title="Tizim Sozlamalari" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full relative z-10">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/80 shadow-xl space-y-6">
            <div className="pb-4 border-b border-sky-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-xs shadow-sky-500/50"></span>
                  GPS Monitoring Parametrlari
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Tizimning umumiy xaritalash, signal qabul qilish va bildirishnoma sozlamalari
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-200/60">
                Faol Rejim
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/80 border border-sky-100/80 shadow-2xs">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">GPS Signal Interval Yuborilishi</h4>
                  <p className="text-slate-500 font-medium mt-0.5">Mobil ilovadan GPS koordinatalarini serverga uzatish tezligi</p>
                </div>
                <select className="bg-white border border-sky-200/80 rounded-2xl p-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-sky-500 shadow-xs cursor-pointer">
                  <option value="30">30 soniya (Odatiy tezkor rejim)</option>
                  <option value="60">1 daqiqa</option>
                  <option value="120">2 daqiqa</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/80 border border-sky-100/80 shadow-2xs">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Standart Ish Vaqti Chegarasi</h4>
                  <p className="text-slate-500 font-medium mt-0.5">Yangi yaratilgan xodimlar uchun odatiy ish grafigi</p>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <input
                    type="text"
                    defaultValue="08:00"
                    className="w-20 p-2 bg-white border border-sky-200/80 rounded-xl text-center font-bold shadow-xs outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <span className="font-bold text-slate-400">—</span>
                  <input
                    type="text"
                    defaultValue="17:00"
                    className="w-20 p-2 bg-white border border-sky-200/80 rounded-xl text-center font-bold shadow-xs outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/80 border border-sky-100/80 shadow-2xs">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Tumanlararo Chegara Bildirishnomasi</h4>
                  <p className="text-slate-500 font-medium mt-0.5">Xodim Surxondaryo tumanlari orasida ko‘chganida avto-xabar berish</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 accent-sky-600 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/80 border border-sky-100/80 shadow-2xs">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">OneID Integratsiyasi</h4>
                  <p className="text-slate-500 font-medium mt-0.5">Xodimlarning yagona identifikatsiya tizimi orqali kirishi</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-800 border border-sky-300/60">
                  Uланган
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
