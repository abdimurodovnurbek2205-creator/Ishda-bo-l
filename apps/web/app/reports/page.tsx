'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Download, Calendar, FileText, Search, Table } from 'lucide-react';

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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Kunlik va Oylik Hisobotlar" />

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Action Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-700">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Hisobot Sanasi:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <a
              href={`/api/reports/export?date=${selectedDate}`}
              download
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              Excel / CSV Yuklab Olish
            </a>
          </div>

          {/* Report Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Kunlik Nazorat Hisoboti ({selectedDate})</h3>
              <span className="text-xs text-slate-500">Jami xodimlar: {reports.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-600 font-semibold">
                    <th className="p-3">Xodim & Kodi</th>
                    <th className="p-3">Bo‘lim</th>
                    <th className="p-3">Ish Boshlanishi</th>
                    <th className="p-3">Ish Yakunlanishi</th>
                    <th className="p-3">Davomiyligi</th>
                    <th className="p-3">Boshlang‘ich Joy</th>
                    <th className="p-3">Oxirgi Joy</th>
                    <th className="p-3">Masofa (km)</th>
                    <th className="p-3 text-right">GPS Nuqtalari</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{r.employeeName}</div>
                        <div className="text-[10px] text-sky-600 font-mono">{r.employeeCode}</div>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{r.department}</td>
                      <td className="p-3 font-mono text-slate-700">{r.workStart}</td>
                      <td className="p-3 font-mono text-slate-700">{r.workEnd}</td>
                      <td className="p-3 font-semibold text-slate-900">{r.durationHours} soat</td>
                      <td className="p-3 text-slate-600 text-[11px]">{r.startLocation}</td>
                      <td className="p-3 text-slate-600 text-[11px]">{r.endLocation}</td>
                      <td className="p-3 font-bold text-emerald-700">{r.distanceKm} km</td>
                      <td className="p-3 text-right font-mono text-slate-700">{r.locationPointCount} ta</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
