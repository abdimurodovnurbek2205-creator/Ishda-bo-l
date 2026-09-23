'use client';

import React, { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { EmployeeDrawer } from '@/components/EmployeeDrawer';
import { EmployeeLiveSummary } from '@repo/types';
import { RefreshCw, Radio, Layers, Filter } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

// Dynamically import MapView to disable SSR for Leaflet map
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500 font-medium">
      Xarita yuklanmoqda...
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

  return (
    <div className="flex-1 relative w-full h-full">
      {/* Map Controls Floating Bar */}
      <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur border border-slate-200 shadow-md rounded-xl p-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
        <div className="flex items-center gap-1.5 text-emerald-700">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Ishda ({employees.filter(e => e.status === 'WORKING').length} kishi)
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 border-l pl-3 border-slate-200">
          Ishda emas ({employees.filter(e => e.status === 'NOT_WORKING').length} kishi)
        </div>
        <button
          onClick={fetchLive}
          className="ml-auto p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          title="Yangilash"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Header title="Jonli Xarita (Live GPS Map)" />
        <Suspense fallback={<div className="p-4 text-xs text-slate-500">Yuklanmoqda...</div>}>
          <LiveMapContent />
        </Suspense>
      </div>
    </div>
  );
}
