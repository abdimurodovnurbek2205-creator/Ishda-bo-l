'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Settings, Shield, Bell, Map, Database, Server } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Tizim Sozlamalari" />

        <main className="p-6 space-y-6 max-w-4xl mx-auto w-full">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Settings className="w-5 h-5 text-sky-600" />
              GPS Monitoring Parametrlari
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-800">GPS Signal Interval Yuborilishi</h4>
                  <p className="text-slate-500">Mobil ilovadan GPS koordinatalarini serverga uzatish tezligi</p>
                </div>
                <select className="bg-white border border-slate-200 rounded p-1.5 font-bold text-slate-800">
                  <option value="30">30 soniya (Odatiy MVP)</option>
                  <option value="60">1 daqiqa</option>
                  <option value="120">2 daqiqa</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-800">Standart Ish Vaqti Chegarasi</h4>
                  <p className="text-slate-500">Yangi yaratilgan xodimlar uchun odatiy grafig</p>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <input type="text" defaultValue="08:00" className="w-16 p-1 border rounded text-center" />
                  <span>—</span>
                  <input type="text" defaultValue="17:00" className="w-16 p-1 border rounded text-center" />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-800">Tumanlararo Chegara Bildirishnomasi</h4>
                  <p className="text-slate-500">Xodim Surxondaryo tumanlari orasida ko‘chganida avto-xabar berish</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-sky-600" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
