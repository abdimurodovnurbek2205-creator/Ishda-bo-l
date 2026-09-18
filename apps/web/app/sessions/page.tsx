'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Clock, Play, Square, CheckCircle, MapPin, User } from 'lucide-react';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/work-sessions')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSessions(data);
      });
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Ish Vaqti Seanslari Tarixi" />

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Barcha Ish Seanslari</h3>
              <span className="text-xs text-slate-500">Jami seanslar: {sessions.length} ta</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-600 font-semibold">
                    <th className="p-3">Xodim</th>
                    <th className="p-3">Holati</th>
                    <th className="p-3">Ish Boshlanishi</th>
                    <th className="p-3">Ish Yakunlanishi</th>
                    <th className="p-3">Boshlang‘ich Koordinata</th>
                    <th className="p-3">Yakuniy Koordinata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((s) => {
                    const isFaol = s.status === 'ACTIVE';
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{s.employeeName}</div>
                          <div className="text-[10px] text-slate-500">{s.department} ({s.employeeCode})</div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-semibold text-[11px] inline-flex items-center gap-1 ${
                              isFaol
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isFaol ? <Play className="w-3 h-3 text-emerald-600" /> : <Square className="w-3 h-3 text-slate-400" />}
                            {isFaol ? 'Faol Ishda' : 'Yakunlangan'}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-700">
                          {new Date(s.startedAt).toLocaleString('uz-UZ')}
                        </td>
                        <td className="p-3 font-mono text-slate-700">
                          {s.endedAt ? new Date(s.endedAt).toLocaleString('uz-UZ') : '— (Hali yakunlanmagan)'}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">
                          {s.startLatitude ? `${s.startLatitude.toFixed(4)}, ${s.startLongitude.toFixed(4)}` : '-'}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">
                          {s.endLatitude ? `${s.endLatitude.toFixed(4)}, ${s.endLongitude.toFixed(4)}` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
