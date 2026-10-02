'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  Users,
  Activity,
  AlertTriangle,
  Clock,
  Navigation,
  MapPin,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Radio,
  Bell,
  Search,
  Filter,
  ArrowUpRight,
  Download,
  Phone,
  Shield,
  Zap,
  ChevronRight,
  Eye,
  Compass,
  Layers,
  Globe,
  Building2,
  Sparkles,
  X,
  ExternalLink,
} from 'lucide-react';
import { EmployeeLiveSummary } from '@repo/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmployeeDashboardView } from '@/components/EmployeeDashboardView';
import { EmployeeDrawer } from '@/components/EmployeeDrawer';
import { DedicatedWorkerIcon } from '@/components/DedicatedWorkerIcon';

export default function DashboardPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeLiveSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);

  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');

  // Filtering & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WORKING' | 'DELAYED' | 'NOT_WORKING'>('ALL');
  const [selectedEmp, setSelectedEmp] = useState<EmployeeLiveSummary | null>(null);

  // Live Toshkent Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('uz-UZ', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAuth = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        router.push('/login');
        return;
      }
      setCurrentUser(data.user);
      setCurrentEmployee(data.employee);
    } catch (e) {
      router.push('/login');
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/location/live?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
      });
      const data = await res.json();
      if (data.employees) {
        setEmployees(data.employees);
      }
      setLastRefreshedAt(
        new Date().toLocaleTimeString('uz-UZ', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    } catch (err) {
      console.error('Failed to fetch live summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuth();
    fetchSummary();
    const interval = setInterval(fetchSummary, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter options
  const departmentsList = useMemo(() => {
    return Array.from(new Set(employees.map((e) => e.department).filter(Boolean))) as string[];
  }, [employees]);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Department filter
      if (selectedDepartment !== 'ALL' && emp.department !== selectedDepartment) {
        return false;
      }

      // Status filter
      if (statusFilter === 'WORKING' && emp.status !== 'WORKING') return false;
      if (statusFilter === 'DELAYED') {
        const isDelayed =
          emp.status === 'DELAYED' ||
          (emp.status === 'WORKING' && emp.lastUpdateAgoSeconds !== undefined && emp.lastUpdateAgoSeconds > 3600);
        if (!isDelayed) return false;
      }
      if (statusFilter === 'NOT_WORKING') {
        const isInactive = emp.status === 'OFFLINE' || emp.status === 'NOT_WORKING';
        if (!isInactive) return false;
      }

      // Search query filter (name, phone, position, district)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = emp.name.toLowerCase().includes(q);
        const phoneMatch = (emp.phone || '').toLowerCase().includes(q);
        const posMatch = (emp.position || '').toLowerCase().includes(q);
        const districtMatch = (emp.currentDistrict || '').toLowerCase().includes(q);
        const codeMatch = (emp.employeeCode || '').toLowerCase().includes(q);
        if (!nameMatch && !phoneMatch && !posMatch && !districtMatch && !codeMatch) {
          return false;
        }
      }

      return true;
    });
  }, [employees, selectedDepartment, statusFilter, searchQuery]);

  // Overall metric counters
  const totalCount = employees.length;
  const workingCount = employees.filter((e) => e.status === 'WORKING').length;
  const delayedCount = employees.filter(
    (e) =>
      empStatusHelper(e) === 'DELAYED' ||
      (e.status === 'WORKING' && e.lastUpdateAgoSeconds !== undefined && e.lastUpdateAgoSeconds > 3600)
  ).length;
  const notWorkingCount = employees.filter((e) => e.status === 'OFFLINE' || e.status === 'NOT_WORKING').length;

  const workingRate = totalCount > 0 ? Math.round((workingCount / totalCount) * 100) : 0;

  function empStatusHelper(e: EmployeeLiveSummary) {
    if (e.status === 'DELAYED') return 'DELAYED';
    if (e.status === 'WORKING') return 'WORKING';
    return 'NOT_WORKING';
  }

  // If normal employee, redirect to employee view
  if (currentUser && currentUser.role === 'EMPLOYEE') {
    return <EmployeeDashboardView user={currentUser} employee={currentEmployee} />;
  }

  return (
    <div className="flex min-h-screen text-slate-900 relative">
      {/* ========================================================= */}
      {/* 🌌 AMBIENT FLOATING LIGHT ORBS FOR GLASS REFRACTION       */}
      {/* ========================================================= */}
      <div className="fixed top-12 right-20 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-sky-400/25 via-cyan-300/20 to-blue-500/10 blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="fixed bottom-16 left-60 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-teal-300/20 via-sky-300/20 to-indigo-400/15 blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/2 left-1/3 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-sky-200/20 to-cyan-200/15 blur-3xl pointer-events-none -z-10" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <Header title="Bosh sahifa (Dashboard)" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full relative z-10">
          {/* ========================================================= */}
          {/* 1. ULTRA-MODERN MISSION CONTROL HERO BANNER (DARK GLASS)  */}
          {/* ========================================================= */}
          <div className="glass-panel-dark relative overflow-hidden rounded-3xl text-white p-6 sm:p-8 shadow-2xl border border-sky-400/35">
            {/* Ambient Background Glow Effect inside banner */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-3.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-sky-500/20 text-sky-200 rounded-full text-xs font-semibold border border-sky-400/40 backdrop-blur-md shadow-inner">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Jonli GPS Monitoring Tizimi</span>
                  <span className="text-sky-400/60">•</span>
                  <span className="text-emerald-300 font-mono font-bold tracking-wide">
                    Toshkent: {currentTime || '--:--:--'}
                  </span>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <DedicatedWorkerIcon size="lg" variant="avatar" />
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-sky-100 to-sky-300 bg-clip-text text-transparent">
                      Bandixon Tumani GPS Nazorat Markazi
                    </h1>
                    <p className="text-[11px] text-sky-300 font-semibold flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Har qanday ob-havoda o‘z xizmatida — "Ishda bo‘l" timsoli
                    </p>
                  </div>
                </div>

                <p className="text-sky-100/90 text-xs sm:text-sm leading-relaxed font-normal">
                  Surxondaryo viloyati bo‘yicha O‘simliklar karantini va himoyasi bo‘limi xodimlarining ish vaqti,
                  harakat marshruti va hududiy geolokatsiyasini real-vaqtda boshqarish platformasi.
                </p>

                {/* Quick Info Glass Tags */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-[11px] text-sky-100 hover:bg-white/15 hover:border-white/30 transition-all cursor-default shadow-xs">
                    <MapPin className="w-3.5 h-3.5 text-sky-300" />
                    Surxondaryo viloyati
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-[11px] text-sky-100 hover:bg-white/15 hover:border-white/30 transition-all cursor-default shadow-xs">
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    Yuqori aniqlikdagi GPS
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-[11px] text-sky-100 hover:bg-white/15 hover:border-white/30 transition-all cursor-default shadow-xs">
                    <Activity className="w-3.5 h-3.5 text-emerald-300" />
                    Avto-yangilanish: 5s
                  </span>
                </div>
              </div>

              {/* Refresh & Live indicator pill */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0 w-full sm:w-auto">
                <button
                  onClick={fetchSummary}
                  disabled={loading}
                  className="group relative flex items-center justify-center gap-2.5 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-95 text-white text-xs font-bold px-5 py-3 rounded-2xl transition-all duration-300 shadow-lg shadow-sky-500/30 hover:shadow-sky-400/50 cursor-pointer w-full sm:w-auto overflow-hidden border border-white/20"
                  title="Ma'lumotlarni real-vaqtda qayta yangilash"
                >
                  <RefreshCw
                    className={`w-4 h-4 transition-transform duration-500 group-hover:rotate-180 ${
                      loading ? 'animate-spin' : ''
                    }`}
                  />
                  <span>{loading ? 'Yangilanmoqda...' : 'Ma’lumotlarni Yangilash'}</span>
                </button>

                {lastRefreshedAt && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-sky-500/30 text-[11px] text-sky-200 shadow-inner">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Sinxron: <strong className="text-white font-mono">{lastRefreshedAt}</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. FROSTED GLASS KPI METRIC CARDS WITH HOVER ANIMATION    */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Jami Xodimlar */}
            <div
              onClick={() => setStatusFilter('ALL')}
              className={`group relative overflow-hidden p-5 rounded-3xl glass-panel transition-all duration-300 cursor-pointer hover:-translate-y-1.5 ${
                statusFilter === 'ALL'
                  ? 'border-sky-500 ring-2 ring-sky-400/30 shadow-lg shadow-sky-500/15 bg-white/90'
                  : 'hover:border-sky-300/80'
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-400 to-blue-600 opacity-90 group-hover:h-2 transition-all"></div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 tracking-wide uppercase">Jami Xodimlar</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h3 className="text-3xl font-black text-slate-900 group-hover:text-sky-600 transition-colors">
                      {totalCount}
                    </h3>
                    <span className="text-xs font-semibold text-slate-500">kishi</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                    <Building2 className="w-3 h-3 text-sky-600" /> Shtat jadvali bo‘yicha
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 backdrop-blur-md border border-sky-200/60 group-hover:bg-sky-600 group-hover:text-white transition-all duration-300 flex items-center justify-center shadow-xs group-hover:shadow-lg group-hover:shadow-sky-500/30 group-hover:scale-110">
                  <Users className="w-6 h-6 transition-transform group-hover:rotate-6" />
                </div>
              </div>

              {/* Bottom active pill */}
              <div className="mt-4 pt-3 border-t border-sky-100/70 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Barcha xodimlar</span>
                <span className="text-sky-600 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                  Ko‘rish <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Card 2: Hozir Ishda (Faol) */}
            <div
              onClick={() => setStatusFilter('WORKING')}
              className={`group relative overflow-hidden p-5 rounded-3xl glass-panel transition-all duration-300 cursor-pointer hover:-translate-y-1.5 ${
                statusFilter === 'WORKING'
                  ? 'border-emerald-500 ring-2 ring-emerald-400/30 shadow-lg shadow-emerald-500/15 bg-white/90'
                  : 'hover:border-emerald-300/80'
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-90 group-hover:h-2 transition-all"></div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 tracking-wide uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Hozir Ishda (Faol)
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h3 className="text-3xl font-black text-emerald-600 group-hover:text-emerald-700 transition-colors">
                      {workingCount}
                    </h3>
                    <span className="text-xs font-semibold text-emerald-700">kishi</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> GPS seansi faol ({workingRate}%)
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 backdrop-blur-md border border-emerald-200/60 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 flex items-center justify-center shadow-xs group-hover:shadow-lg group-hover:shadow-emerald-500/30 group-hover:scale-110">
                  <Activity className="w-6 h-6 transition-transform group-hover:rotate-6" />
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 pt-3 border-t border-emerald-100/70 space-y-1.5">
                <div className="w-full bg-emerald-100/60 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(workingRate, 2)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>Faollik darajasi</span>
                  <span className="font-bold text-emerald-700">{workingRate}%</span>
                </div>
              </div>
            </div>

            {/* Card 3: Kechikkan / Signal Yo'q */}
            <div
              onClick={() => setStatusFilter('DELAYED')}
              className={`group relative overflow-hidden p-5 rounded-3xl glass-panel transition-all duration-300 cursor-pointer hover:-translate-y-1.5 ${
                statusFilter === 'DELAYED'
                  ? 'border-amber-500 ring-2 ring-amber-400/30 shadow-lg shadow-amber-500/15 bg-white/90'
                  : 'hover:border-amber-300/80'
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500 opacity-90 group-hover:h-2 transition-all"></div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-800 tracking-wide uppercase">
                    Kechikkan / Offline
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h3 className="text-3xl font-black text-amber-600 group-hover:text-amber-700 transition-colors">
                      {delayedCount}
                    </h3>
                    <span className="text-xs font-semibold text-amber-700">kishi</span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-1 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    {delayedCount > 0 ? 'Signal kechikmoqda' : 'Barcha signallar me’yorda'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 backdrop-blur-md border border-amber-200/60 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 flex items-center justify-center shadow-xs group-hover:shadow-lg group-hover:shadow-amber-500/30 group-hover:scale-110">
                  <AlertTriangle className="w-6 h-6 transition-transform group-hover:rotate-6" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-100/70 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Diqqat talab</span>
                <span className="text-amber-700 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                  Filtrlash <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Card 4: Ishda Emas */}
            <div
              onClick={() => setStatusFilter('NOT_WORKING')}
              className={`group relative overflow-hidden p-5 rounded-3xl glass-panel transition-all duration-300 cursor-pointer hover:-translate-y-1.5 ${
                statusFilter === 'NOT_WORKING'
                  ? 'border-slate-500 ring-2 ring-slate-400/30 shadow-lg shadow-slate-500/15 bg-white/90'
                  : 'hover:border-slate-400/80'
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-400 to-slate-600 opacity-90 group-hover:h-2 transition-all"></div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-600 tracking-wide uppercase">Ishda Emas</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <h3 className="text-3xl font-black text-slate-700 group-hover:text-slate-900 transition-colors">
                      {notWorkingCount}
                    </h3>
                    <span className="text-xs font-semibold text-slate-500">kishi</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-slate-500" /> Seans boshlanmagan
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-500/10 text-slate-600 backdrop-blur-md border border-slate-200/60 group-hover:bg-slate-700 group-hover:text-white transition-all duration-300 flex items-center justify-center shadow-xs group-hover:shadow-lg group-hover:shadow-slate-500/30 group-hover:scale-110">
                  <Clock className="w-6 h-6 transition-transform group-hover:rotate-6" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Navbatchilikda emas</span>
                <span className="text-slate-700 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                  Filtrlash <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. MAIN SECTION: FROSTED GLASS TABLE & SIDE PANELS        */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT / CENTER: EMPLOYEE STATUS TABLE WITH ADVANCED SEARCH */}
            <div className="lg:col-span-2 glass-panel rounded-3xl overflow-hidden flex flex-col border border-white/80">
              {/* Header with Title and Search */}
              <div className="p-4 sm:p-5 border-b border-sky-100/70 bg-gradient-to-b from-white/90 via-sky-50/40 to-white/70 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-xs shadow-sky-500/50"></span>
                      Xodimlar GPS Holati va Harakati
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Real-vaqtdagi geolokatsiya, joriy tuman va bosib o‘tilgan masofa
                    </p>
                  </div>

                  <Link
                    href="/live-map"
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 rounded-2xl bg-sky-500/10 hover:bg-sky-600 text-sky-700 hover:text-white transition-all shadow-xs hover:shadow-lg hover:shadow-sky-500/30 active:scale-95 group shrink-0 border border-sky-200/60"
                  >
                    <MapPin className="w-4 h-4 text-sky-600 group-hover:text-white transition-colors" />
                    <span>Jonli Xaritani Ochish</span>
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </div>

                {/* Search Bar & Filters Strip */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                  {/* Search input with frosted glass effect */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-sky-600/70 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Xodim ismi, lavozimi, tuman yoki telefon..."
                      className="w-full pl-9 pr-9 py-2.5 text-xs bg-white/85 hover:bg-white focus:bg-white border border-sky-200/80 focus:border-sky-500 rounded-2xl outline-none transition-all placeholder:text-slate-400 font-semibold focus:ring-2 focus:ring-sky-500/25 shadow-inner"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Department filter */}
                  <div className="sm:w-56 shrink-0">
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full py-2.5 px-3 text-xs bg-white/85 hover:bg-white border border-sky-200/80 focus:border-sky-500 rounded-2xl outline-none transition-all font-semibold text-slate-700 cursor-pointer focus:ring-2 focus:ring-sky-500/25 shadow-xs"
                    >
                      <option value="ALL">Barcha Bo‘limlar ({employees.length})</option>
                      {departmentsList.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept.length > 28 ? dept.substring(0, 26) + '...' : dept} (
                          {employees.filter((e) => e.department === dept).length})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Filter Tabs & Active status chip */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-sky-100/70 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setStatusFilter('ALL')}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                        statusFilter === 'ALL'
                          ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                          : 'bg-white/80 hover:bg-white text-slate-600 border border-sky-100'
                      }`}
                    >
                      Barchasi ({totalCount})
                    </button>
                    <button
                      onClick={() => setStatusFilter('WORKING')}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                        statusFilter === 'WORKING'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                          : 'bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 border border-emerald-200/60'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      Ishda ({workingCount})
                    </button>
                    <button
                      onClick={() => setStatusFilter('DELAYED')}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                        statusFilter === 'DELAYED'
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                          : 'bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 border border-amber-200/60'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      Kechikkan ({delayedCount})
                    </button>
                    <button
                      onClick={() => setStatusFilter('NOT_WORKING')}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                        statusFilter === 'NOT_WORKING'
                          ? 'bg-slate-700 text-white shadow-md shadow-slate-700/25'
                          : 'bg-white/80 hover:bg-white text-slate-600 border border-sky-100'
                      }`}
                    >
                      Ishda emas ({notWorkingCount})
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-500 font-semibold">
                    Topildi: <strong className="text-slate-900">{filteredEmployees.length}</strong> ta xodim
                  </span>
                </div>
              </div>

              {/* Table Data with Glass rows */}
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-sky-100/80 bg-sky-50/50 backdrop-blur-md text-sky-950 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Xodim</th>
                      <th className="py-3 px-4">Bo‘lim / Lavozim</th>
                      <th className="py-3 px-4">Holati</th>
                      <th className="py-3 px-4">Joriy Tuman</th>
                      <th className="py-3 px-4">Masofa</th>
                      <th className="py-3 px-4">Oxirgi Signal</th>
                      <th className="py-3 px-4 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-100/60">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <div className="max-w-xs mx-auto space-y-2">
                            <Users className="w-8 h-8 mx-auto text-sky-400" />
                            <p className="font-bold text-slate-700 text-sm">Hech qanday xodim topilmadi</p>
                            <p className="text-xs text-slate-500 font-medium">
                              Qidiruv parametrlarini o‘zgartiring yoki filtrlarni tozalang.
                            </p>
                            <button
                              onClick={() => {
                                setSearchQuery('');
                                setSelectedDepartment('ALL');
                                setStatusFilter('ALL');
                              }}
                              className="mt-2 text-xs font-bold text-sky-600 hover:text-sky-700 underline cursor-pointer"
                            >
                              Filtrlarni tozalash
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => {
                        const initials = emp.name
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase();

                        let statusBadge = (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-emerald-500/15 text-emerald-800 text-[11px] border border-emerald-300/60 shadow-2xs backdrop-blur-xs">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Ishda
                          </span>
                        );

                        if (
                          emp.status === 'DELAYED' ||
                          (emp.status === 'WORKING' &&
                            emp.lastUpdateAgoSeconds !== undefined &&
                            emp.lastUpdateAgoSeconds > 3600)
                        ) {
                          statusBadge = (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-amber-500/15 text-amber-800 text-[11px] border border-amber-300/60 shadow-2xs backdrop-blur-xs">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                              Kechikmoqda
                            </span>
                          );
                        } else if (emp.status === 'OFFLINE' || emp.status === 'NOT_WORKING') {
                          statusBadge = (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-slate-500/10 text-slate-600 text-[11px] border border-slate-200/80 shadow-2xs backdrop-blur-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Ishda emas
                            </span>
                          );
                        }

                        // Last signal time string
                        let signalText = '-';
                        let signalColor = 'text-slate-400';
                        if (emp.lastUpdateAgoSeconds !== undefined) {
                          if (emp.lastUpdateAgoSeconds < 60) {
                            signalText = `${emp.lastUpdateAgoSeconds}s avval`;
                            signalColor = 'text-emerald-700 font-bold';
                          } else if (emp.lastUpdateAgoSeconds < 3600) {
                            signalText = `${Math.floor(emp.lastUpdateAgoSeconds / 60)} daq avval`;
                            signalColor = 'text-sky-700 font-semibold';
                          } else {
                            signalText = `${Math.floor(emp.lastUpdateAgoSeconds / 3600)} soat avval`;
                            signalColor = 'text-amber-700 font-semibold';
                          }
                        }

                        return (
                          <tr
                            key={emp.employeeId}
                            className="group hover:bg-sky-100/50 transition-all duration-200 cursor-pointer"
                            onClick={() => setSelectedEmp(emp)}
                          >
                            {/* Employee column with avatar */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="relative shrink-0">
                                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:shadow-md group-hover:shadow-sky-500/25 transition-all">
                                    {initials || 'XP'}
                                  </div>
                                  {emp.status === 'WORKING' && (
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors text-xs truncate max-w-[200px] sm:max-w-[240px]">
                                    {emp.name}
                                  </div>
                                  <a
                                    href={`tel:${emp.phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[11px] text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1 hover:underline"
                                  >
                                    <Phone className="w-3 h-3 text-sky-600" />
                                    {emp.phone || '+998--'}
                                  </a>
                                </div>
                              </div>
                            </td>

                            {/* Department / Position */}
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-800 line-clamp-1 max-w-[180px]">
                                {emp.department}
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium line-clamp-1">{emp.position}</div>
                            </td>

                            {/* Status badge */}
                            <td className="py-3.5 px-4 whitespace-nowrap">{statusBadge}</td>

                            {/* Current District */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/80 text-slate-800 font-semibold text-[11px] border border-sky-100 group-hover:bg-white group-hover:shadow-xs transition-colors">
                                <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                <span>{emp.currentDistrict || 'Bandixon tumani'}</span>
                              </div>
                            </td>

                            {/* Distance */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="font-black text-slate-900 font-mono text-xs">
                                {emp.todayDistanceKm} km
                              </span>
                            </td>

                            {/* Last Signal */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className={`text-[11px] ${signalColor}`}>{signalText}</span>
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="inline-flex items-center gap-1.5">
                                <Link
                                  href={`/live-map?selected=${emp.employeeId}`}
                                  className="px-2.5 py-1.5 bg-sky-500/10 hover:bg-sky-600 text-sky-700 hover:text-white rounded-xl text-[11px] font-bold transition-all shadow-2xs hover:shadow-md flex items-center gap-1 border border-sky-200/60"
                                  title="Xaritada ko‘rish"
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>Xarita</span>
                                </Link>
                                <button
                                  onClick={() => setSelectedEmp(emp)}
                                  className="px-2.5 py-1.5 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 border border-sky-100 shadow-2xs"
                                  title="Batafsil ma'lumot"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT COLUMN: FROSTED GLASS ALERTS & QUICK ACTIONS */}
            <div className="space-y-6">
              {/* 1. Oxirgi Bildirishnomalar (Live Activity & Alerts) */}
              <div className="glass-panel rounded-3xl p-5 border border-white/80 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-sky-100/70">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-sky-500/10 text-sky-600 border border-sky-200/50">
                      <Bell className="w-4 h-4" />
                    </div>
                    Oxirgi Bildirishnomalar
                  </h3>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-300/60">
                    Jonli efir
                  </span>
                </div>

                <div className="space-y-3">
                  {workingCount > 0 ? (
                    employees
                      .filter((e) => e.status === 'WORKING')
                      .slice(0, 3)
                      .map((emp) => (
                        <div
                          key={emp.employeeId}
                          onClick={() => setSelectedEmp(emp)}
                          className="p-3.5 rounded-2xl bg-white/80 border border-emerald-200/70 hover:bg-emerald-50/80 transition-all cursor-pointer group shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              <p className="font-extrabold text-slate-900 text-xs group-hover:text-emerald-800 transition-colors">
                                {emp.name}
                              </p>
                            </div>
                            <span className="text-[10px] text-emerald-700 font-bold">Faol</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1 font-medium">
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            {emp.currentDistrict} hududida xizmatda ({emp.todayDistanceKm} km)
                          </p>
                        </div>
                      ))
                  ) : (
                    <div className="p-4 rounded-2xl bg-white/60 border border-sky-100/80 text-slate-500 text-center space-y-2">
                      <Bell className="w-6 h-6 mx-auto text-sky-400" />
                      <p className="font-bold text-slate-800 text-xs">Hozircha yangi bildirishnoma yo‘q</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        Xodimlar ish seansini boshlaganda yoki geozonadan chiqqanda ogohlantirishlar shu yerda real-vaqtda
                        ko‘rinadi.
                      </p>
                    </div>
                  )}

                  {/* System Status Banner */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-cyan-500/10 to-blue-500/10 border border-sky-200/60 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-extrabold text-sky-950">
                      <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                      <span>GPS Sun’iy Yo‘ldosh Aloqasi</span>
                    </div>
                    <p className="text-[11px] text-sky-800 font-medium">
                      Bandixon tumanida barcha koordinatalar uzluksiz sinxronizatsiya qilinmoqda.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Tezkor Harakatlar (Quick Navigation Panel - Dark Glass) */}
              <div className="glass-panel-dark relative overflow-hidden rounded-3xl text-white p-5 shadow-2xl border border-sky-400/35 space-y-4">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/20 rounded-full blur-2xl pointer-events-none"></div>

                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm tracking-wide text-sky-200 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-300" />
                    Tezkor Harakatlar
                  </h4>
                  <span className="text-[10px] text-sky-300 font-mono font-bold">Boshqaruv</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <Link
                    href="/live-map"
                    className="group flex items-center justify-between bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-bold p-3.5 rounded-2xl transition-all shadow-md shadow-sky-500/25 hover:shadow-sky-400/40 border border-white/20"
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4" />
                      <span>Jonli Xaritani Ochish</span>
                    </div>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/reports"
                    className="group flex items-center justify-between bg-white/10 hover:bg-white/20 text-sky-100 hover:text-white font-bold p-3.5 rounded-2xl transition-all border border-white/15 backdrop-blur-md"
                  >
                    <div className="flex items-center gap-2.5">
                      <Download className="w-4 h-4 text-emerald-300" />
                      <span>Bugungi Hisobot (CSV/Excel)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/employees"
                    className="group flex items-center justify-between bg-white/10 hover:bg-white/20 text-sky-100 hover:text-white font-bold p-3.5 rounded-2xl transition-all border border-white/15 backdrop-blur-md"
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-sky-300" />
                      <span>Xodimlar Ro‘yxatini Boshqarish</span>
                    </div>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/geofences"
                    className="group flex items-center justify-between bg-white/10 hover:bg-white/20 text-sky-100 hover:text-white font-bold p-3.5 rounded-2xl transition-all border border-white/15 backdrop-blur-md"
                  >
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 text-purple-300" />
                      <span>Geozonalar Xaritasi</span>
                    </div>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* 3. Tizim Diagnostikasi Mini-Karta */}
              <div className="glass-panel p-4 rounded-3xl border border-white/80 text-xs space-y-2.5">
                <div className="flex items-center justify-between text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                  <span>Tizim Ko‘rsatkichlari</span>
                  <span className="text-emerald-700 font-black flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 100% Onlayn
                  </span>
                </div>
                <div className="space-y-1.5 text-slate-700 text-[11px] font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500">GPS Signal qamrovi:</span>
                    <strong className="text-slate-900">100% Surxondaryo</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Server javob tezligi:</span>
                    <strong className="text-emerald-700 font-mono font-bold">&lt; 150 ms</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Autentifikatsiya:</span>
                    <strong className="text-slate-900">OneID &amp; Parol</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* 4. SLIDE-OVER DRAWER MODAL FOR SELECTED EMPLOYEE          */}
      {/* ========================================================= */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="relative h-full w-full max-w-md p-3 sm:p-4">
            <EmployeeDrawer employee={selectedEmp} onClose={() => setSelectedEmp(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
