'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Edit2,
  Power,
  KeyRound,
  MapPin,
  X,
  Phone,
  Mail,
  Building2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Employee } from '@repo/types';
import Link from 'next/link';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    employeeCode: '',
    department: 'Monitoring Bo‘limi',
    position: 'Mutaxassis',
    workingHoursStart: '08:00',
    workingHoursEnd: '17:00',
    password: 'password123',
  });

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (Array.isArray(data)) {
        setEmployees(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({
          name: '',
          phone: '',
          email: '',
          employeeCode: '',
          department: 'Monitoring Bo‘limi',
          position: 'Mutaxassis',
          workingHoursStart: '08:00',
          workingHoursEnd: '17:00',
          password: 'password123',
        });
        fetchEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTracking = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTrackingEnabled: !currentStatus }),
      });
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = employees.filter(
    (emp) =>
      emp.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeCode?.toLowerCase().includes(search.toLowerCase()) ||
      emp.department?.toLowerCase().includes(search.toLowerCase()) ||
      emp.position?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen relative text-slate-900">
      {/* Ambient background light orbs */}
      <div className="fixed top-12 right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-sky-400/25 via-cyan-300/20 to-blue-500/10 blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="fixed bottom-16 left-60 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-teal-300/20 via-sky-300/20 to-indigo-400/15 blur-3xl pointer-events-none -z-10" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <Header title="Xodimlar Boshqaruvi" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full relative z-10">
          {/* Header Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-sky-600/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Xodim ismi, kodi yoki bo‘limi bo‘yicha izlash..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-white/85 hover:bg-white focus:bg-white border border-sky-200/80 focus:border-sky-500 rounded-2xl outline-none transition-all placeholder:text-slate-400 font-semibold focus:ring-2 focus:ring-sky-500/25 shadow-inner"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="group bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-bold text-xs px-5 py-2.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30 hover:shadow-sky-400/50 transition-all active:scale-95 border border-white/20 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>Yangi Xodim Qo‘shish</span>
            </button>
          </div>

          {/* Employee Table in Frosted Glass Container */}
          <div className="glass-panel rounded-3xl overflow-hidden border border-white/80 shadow-xl">
            <div className="p-4 sm:p-5 border-b border-sky-100/70 bg-gradient-to-b from-white/90 via-sky-50/40 to-white/70 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-xs shadow-sky-500/50"></span>
                  Tizim Xodimlari Ro‘yxati
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Barcha ro‘yxatdan o‘tgan xodimlar, lavozimlar va GPS nazorati ruxsatnomalari
                </p>
              </div>
              <span className="text-xs font-bold text-sky-800 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-200/60">
                Jami: {employees.length} nafar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-sky-100/80 bg-sky-50/50 backdrop-blur-md text-sky-950 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Xodim kodi & Ismi</th>
                    <th className="py-3.5 px-4">Bo‘lim & Lavozim</th>
                    <th className="py-3.5 px-4">Telefon & Email</th>
                    <th className="py-3.5 px-4">Ish Vaqti Rejimi</th>
                    <th className="py-3.5 px-4">GPS Nazorati Ruxsati</th>
                    <th className="py-3.5 px-4 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100/60">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto text-sky-400 mb-2" />
                        <p className="font-bold text-slate-700 text-sm">Xodim topilmadi</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((emp) => {
                      const initials = (emp.user?.name || '')
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase();

                      return (
                        <tr key={emp.id} className="group hover:bg-sky-100/50 transition-all duration-150">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:shadow-md transition-all">
                                {initials || 'XP'}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors">
                                  {emp.user?.name}
                                </div>
                                <div className="text-[10px] text-sky-700 font-bold tracking-wide">
                                  {emp.employeeCode}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 line-clamp-1 max-w-[200px]">
                              {emp.department}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">{emp.position}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <a
                              href={`tel:${emp.user?.phone}`}
                              className="text-slate-800 font-bold hover:text-sky-600 flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3 text-sky-500" />
                              {emp.user?.phone}
                            </a>
                            <div className="text-[10px] text-slate-500 font-medium">{emp.user?.email}</div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 text-slate-800 bg-white/80 px-2.5 py-1 rounded-xl font-bold text-[11px] border border-sky-100 shadow-2xs">
                              <Clock className="w-3 h-3 text-sky-600" />
                              {emp.workingHoursStart} - {emp.workingHoursEnd}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleTracking(emp.id, emp.isTrackingEnabled)}
                              className={`px-3 py-1 rounded-full font-bold text-[10px] flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer ${
                                emp.isTrackingEnabled
                                  ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-300/60 hover:bg-emerald-500/25'
                                  : 'bg-rose-500/15 text-rose-800 border border-rose-300/60 hover:bg-rose-500/25'
                              }`}
                              title="Bo'lim boshlig'i ushbu xodim uchun GPS kuzatuv ruxsatini yoqishi yoki o'chirishi mumkin"
                            >
                              <Power className="w-3 h-3" />
                              {emp.isTrackingEnabled ? 'Ruxsat Yoqilgan' : 'Ruxsat O‘chirilgan'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <Link
                              href={`/live-map?selected=${emp.id}`}
                              className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-600 text-sky-700 hover:text-white rounded-xl text-[11px] font-bold transition-all shadow-2xs hover:shadow-md inline-flex items-center gap-1 border border-sky-200/60"
                            >
                              <MapPin className="w-3.5 h-3.5" /> Xaritada
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal for adding employee in Frosted Glass */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-white/90">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <h3 className="text-base font-extrabold text-slate-900">Yangi Xodim Ro‘yxatdan O‘tkazish</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-sky-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">To‘liq Ism</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masalan: Jasur Rahimov"
                  className="w-full p-2.5 bg-white/80 border border-sky-200/80 rounded-2xl outline-none focus:border-sky-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Telefon</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+998901234567"
                    className="w-full p-2.5 bg-white/80 border border-sky-200/80 rounded-2xl outline-none focus:border-sky-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Xodim Kodi</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    placeholder="EMP-103"
                    className="w-full p-2.5 bg-white/80 border border-sky-200/80 rounded-2xl outline-none focus:border-sky-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email / Login</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jasur@bandixon.gov.uz"
                  className="w-full p-2.5 bg-white/80 border border-sky-200/80 rounded-2xl outline-none focus:border-sky-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Bo‘lim</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2.5 bg-white/80 border border-sky-200/80 rounded-2xl outline-none focus:border-sky-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Lavozim</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full p-2.5 bg-white/80 border border-sky-200/80 rounded-2xl outline-none focus:border-sky-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Ish Boshlanishi</label>
                  <input
                    type="text"
                    value={formData.workingHoursStart}
                    onChange={(e) => setFormData({ ...formData, workingHoursStart: e.target.value })}
                    className="w-full p-2.5 bg-white/80 border border-sky-200/80 rounded-2xl outline-none focus:border-sky-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Ish Yakunlanishi</label>
                  <input
                    type="text"
                    value={formData.workingHoursEnd}
                    onChange={(e) => setFormData({ ...formData, workingHoursEnd: e.target.value })}
                    className="w-full p-2.5 bg-white/80 border border-sky-200/80 rounded-2xl outline-none focus:border-sky-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Parol</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-2.5 bg-white/80 border border-sky-200/80 rounded-2xl outline-none focus:border-sky-500 font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-sky-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 rounded-2xl font-bold border border-slate-200 cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white rounded-2xl font-bold shadow-md shadow-sky-500/25 active:scale-95 cursor-pointer"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
