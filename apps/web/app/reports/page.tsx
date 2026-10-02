'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Download, Calendar, FileText, Search, Table, FileSpreadsheet, Navigation, Clock } from 'lucide-react';

export default function ReportsPage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reports, setReports] = useState<any[]>([]);

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/reports/daily?date=${selectedDate}`);
      const data = await res.json();
      if (data.reports) setReports(data.reports);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedDate]);

  return (
    <div className="flex min-h-screen relative text-slate-900">
      {/* Ambient background light orbs */}
      <div className="fixed top-12 right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-sky-400/25 via-cyan-300/20 to-blue-500/10 blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="fixed bottom-16 left-60 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-teal-300/20 via-sky-300/20 to-indigo-400/15 blur-3xl pointer-events-none -z-10" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <Header title="Kunlik va Oylik Hisobotlar" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full relative z-10">
          {/* Action Bar in Frosted Glass */}
          <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-white/80 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span className="text-slate-600">Hisobot Sanasi:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white/85 border border-sky-200/80 rounded-2xl px-3.5 py-2 text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
              />
            </div>

            <a
              href={`/api/reports/export?date=${selectedDate}`}
              download
              className="group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-5 py-2.5 rounded-2xl flex items-center gap-2 transition-all shadow-md shadow-emerald-600/25 hover:shadow-emerald-500/40 active:scale-95 border border-white/20 cursor-pointer"
            >
              <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
              <span>Excel / CSV Yuklab Olish</span>
            </a>
          </div>

          {/* Report Table in Frosted Glass Container */}
          <div className="glass-panel rounded-3xl overflow-hidden border border-white/80 shadow-xl">
            <div className="p-4 sm:p-5 border-b border-sky-100/70 bg-gradient-to-b from-white/90 via-sky-50/40 to-white/70 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50"></span>
                  Kunlik Nazorat Hisoboti ({selectedDate})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Xodimlarning kunlik harakat masofasi, ishlagan soatlari va GPS qaydlari
                </p>
              </div>
              <span className="text-xs font-bold text-sky-800 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-200/60">
                Jami xodimlar: {reports.length} ta
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-sky-100/80 bg-sky-50/50 backdrop-blur-md text-sky-950 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Xodim & Kodi</th>
                    <th className="py-3.5 px-4">Bo‘lim</th>
                    <th className="py-3.5 px-4">Ish Boshlanishi</th>
                    <th className="py-3.5 px-4">Ish Yakunlanishi</th>
                    <th className="py-3.5 px-4">Davomiyligi</th>
                    <th className="py-3.5 px-4">Boshlang‘ich Joy</th>
                    <th className="py-3.5 px-4">Oxirgi Joy</th>
                    <th className="py-3.5 px-4">Masofa (km)</th>
                    <th className="py-3.5 px-4 text-right">GPS Nuqtalari</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100/60">
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <FileSpreadsheet className="w-8 h-8 mx-auto text-sky-400 mb-2" />
                        <p className="font-bold text-slate-700 text-sm">Ushbu sanada hisobot ma‘lumotlari topilmadi</p>
                      </td>
                    </tr>
                  ) : (
                    reports.map((r, i) => (
                      <tr key={i} className="group hover:bg-sky-100/50 transition-all duration-150">
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors">
                            {r.employeeName}
                          </div>
                          <div className="text-[10px] text-sky-700 font-bold font-mono">{r.employeeCode}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-800 font-semibold">{r.department}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{r.workStart}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{r.workEnd}</td>
                        <td className="py-3.5 px-4 font-black text-slate-900">{r.durationHours} soat</td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium text-[11px]">{r.startLocation}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium text-[11px]">{r.endLocation}</td>
                        <td className="py-3.5 px-4 font-black text-emerald-700 font-mono">{r.distanceKm} km</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-sky-800">
                          <span className="bg-white/80 px-2 py-0.5 rounded-lg border border-sky-100 shadow-2xs">
                            {r.locationPointCount} ta
                          </span>
                        </td>
                      </tr>
                    ))
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
