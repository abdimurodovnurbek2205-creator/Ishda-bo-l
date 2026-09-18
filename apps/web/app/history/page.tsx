'use client';

import React, { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Employee, LocationPoint } from '@repo/types';
import { Calendar, User, Navigation, Clock, MapPin, Route, Flag } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500 font-medium">
      Marshrut xaritasi yuklanmoqda...
    </div>
  ),
});

function LocationHistoryContent() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('emp-1');
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
          if (queryEmpId) setSelectedEmpId(queryEmpId);
        }
      });
  }, [queryEmpId]);

  const loadHistory = async () => {
    if (!selectedEmpId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/location/history?employeeId=${selectedEmpId}&date=${selectedDate}`);
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
    }
  }, [selectedEmpId, selectedDate]);

  return (
    <main className="p-6 space-y-6 max-w-7xl mx-auto w-full flex-1 flex flex-col">
      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
          {/* Employee selector */}
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-sky-600" />
            <label>Xodim:</label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
            <label>Sana:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Metrics pills */}
        {historyData && (
          <div className="flex items-center gap-4 text-xs">
            <div className="bg-sky-50 border border-sky-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sky-900 font-bold">
              <Navigation className="w-4 h-4 text-sky-600" />
              Jami Masofa: {historyData.totalDistanceKm} km
            </div>
            <div className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-emerald-900 font-bold">
              <Clock className="w-4 h-4 text-emerald-600" />
              Vaqt: {historyData.durationMinutes} daqiqa
            </div>
          </div>
        )}
      </div>

      {/* Map + Stop Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">
        {/* Route Map */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden h-[500px] relative">
          <MapView routePoints={historyData?.points || []} />
        </div>

        {/* Stop points Timeline */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col h-[500px] overflow-hidden">
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <Route className="w-4 h-4 text-sky-600" />
            Harakat Nuqtalari va Bekatlar
          </h3>

          <div className="overflow-y-auto flex-1 space-y-3 pr-1">
            {historyData?.points && historyData.points.length > 0 ? (
              historyData.points.map((pt, idx) => (
                <div key={pt.id} className="relative pl-6 border-l-2 border-sky-200 pb-2">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-sky-600 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-600"></div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{pt.district || 'Bandixon tumani'}</span>
                      <span className="text-sky-700 font-mono text-[11px]">
                        {new Date(pt.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{pt.region || 'Surxondaryo viloyati'}</p>
                    <div className="mt-1 text-[10px] text-slate-400 font-mono">
                      GPS: {pt.latitude.toFixed(4)}, {pt.longitude.toFixed(4)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Tanlangan sanada GPS ma‘lumoti topilmadi.
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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Lokatsiya Tarixi va Harakat Marshruti" />
        <Suspense fallback={<div className="p-4 text-xs text-slate-500">Yuklanmoqda...</div>}>
          <LocationHistoryContent />
        </Suspense>
      </div>
    </div>
  );
}
