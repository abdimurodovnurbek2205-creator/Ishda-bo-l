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
      emp.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Xodimlar Boshqaruvi" />

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Xodim ismi, kodi yoki bo‘limi bo‘yicha izlash..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Yangi Xodim Qo‘shish
            </button>
          </div>

          {/* Employee Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-600 font-semibold">
                    <th className="p-3">Xodim kodi & Ismi</th>
                    <th className="p-3">Bo‘lim & Lavozim</th>
                    <th className="p-3">Telefon & Email</th>
                    <th className="p-3">Ish Vaqti Rejimi</th>
                    <th className="p-3">GPS Nazorati Ruxsati</th>
                    <th className="p-3 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{emp.user?.name}</div>
                        <div className="text-[10px] text-sky-600 font-semibold">{emp.employeeCode}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-800">{emp.department}</div>
                        <div className="text-[10px] text-slate-500">{emp.position}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-800 font-mono">{emp.user?.phone}</div>
                        <div className="text-[10px] text-slate-500">{emp.user?.email}</div>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {emp.workingHoursStart} - {emp.workingHoursEnd}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => toggleTracking(emp.id, emp.isTrackingEnabled)}
                          className={`px-2.5 py-1 rounded-full font-semibold text-[10px] flex items-center gap-1.5 transition-colors ${
                            emp.isTrackingEnabled
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                          title="Bo'lim boshlig'i ushbu xodim uchun GPS kuzatuv ruxsatini yoqishi yoki o'chirishi mumkin"
                        >
                          <Power className="w-3 h-3" />
                          {emp.isTrackingEnabled ? 'Ruxsat Yoqilgan' : 'Ruxsat O‘chirilgan'}
                        </button>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <Link
                          href={`/live-map?selected=${emp.id}`}
                          className="px-2 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded text-[11px] font-semibold inline-flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" /> Xaritada
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal for adding employee */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Yangi Xodim Ro‘yxatdan O‘tkazish</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">To‘liq Ism</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masalan: Jasur Rahimov"
                  className="w-full p-2 border border-slate-200 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Telefon</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+998901234567"
                    className="w-full p-2 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Xodim Kodi</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    placeholder="EMP-103"
                    className="w-full p-2 border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Email / Login</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jasur@bandixon.gov.uz"
                  className="w-full p-2 border border-slate-200 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Bo‘lim</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Lavozim</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Ish Boshlanishi</label>
                  <input
                    type="text"
                    value={formData.workingHoursStart}
                    onChange={(e) => setFormData({ ...formData, workingHoursStart: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Ish Yakunlanishi</label>
                  <input
                    type="text"
                    value={formData.workingHoursEnd}
                    onChange={(e) => setFormData({ ...formData, workingHoursEnd: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Parol</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-md"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-md font-semibold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 text-white rounded-md font-semibold hover:bg-sky-700"
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
