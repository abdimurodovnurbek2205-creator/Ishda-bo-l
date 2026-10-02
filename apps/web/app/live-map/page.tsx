'use client';

import React, { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { EmployeeDrawer } from '@/components/EmployeeDrawer';
import { EmployeeLiveSummary, LocationPoint } from '@repo/types';
import { VisitedStop } from '@/lib/distance';
import {
  RefreshCw,
  Radio,
  Layers,
  Filter,
  MapPin,
  Users,
  Activity,
  Clock,
  Navigation,
  Compass,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
  Wifi,
  X,
} from 'lucide-react';
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

  // Field Route & Visited Stops states
  const [routePoints, setRoutePoints] = useState<LocationPoint[]>([]);
  const [visitedStops, setVisitedStops] = useState<VisitedStop[]>([]);
  const [showStopsDrawer, setShowStopsDrawer] = useState<boolean>(true);
  const [focusedLocation, setFocusedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [totalDistance, setTotalDistance] = useState<number>(0);

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

  // Fetch today's route & visited field stops whenever an employee is selected
  useEffect(() => {
    if (!selectedEmp) {
      setRoutePoints([]);
      setVisitedStops([]);
      setTotalDistance(0);
      return;
    }

    setHistoryLoading(true);
    const today = new Date().toISOString().split('T')[0];

    fetch(`/api/location/history?employeeId=${selectedEmp.employeeId}&date=${today}&t=${Date.now()}`, {
      cache: 'no-store',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.points) {
          setRoutePoints(data.points);
          setVisitedStops(data.stops || []);
          setTotalDistance(data.totalDistanceKm || 0);
          setShowStopsDrawer(true);
        }
      })
      .catch((err) => console.error('Failed to load employee route history:', err))
      .finally(() => setHistoryLoading(false));
  }, [selectedEmp?.employeeId]);

  const workingCount = employees.filter((e) => e.status === 'WORKING').length;
  const offlineCount = employees.filter((e) => e.status === 'NOT_WORKING' || e.status === 'OFFLINE').length;

  // Handle clicking a visited stop button
  const handleSelectStop = (stop: VisitedStop) => {
    setSelectedStopId(stop.id);
    setFocusedLocation({ lat: stop.latitude, lng: stop.longitude });
  };

  return (
    <div className="flex-1 relative w-full h-full overflow-hidden">
      {/* ========================================================= */}
      {/* 1. TOP FLOATING MISSION CONTROL ISLAND                   */}
      {/* ========================================================= */}
      <div className="absolute top-4 left-4 right-4 sm:right-auto z-20 flex flex-col gap-2 max-w-2xl pointer-events-auto">
        <div className="glass-panel rounded-2xl p-2.5 sm:p-3 flex flex-wrap items-center gap-2.5 sm:gap-3.5 text-xs font-bold text-slate-800 shadow-xl border border-white/85 backdrop-blur-xl">
          {/* Status Pills */}
          <div className="flex items-center gap-2 text-emerald-800 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-300/60 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Ishda: {workingCount} nafar</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600 px-2.5 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/80">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Nofaol: {offlineCount}</span>
          </div>

          {/* Visited Stops Toggle Button (Qayerga borganlarini tugmachasi) */}
          {selectedEmp && (
            <button
              onClick={() => setShowStopsDrawer((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-95 ${
                showStopsDrawer
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sky-600/25'
                  : 'bg-white/80 hover:bg-white text-sky-800 border-sky-200/80'
              }`}
            >
              <span>📍 Borgan joylari ({visitedStops.length})</span>
              {showStopsDrawer ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={fetchLive}
            className="ml-auto p-2 text-sky-700 hover:text-white bg-sky-500/10 hover:bg-sky-600 rounded-xl transition-all duration-200 border border-sky-200/60 active:scale-95 shadow-2xs cursor-pointer"
            title="Xaritani yangilash"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Quick Employee Selection Pill Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedEmp(null)}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border cursor-pointer ${
              !selectedEmp
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'glass-panel text-slate-700 hover:text-slate-900 border-white/80'
            }`}
          >
            👥 Barchasi
          </button>

          {employees.map((emp) => {
            const isSelected = selectedEmp?.employeeId === emp.employeeId;
            const isWorking = emp.status === 'WORKING';
            return (
              <button
                key={emp.employeeId}
                onClick={() => setSelectedEmp(emp)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border cursor-pointer shadow-2xs ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-600 shadow-sky-600/30 ring-2 ring-sky-300'
                    : 'glass-panel text-slate-800 hover:bg-white border-white/80'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isWorking ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                <span>{emp.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MAP COMPONENT                                         */}
      {/* ========================================================= */}
      <MapView
        employees={employees}
        selectedEmployeeId={selectedEmp?.employeeId}
        onSelectEmployee={(emp) => setSelectedEmp(emp)}
        routePoints={routePoints}
        visitedStops={visitedStops}
        focusedLocation={focusedLocation}
      />

      {/* ========================================================= */}
      {/* 3. VISITED LOCATIONS (DALA & OBYEKTLAR) INTERACTIVE PANEL */}
      {/* ========================================================= */}
      {selectedEmp && showStopsDrawer && (
        <div className="absolute bottom-4 inset-x-4 sm:left-6 sm:right-auto z-20 max-w-xl pointer-events-auto animate-in slide-in-from-bottom duration-300">
          <div className="glass-panel rounded-3xl p-4 shadow-2xl border border-white/90 backdrop-blur-2xl space-y-3">
            {/* Header info */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {selectedEmp.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight">
                    {selectedEmp.name}
                  </h3>
                  <p className="text-[10px] text-sky-700 font-semibold flex items-center gap-1">
                    <span>{selectedEmp.position}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold">Bugun: {totalDistance} km bosib o‘tildi</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                  Joy ustiga bosib ko‘ring
                </span>
                <button
                  onClick={() => setShowStopsDrawer(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stop Buttons Row / Grid ("Qayerga borganlarini tugmacha bo'lib turishi") */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 px-1">
                <span className="flex items-center gap-1 text-sky-900">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  Tashrif buyurilgan joylar ({visitedStops.length} ta nuqta):
                </span>
                {historyLoading && <span className="text-sky-600 animate-pulse text-[10px]">Yuklanmoqda...</span>}
              </div>

              {visitedStops.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500 rounded-xl bg-slate-50/70 border border-slate-200">
                  Hozircha faol dala marshruti yozilmagan.
                </div>
              ) : (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
                  {visitedStops.map((stop, idx) => {
                    const isSelected = selectedStopId === stop.id;
                    const timeStr = stop.arrivedAt
                      ? new Date(stop.arrivedAt).toLocaleTimeString('uz-UZ', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '';

                    let badgeColor = 'bg-amber-50 border-amber-300 text-amber-900';
                    let icon = '🌾';
                    if (stop.type === 'START') {
                      badgeColor = 'bg-emerald-50 border-emerald-300 text-emerald-900';
                      icon = '🏢';
                    } else if (stop.type === 'END') {
                      badgeColor = 'bg-rose-50 border-rose-300 text-rose-900';
                      icon = '🏁';
                    }

                    return (
                      <button
                        key={stop.id}
                        onClick={() => handleSelectStop(stop)}
                        className={`group relative flex-shrink-0 p-2.5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs active:scale-95 ${
                          isSelected
                            ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/30 ring-2 ring-sky-300'
                            : `${badgeColor} hover:bg-white hover:border-sky-400`
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base shrink-0">{icon}</span>
                          <div className="min-w-0 pr-1">
                            <p
                              className={`text-[11px] font-black leading-tight truncate ${
                                isSelected ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              {stop.name}
                            </p>
                            <p
                              className={`text-[10px] font-mono font-medium ${
                                isSelected ? 'text-sky-100' : 'text-slate-500'
                              }`}
                            >
                              ⏰ {timeStr}
                              {stop.durationMinutes > 0 && ` (${stop.durationMinutes} daq)`}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Offline sync note */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60 font-medium">
              <span className="flex items-center gap-1">
                <Wifi className="w-3 h-3 text-emerald-600" />
                Dala hududidagi signallar to‘liq sinxronlangan
              </span>
              <span>GPS aniqligi: 5m</span>
            </div>
          </div>
        </div>
      )}

      {/* Side Drawer for Selected Employee */}
      <EmployeeDrawer employee={selectedEmp} onClose={() => setSelectedEmp(null)} />
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
