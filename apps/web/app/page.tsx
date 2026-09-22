'use client';

import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { EmployeeLiveSummary } from '@repo/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmployeeDashboardView } from '@/components/EmployeeDashboardView';

export default function DashboardPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeLiveSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);

  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');

  const fetchAuth = async () => {
    const token = localStorage.getItem('auth_token');
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
      setLastRefreshedAt(new Date().toLocaleTimeString('uz-UZ'));
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

  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');

  if (currentUser && currentUser.role === 'EMPLOYEE') {
    return <EmployeeDashboardView user={currentUser} employee={currentEmployee} />;
  }

  const departmentsList = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

  const filteredEmployees = employees.filter((e) => {
    if (selectedDepartment === 'ALL') return true;
    return e.department === selectedDepartment;
  });

  const totalCount = filteredEmployees.length;
  const workingCount = filteredEmployees.filter((e) => e.status === 'WORKING').length;
  const delayedCount = filteredEmployees.filter(
    (e) => e.status === 'WORKING' && e.lastUpdateAgoSeconds !== undefined && e.lastUpdateAgoSeconds > 3600
  ).length;
  const offlineCount = filteredEmployees.filter((e) => e.status === 'OFFLINE').length;
  const notWorkingCount = filteredEmployees.filter((e) => e.status === 'NOT_WORKING').length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <Header title="Bosh sahifa (Dashboard)" />

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Info Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-sky-900 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/20 text-sky-300 rounded-full text-xs font-semibold mb-2 border border-sky-400/30">
                <Radio className="w-3.5 h-3.5 animate-pulse text-sky-400" />
                Jonli GPS Nazorat Tizimi
              </div>
              <h1 className="text-2xl font-bold">Bandixon Tumani GPS Nazorat Markazi</h1>
              <p className="text-slate-300 text-xs mt-1">
                Surxondaryo viloyati bo‘yicha barcha xodimlarning ish vaqti va harakatlanish geolokatsiyasi
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <button
                onClick={fetchSummary}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all shadow-sm cursor-pointer"
                title="Ma'lumotlarni real-vaqtda qayta yangilash"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Yangilash
              </button>
              {lastRefreshedAt && (
                <span className="text-[10px] text-sky-300 font-medium">
                  So‘nggi yangilanish: {lastRefreshedAt}
                </span>
              )}
            </div>
          </div>

          {/* Stats Counter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Employees */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Jami Xodimlar</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalCount} kishi</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Bo‘lim shtat ro‘yxati</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* 2. Currently Working */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Hozir Ishda (Faol)</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">{workingCount} kishi</h3>
                <p className="text-[11px] text-emerald-700 mt-0.5 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ish seansi faol
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
            </div>

            {/* 3. Delayed / Offline */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Kechikkan / Offline</p>
                <h3 className="text-2xl font-bold text-amber-600 mt-1">{delayedCount + offlineCount} kishi</h3>
                <p className="text-[11px] text-amber-700 mt-0.5 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Signal kechikkan
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            {/* 4. Not Working */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Ishda Emas</p>
                <h3 className="text-2xl font-bold text-slate-600 mt-1">{notWorkingCount} kishi</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Seans boshlanmagan</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Main Activity & Employee Status Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Employee Status Table */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Xodimlar GPS Holati</h3>
                  <p className="text-xs text-slate-500">Real-vaqtdagi joylashuv va faollik</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  >
                    <option value="ALL">Barcha Bo‘limlar ({employees.length})</option>
                    {departmentsList.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept} ({employees.filter((e) => e.department === dept).length})
                      </option>
                    ))}
                  </select>
                  <Link
                    href="/live-map"
                    className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 shrink-0"
                  >
                    <MapPin className="w-3.5 h-3.5" /> Xaritada
                  </Link>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-600 font-semibold">
                      <th className="p-3">Xodim</th>
                      <th className="p-3">Bo‘lim / Lavozim</th>
                      <th className="p-3">Holati</th>
                      <th className="p-3">Joriy Tuman</th>
                      <th className="p-3">Masofa</th>
                      <th className="p-3">Oxirgi Signal</th>
                      <th className="p-3 text-right">Harakat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmployees.map((emp) => {
                      let badge = (
                        <span className="px-2 py-0.5 rounded-md font-semibold bg-emerald-100 text-emerald-800 text-[11px]">
                          Ishda
                        </span>
                      );
                      if (emp.status === 'DELAYED') {
                        badge = (
                          <span className="px-2 py-0.5 rounded-md font-semibold bg-amber-100 text-amber-800 text-[11px]">
                            Kechikmoqda
                          </span>
                        );
                      } else if (emp.status === 'OFFLINE' || emp.status === 'NOT_WORKING') {
                        badge = (
                          <span className="px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-600 text-[11px]">
                            Ishda emas
                          </span>
                        );
                      }

                      return (
                        <tr key={emp.employeeId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-slate-900">{emp.name}</div>
                            <div className="text-[10px] text-sky-600 font-medium">{emp.phone || '+998912345678'}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-slate-800">{emp.department}</div>
                            <div className="text-[10px] text-slate-500">{emp.position}</div>
                          </td>
                          <td className="p-3">{badge}</td>
                          <td className="p-3 font-medium text-slate-700">{emp.currentDistrict}</td>
                          <td className="p-3 font-semibold text-slate-900">{emp.todayDistanceKm} km</td>
                          <td className="p-3 text-slate-500 text-[11px]">
                            {emp.lastUpdateAgoSeconds !== undefined ? `${emp.lastUpdateAgoSeconds}s avval` : '-'}
                          </td>
                          <td className="p-3 text-right">
                            <Link
                              href={`/live-map?selected=${emp.employeeId}`}
                              className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded text-[11px] font-semibold transition-colors"
                            >
                              Xaritada
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Side Activity & Alerts Panel */}
            <div className="space-y-4">
              {/* Recent Alerts Card */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Bell className="w-4 h-4 text-sky-600" />
                  Oxirgi Bildirishnomalar
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 text-center space-y-1">
                    <Bell className="w-5 h-5 mx-auto text-slate-400" />
                    <p className="font-semibold text-slate-700">Tizimda yangi bildirishnoma yo‘q</p>
                    <p className="text-[11px] text-slate-400">
                      Geozonaga kirish/chiqish va tuman almashtirish hodisalari bu yerda real-vaqtda ko‘rinadi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Card */}
              <div className="bg-sky-950 text-white p-5 rounded-xl space-y-3 shadow-md">
                <h4 className="font-bold text-sm text-sky-300">Tezkor Harakatlar</h4>
                <div className="space-y-2 text-xs">
                  <Link
                    href="/live-map"
                    className="block w-full text-center bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 rounded-lg transition-colors"
                  >
                    Jonli Xaritani Ochish
                  </Link>
                  <Link
                    href="/reports"
                    className="block w-full text-center bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 rounded-lg transition-colors"
                  >
                    Bugungi Hisobotni Yuklab Olish (CSV)
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
