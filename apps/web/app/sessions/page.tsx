'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Clock, Play, Square, CheckCircle, MapPin, User, Navigation, Calendar } from 'lucide-react';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/work-sessions')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSessions(data);
      });
  }, []);

  const activeCount = sessions.filter((s) => s.status === 'ACTIVE').length;

  return (
    <div className="flex min-h-screen relative text-slate-900">
      {/* Ambient background light orbs */}
      <div className="fixed top-12 right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-sky-400/25 via-cyan-300/20 to-blue-500/10 blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="fixed bottom-16 left-60 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-teal-300/20 via-sky-300/20 to-indigo-400/15 blur-3xl pointer-events-none -z-10" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <Header title="Ish Vaqti Seanslari Tarixi" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full relative z-10">
          <div className="glass-panel rounded-3xl overflow-hidden border border-white/80 shadow-xl">
            <div className="p-4 sm:p-5 border-b border-sky-100/70 bg-gradient-to-b from-white/90 via-sky-50/40 to-white/70 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-xs shadow-sky-500/50"></span>
                  Barcha Ish Seanslari Tarixi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Xodimlarning tizimga kirish, ish boshlash va yakunlash vaqtlari hamda GPS koordinatalari
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-200/60">
                  Hozir faol: {activeCount} ta
                </span>
                <span className="text-xs font-bold text-sky-800 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-200/60">
                  Jami: {sessions.length} ta
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-sky-100/80 bg-sky-50/50 backdrop-blur-md text-sky-950 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Xodim</th>
                    <th className="py-3.5 px-4">Holati</th>
                    <th className="py-3.5 px-4">Ish Boshlanishi</th>
                    <th className="py-3.5 px-4">Ish Yakunlanishi</th>
                    <th className="py-3.5 px-4">Boshlang‘ich Koordinata</th>
                    <th className="py-3.5 px-4">Yakuniy Koordinata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100/60">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Clock className="w-8 h-8 mx-auto text-sky-400 mb-2" />
                        <p className="font-bold text-slate-700 text-sm">Hozircha ish seanslari mavjud emas</p>
                      </td>
                    </tr>
                  ) : (
                    sessions.map((s) => {
                      const isFaol = s.status === 'ACTIVE';
                      return (
                        <tr key={s.id} className="group hover:bg-sky-100/50 transition-all duration-150">
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors">
                              {s.employeeName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              {s.department} • <strong className="text-sky-700">{s.employeeCode}</strong>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 rounded-full font-bold text-[11px] inline-flex items-center gap-1.5 shadow-2xs ${
                                isFaol
                                  ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-300/60'
                                  : 'bg-slate-500/10 text-slate-700 border border-slate-200/80'
                              }`}
                            >
                              {isFaol ? (
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                              ) : (
                                <Square className="w-2.5 h-2.5 text-slate-400" />
                              )}
                              <span>{isFaol ? 'Faol Ishda' : 'Yakunlangan'}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                            {new Date(s.startedAt).toLocaleString('uz-UZ')}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                            {s.endedAt ? (
                              new Date(s.endedAt).toLocaleString('uz-UZ')
                            ) : (
                              <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60">
                                Davom etmoqda...
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {s.startLatitude ? (
                              <span className="bg-white/80 px-2 py-1 rounded-lg border border-sky-100 shadow-2xs inline-block">
                                {s.startLatitude.toFixed(4)}, {s.startLongitude.toFixed(4)}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                            {s.endLatitude ? (
                              <span className="bg-white/80 px-2 py-1 rounded-lg border border-sky-100 shadow-2xs inline-block">
                                {s.endLatitude.toFixed(4)}, {s.endLongitude.toFixed(4)}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
