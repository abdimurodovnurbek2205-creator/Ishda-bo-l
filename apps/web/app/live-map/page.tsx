'use client';

import React, { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { EmployeeDrawer } from '@/components/EmployeeDrawer';
import { EmployeeLiveSummary } from '@repo/types';
import { RefreshCw, Radio, Layers, Filter, MapPin, Users, Activity, Clock } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

// Dynamically import MapView to disable SSR for Leaflet map
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-sky-50/50 text-slate-500 font-bold text-xs">
      <div className="flex items-center gap-2 p-4 rounded-2xl glass-panel shadow-lg">
        <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
        <span>Xarita yuklanmoqda...</span>
      </div>
    </div>
  ),
});

function LiveMapContent() {
  const [employees, setEmployees] = useState<EmployeeLiveSummary[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeLiveSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const selectedIdFromQuery = searchParams.get('selected');

  const fetchLive = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/location/live?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      const data = await res.json();
      if (data.employees) {
        setEmployees(data.employees);
        if (selectedIdFromQuery) {
          const match = data.employees.find((e: EmployeeLiveSummary) => e.employeeId === selectedIdFromQuery);
          if (match) setSelectedEmp(match);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();
    // SSE Realtime stream subscription or polling
    const eventSource = new EventSource('/api/realtime/stream');
    eventSource.addEventListener('update', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (Array.isArray(data)) {
          setEmployees(data);
        }
      } catch (err) {
        console.error(err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const workingCount = employees.filter((e) => e.status === 'WORKING').length;
  const offlineCount = employees.filter((e) => e.status === 'NOT_WORKING' || e.status === 'OFFLINE').length;

  return (
    <div className="flex-1 relative w-full h-full">
      {/* Floating Glass Island Controls */}
      <div className="absolute top-4 left-4 z-20 glass-panel rounded-2xl p-2.5 sm:p-3 flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-bold text-slate-800 shadow-xl border border-white/85">
        <div className="flex items-center gap-2 text-emerald-800 px-2 py-1 rounded-xl bg-emerald-500/10 border border-emerald-200/60">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Ishda ({workingCount} kishi)</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-600 px-2 py-1 rounded-xl bg-slate-100/80 border border-slate-200/60">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Ishda emas ({offlineCount} kishi)</span>
        </div>

        <button
          onClick={fetchLive}
          className="ml-auto p-2 text-sky-700 hover:text-white bg-sky-500/10 hover:bg-sky-600 rounded-xl transition-all duration-200 border border-sky-200/60 active:scale-95 shadow-2xs cursor-pointer"
          title="Xaritani yangilash"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Map Layer */}
      <MapView
        employees={employees}
        selectedEmployeeId={selectedEmp?.employeeId}
        onSelectEmployee={(emp) => setSelectedEmp(emp)}
      />

      {/* Side Drawer for Selected Employee */}
      <EmployeeDrawer
        employee={selectedEmp}
        onClose={() => setSelectedEmp(null)}
      />
    </div>
  );
}

export default function LiveMapPage() {
  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Ambient orbs */}
      <div className="fixed top-10 right-20 w-[450px] h-[450px] rounded-full bg-gradient-to-br from-sky-400/20 to-blue-500/10 blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-64 w-[350px] h-[350px] rounded-full bg-gradient-to-tr from-cyan-400/20 to-teal-300/15 blur-3xl pointer-events-none -z-10" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Header title="Jonli Xarita (Live GPS Map)" />
        <Suspense fallback={<div className="p-4 text-xs text-slate-500 font-bold">Yuklanmoqda...</div>}>
          <LiveMapContent />
        </Suspense>
      </div>
    </div>
  );
}
