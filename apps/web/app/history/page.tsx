'use client';

import React, { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Employee, LocationPoint } from '@repo/types';
import { Calendar, User, Navigation, Clock, MapPin, Route, Flag, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-sky-50/50 text-slate-500 font-bold text-xs">
      <div className="flex items-center gap-2 p-4 rounded-2xl glass-panel shadow-lg">
        <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
        <span>Marshrut xaritasi yuklanmoqda...</span>
      </div>
    </div>
  ),
});

function LocationHistoryContent() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('emp-yusupov');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [historyData, setHistoryData] = useState<{
    employeeName: string;
    totalDistanceKm: number;
    durationMinutes: number;
    points: LocationPoint[];
    startLocation?: LocationPoint;
    endLocation?: LocationPoint;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const queryEmpId = searchParams.get('employeeId');

  useEffect(() => {
    fetch('/api/employees')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEmployees(data);
          if (queryEmpId) {
            setSelectedEmpId(queryEmpId);
          } else {
            const activeEmp =
              data.find((e: Employee) => e.id === 'emp-yusupov') ||
              data.find((e: Employee) => e.isTrackingEnabled);
            if (activeEmp) {
              setSelectedEmpId(activeEmp.id);
            }
          }
        }
      });
  }, [queryEmpId]);

  const loadHistory = async () => {
    if (!selectedEmpId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/location/history?employeeId=${selectedEmpId}&date=${selectedDate}&t=${Date.now()}`,
        {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        }
      );
      const data = await res.json();
      setHistoryData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEmpId) {
      loadHistory();
      const interval = setInterval(loadHistory, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedEmpId, selectedDate]);

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1 flex flex-col relative z-10">
      {/* Controls Bar in Frosted Glass */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-white/80 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-700">
          {/* Employee selector */}
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-sky-600" />
            <label className="text-slate-600">Xodim:</label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="bg-white/85 border border-sky-200/80 rounded-2xl px-3.5 py-2 text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.user?.name} ({emp.employeeCode})
                </option>
              ))}
            </select>
          </div>

          {/* Date selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-600" />
            <label className="text-slate-600">Sana:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white/85 border border-sky-200/80 rounded-2xl px-3.5 py-2 text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs cursor-pointer"
            />
          </div>
        </div>

        {/* Metrics pills */}
        {historyData && (
          <div className="flex items-center gap-3 text-xs">
            <div className="bg-sky-500/10 border border-sky-200/70 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-sky-950 font-black shadow-2xs">
              <Navigation className="w-4 h-4 text-sky-600" />
              <span>Jami Masofa: <strong className="text-sky-700 font-mono">{historyData.totalDistanceKm} km</strong></span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-200/70 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-emerald-950 font-black shadow-2xs">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Davomiylik: <strong className="text-emerald-700 font-mono">{historyData.durationMinutes} daq</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Map + Stop Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[520px]">
        {/* Route Map */}
        <div className="lg:col-span-2 glass-panel rounded-3xl border border-white/80 shadow-xl overflow-hidden h-[520px] relative">
          <MapView routePoints={historyData?.points || []} />
        </div>

        {/* Stop points Timeline */}
        <div className="glass-panel p-5 rounded-3xl border border-white/80 shadow-xl flex flex-col h-[520px] overflow-hidden">
          <div className="pb-3 border-b border-sky-100 flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Route className="w-4 h-4 text-sky-600" />
              <span>Harakat Nuqtalari va Bekatlar</span>
            </h3>
            <span className="text-[10px] font-bold text-sky-700 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-200/60">
              {historyData?.points?.length || 0} nuqta
            </span>
          </div>

          <div className="overflow-y-auto flex-1 space-y-3 pr-1">
            {historyData?.points && historyData.points.length > 0 ? (
              historyData.points.map((pt, idx) => (
                <div key={pt.id} className="relative pl-6 border-l-2 border-sky-300/80 pb-2">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-sky-600 flex items-center justify-center shadow-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-600"></div>
                  </div>
                  <div className="bg-white/85 p-3 rounded-2xl border border-sky-100/80 text-xs shadow-2xs hover:bg-white transition-all">
                    <div className="flex items-center justify-between font-extrabold text-slate-900">
                      <span>{pt.district || 'Bandixon tumani'}</span>
                      <span className="text-sky-700 font-mono text-[11px] font-bold">
                        {new Date(pt.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{pt.region || 'Surxondaryo viloyati'}</p>
                    <div className="mt-1 text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 inline-block">
                      GPS: {pt.latitude.toFixed(4)}, {pt.longitude.toFixed(4)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 space-y-2 p-6 text-center">
                <Route className="w-8 h-8 text-sky-300" />
                <p className="font-bold text-slate-600">Tanlangan sanada GPS ma‘lumoti topilmadi</p>
                <p className="text-[11px] text-slate-400">Boshqa sana yoki xodimni tanlang</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LocationHistoryPage() {
  return (
    <div className="flex min-h-screen relative text-slate-900">
      {/* Ambient background light orbs */}
      <div className="fixed top-12 right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-sky-400/25 via-cyan-300/20 to-blue-500/10 blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="fixed bottom-16 left-60 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-teal-300/20 via-sky-300/20 to-indigo-400/15 blur-3xl pointer-events-none -z-10" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Lokatsiya Tarixi va Harakat Marshruti" />
        <Suspense fallback={<div className="p-4 text-xs text-slate-500 font-bold">Yuklanmoqda...</div>}>
          <LocationHistoryContent />
        </Suspense>
      </div>
    </div>
  );
}
