'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DailyTimesheetRecord, AttendanceStatus } from '@repo/types';
import {
  CalendarCheck,
  Calendar,
  Download,
  Save,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  UserCheck,
  UserX,
  Briefcase,
  HeartPulse,
  Coffee,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  Check,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Printer,
} from 'lucide-react';

const STATUS_CONFIG: Record<
  AttendanceStatus,
  {
    label: string;
    shortLabel: string;
    bg: string;
    border: string;
    text: string;
    dotBg: string;
    icon: any;
  }
> = {
  PRESENT: {
    label: 'Ishga kelgan',
    shortLabel: 'Kelgan',
    bg: 'bg-emerald-50 text-emerald-800',
    border: 'border-emerald-300',
    text: 'text-emerald-700',
    dotBg: 'bg-emerald-500',
    icon: UserCheck,
  },
  LATE: {
    label: 'Kechikib kelgan',
    shortLabel: 'Kechikkan',
    bg: 'bg-amber-50 text-amber-800',
    border: 'border-amber-300',
    text: 'text-amber-700',
    dotBg: 'bg-amber-500',
    icon: Clock,
  },
  EXCUSED: {
    label: 'Javob olgan (Ruxsat)',
    shortLabel: 'Javob olgan',
    bg: 'bg-sky-50 text-sky-800',
    border: 'border-sky-300',
    text: 'text-sky-700',
    dotBg: 'bg-sky-500',
    icon: HelpCircle,
  },
  ABSENT: {
    label: 'Sababsiz kelmagan',
    shortLabel: 'Sababsiz',
    bg: 'bg-rose-50 text-rose-800',
    border: 'border-rose-300',
    text: 'text-rose-700',
    dotBg: 'bg-rose-500',
    icon: UserX,
  },
  FIELD_WORK: {
    label: 'Xizmat safari (Dalada)',
    shortLabel: 'Dalada',
    bg: 'bg-teal-50 text-teal-800',
    border: 'border-teal-300',
    text: 'text-teal-700',
    dotBg: 'bg-teal-500',
    icon: Briefcase,
  },
  SICK_LEAVE: {
    label: 'Kasallik varaqasi',
    shortLabel: 'Kasal',
    bg: 'bg-purple-50 text-purple-800',
    border: 'border-purple-300',
    text: 'text-purple-700',
    dotBg: 'bg-purple-500',
    icon: HeartPulse,
  },
  DAY_OFF: {
    label: 'Dam olish kuni',
    shortLabel: 'Dam olish',
    bg: 'bg-slate-100 text-slate-700',
    border: 'border-slate-300',
    text: 'text-slate-600',
    dotBg: 'bg-slate-400',
    icon: Coffee,
  },
};

const QUICK_REASONS = [
  'Shaxsiy sabab bilan javob oldi',
  'Tish shifokoriga ruxsat so‘radi',
  'Bektepa MFY dalasiga nazoratga bordi',
  'Chorvador MFY fitonazorat postida',
  'Limonchilik issiqxonasida tekshiruvda',
  'Yo‘lda transport sababli kechikdi',
  'Tuman hokimiyati yig‘ilishiga chaqirildi',
  'Sababsiz ishga kelmadi',
];

export default function TimesheetPage() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [records, setRecords] = useState<DailyTimesheetRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [activeHourlyModal, setActiveHourlyModal] = useState<DailyTimesheetRecord | null>(null);
  const [hourlyInput, setHourlyInput] = useState<string>('');

  // Fetch timesheet for selected date
  const fetchTimesheet = async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/timesheet?date=${dateStr}&t=${Date.now()}`);
      const data = await res.json();
      if (data.records) {
        setRecords(data.records);
      }
    } catch (err) {
      console.error('Failed to load timesheet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheet(selectedDate);
  }, [selectedDate]);

  // Navigate dates
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Update a single field in the local state
  const handleRecordChange = (
    employeeId: string,
    field: keyof DailyTimesheetRecord,
    value: any
  ) => {
    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.employeeId !== employeeId) return rec;

        const updated = { ...rec, [field]: value };

        // Automatically recalculate hours if checkIn or checkOut changes
        if (field === 'checkInTime' || field === 'checkOutTime') {
          const inVal = field === 'checkInTime' ? value : rec.checkInTime;
          const outVal = field === 'checkOutTime' ? value : rec.checkOutTime;

          if (inVal && outVal && inVal.includes(':') && outVal.includes(':')) {
            const [inH, inM] = inVal.split(':').map(Number);
            const [outH, outM] = outVal.split(':').map(Number);
            const totalInMinutes = inH * 60 + inM;
            const totalOutMinutes = outH * 60 + outM;

            if (totalOutMinutes > totalInMinutes) {
              const diffHours = (totalOutMinutes - totalInMinutes - 60) / 60; // minus 1h lunch
              updated.workHours = Math.max(0, Math.round(diffHours * 10) / 10);
            }
          }
        }

        // Auto update status note if late
        if (field === 'status') {
          if (value === 'LATE' && !updated.reason) {
            updated.reason = 'Kechikib kelgan';
          } else if (value === 'EXCUSED' && !updated.reason) {
            updated.reason = 'Ruxsat so‘rab javob oldi';
          } else if (value === 'ABSENT' && !updated.reason) {
            updated.reason = 'Sababsiz ishga kelmadi';
          } else if (value === 'FIELD_WORK' && !updated.reason) {
            updated.reason = 'Dala nazorati va ko‘rikka chiqqan';
          } else if (value === 'PRESENT' && updated.reason === 'Sababsiz ishga kelmadi') {
            updated.reason = '';
          }
        }

        return updated;
      })
    );
  };

  // Mark all as present 09:00 - 18:00
  const handleMarkAllPresent = () => {
    setRecords((prev) =>
      prev.map((rec) => ({
        ...rec,
        status: 'PRESENT',
        checkInTime: '09:00',
        checkOutTime: '18:00',
        workHours: 8.0,
        reason: '',
      }))
    );
    setStatusMessage('Barcha xodimlar "Ishda" (09:00 - 18:00) deb belgilandi.');
    setTimeout(() => setStatusMessage(''), 4000);
  };

  // Save all to backend
  const handleSaveAll = async () => {
    setSaving(true);
    setStatusMessage('');
    try {
      const res = await fetch('/api/timesheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage('✅ Kunlik tabel muvaffaqiyatli saqlandi!');
        setTimeout(() => setStatusMessage(''), 4000);
      } else {
        setStatusMessage('❌ Saqlashda xatolik yuz berdi.');
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('❌ Server bilan aloqa uzildi.');
    } finally {
      setSaving(false);
    }
  };

  // Hourly modal save
  const handleOpenHourlyModal = (record: DailyTimesheetRecord) => {
    setActiveHourlyModal(record);
    setHourlyInput(record.hourlyLog || '');
  };

  const handleSaveHourlyLog = () => {
    if (!activeHourlyModal) return;
    handleRecordChange(activeHourlyModal.employeeId, 'hourlyLog', hourlyInput);
    setActiveHourlyModal(null);
  };

  // Summary counts
  const stats = useMemo(() => {
    return {
      total: records.length,
      present: records.filter((r) => r.status === 'PRESENT').length,
      late: records.filter((r) => r.status === 'LATE').length,
      excused: records.filter((r) => r.status === 'EXCUSED').length,
      absent: records.filter((r) => r.status === 'ABSENT').length,
      fieldWork: records.filter((r) => r.status === 'FIELD_WORK').length,
      sick: records.filter((r) => r.status === 'SICK_LEAVE').length,
    };
  }, [records]);

  // Uzbek formatted display date
  const displayDateUz = useMemo(() => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return selectedDate;
  }, [selectedDate]);

  return (
    <div className="flex min-h-screen relative text-slate-900 bg-sky-50/20">
      {/* Ambient background glows */}
      <div className="fixed top-12 right-20 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-sky-400/20 via-cyan-300/15 to-blue-500/10 blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-16 left-60 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-teal-300/15 via-sky-300/15 to-indigo-400/10 blur-3xl pointer-events-none -z-10" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <Header title="Kunlik Tabel va Davomat Jurnali" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full relative z-10">
          {/* ========================================================= */}
          {/* 1. TOP CONTROL BAR (DATE + ACTIONS)                      */}
          {/* ========================================================= */}
          <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-white/80 shadow-xl flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl">
            {/* Date Navigator */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevDay}
                className="p-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 hover:text-sky-600 border border-slate-200/80 shadow-2xs transition-all cursor-pointer active:scale-95"
                title="Oldingi kun"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/90 border border-sky-200/80 shadow-2xs">
                <Calendar className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-bold text-slate-600">Sana:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-extrabold text-xs text-slate-900 focus:outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={handleNextDay}
                className="p-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 hover:text-sky-600 border border-slate-200/80 shadow-2xs transition-all cursor-pointer active:scale-95"
                title="Keyingi kun"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleToday}
                className="px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 text-xs font-bold border border-sky-200/80 transition-all cursor-pointer active:scale-95"
              >
                Bugun
              </button>
            </div>

            {/* Action Buttons: Mark all, Save, Excel Download */}
            <div className="flex items-center flex-wrap gap-2.5">
              <button
                onClick={handleMarkAllPresent}
                className="px-3.5 py-2 rounded-2xl bg-white/85 hover:bg-white text-slate-700 hover:text-emerald-700 text-xs font-extrabold border border-slate-200/80 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                title="Barcha xodimlarni ishga kelgan (09:00 - 18:00) deb to'ldirish"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Barchasi Ishda</span>
              </button>

              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-extrabold shadow-md shadow-sky-600/25 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saqlanmoqda...' : 'Tabelni Saqlash'}</span>
              </button>

              <a
                href={`/api/timesheet/export?date=${selectedDate}&format=xls`}
                download
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                title="Rasmiy Excel formatida yuklab olish"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excelga Yuklash</span>
              </a>

              <a
                href={`/api/timesheet/export?date=${selectedDate}&format=csv`}
                download
                className="px-3 py-2 rounded-2xl bg-white/80 hover:bg-white text-slate-700 text-xs font-bold border border-slate-200/80 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                title="CSV formatida yuklab olish"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>CSV</span>
              </a>
            </div>
          </div>

          {/* Status feedback message */}
          {statusMessage && (
            <div className="p-3.5 rounded-2xl glass-panel border border-sky-300 bg-sky-50/80 text-sky-900 font-bold text-xs flex items-center gap-2 animate-fade-in shadow-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. SUMMARY KPI STATS CARDS                                */}
          {/* ========================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="glass-panel p-3.5 rounded-2xl border border-white/80 shadow-md">
              <p className="text-[11px] font-bold text-slate-500">Jami xodimlar</p>
              <p className="text-xl font-black text-slate-900 mt-1">{stats.total} nafar</p>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                <span>Bandixon bo‘limi</span>
              </div>
            </div>

            <div className="glass-panel p-3.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/30 shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-emerald-800">Ishda / Kelgan</p>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <p className="text-xl font-black text-emerald-700 mt-1">{stats.present}</p>
              <p className="text-[10px] text-emerald-600/80 mt-1">O‘z vaqtida kelgan</p>
            </div>

            <div className="glass-panel p-3.5 rounded-2xl border border-amber-200/80 bg-amber-50/30 shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-amber-800">Kechikkan</p>
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              </div>
              <p className="text-xl font-black text-amber-700 mt-1">{stats.late}</p>
              <p className="text-[10px] text-amber-600/80 mt-1">09:00 dan keyin</p>
            </div>

            <div className="glass-panel p-3.5 rounded-2xl border border-sky-200/80 bg-sky-50/30 shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-sky-800">Javob olgan</p>
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              </div>
              <p className="text-xl font-black text-sky-700 mt-1">{stats.excused}</p>
              <p className="text-[10px] text-sky-600/80 mt-1">Ruxsat so‘ragan</p>
            </div>

            <div className="glass-panel p-3.5 rounded-2xl border border-rose-200/80 bg-rose-50/30 shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-rose-800">Sababsiz kelmagan</p>
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              </div>
              <p className="text-xl font-black text-rose-700 mt-1">{stats.absent}</p>
              <p className="text-[10px] text-rose-600/80 mt-1">Qayd etilmagan</p>
            </div>

            <div className="glass-panel p-3.5 rounded-2xl border border-teal-200/80 bg-teal-50/30 shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-teal-800">Xizmat safari</p>
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              </div>
              <p className="text-xl font-black text-teal-700 mt-1">{stats.fieldWork}</p>
              <p className="text-[10px] text-teal-600/80 mt-1">Dala nazoratida</p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. MAIN INTERACTIVE TIMESHEET TABLE                       */}
          {/* ========================================================= */}
          <div className="glass-panel rounded-3xl overflow-hidden border border-white/80 shadow-2xl backdrop-blur-xl">
            {/* Header info */}
            <div className="p-4 sm:p-5 border-b border-sky-100/70 bg-gradient-to-r from-white/95 via-sky-50/50 to-white/90 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-sky-600" />
                  <span>Bandixon Bo‘limi Xodimlari Davomati ({displayDateUz} yil)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Soat nechida kelganini yozing, holatini tanlang va kerakli sabab / soatbay izohlarini kiriting
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white/80 px-3 py-1 rounded-xl border border-slate-200/60 shadow-2xs">
                <span>Mas'ul:</span>
                <span className="text-sky-800 font-extrabold">Bo‘riyev Shuxrat X.</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-sky-100/80 bg-sky-50/40 text-slate-700 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 w-10 text-center">T/r</th>
                    <th className="py-3 px-3 min-w-[200px]">Xodim F.I.Sh</th>
                    <th className="py-3 px-3 min-w-[150px]">Holati (Davomat)</th>
                    <th className="py-3 px-3 min-w-[100px]">Kelgan vaqti</th>
                    <th className="py-3 px-3 min-w-[100px]">Ketgan vaqti</th>
                    <th className="py-3 px-3 w-24 text-center">Soat</th>
                    <th className="py-3 px-3 min-w-[260px]">Sababi / Soatma-soat izohi</th>
                    <th className="py-3 px-3 w-16 text-center">Tafsilot</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-100/50 bg-white/70">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 font-bold text-xs">
                        Tabel ma'lumotlari yuklanmoqda...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 font-bold text-xs">
                        Xodimlar ro‘yxati topilmadi.
                      </td>
                    </tr>
                  ) : (
                    records.map((rec, idx) => {
                      const cfg = STATUS_CONFIG[rec.status] || STATUS_CONFIG.PRESENT;
                      const IconComponent = cfg.icon;

                      return (
                        <tr
                          key={rec.id}
                          className="hover:bg-sky-50/50 transition-colors group"
                        >
                          {/* Row Index */}
                          <td className="py-3 px-3 text-center font-bold text-slate-400 text-xs">
                            {idx + 1}
                          </td>

                          {/* Employee Info */}
                          <td className="py-3 px-3">
                            <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                              {rec.employeeName}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-medium">
                              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 font-bold">
                                {rec.employeeCode}
                              </span>
                              <span className="truncate max-w-[200px]">{rec.position}</span>
                            </div>
                          </td>

                          {/* Attendance Status Selector */}
                          <td className="py-3 px-3">
                            <select
                              value={rec.status}
                              onChange={(e) =>
                                handleRecordChange(rec.employeeId, 'status', e.target.value as AttendanceStatus)
                              }
                              className={`w-full text-xs font-bold rounded-xl px-2.5 py-1.5 border shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer ${cfg.bg} ${cfg.border}`}
                            >
                              <option value="PRESENT">🟢 Ishga kelgan</option>
                              <option value="LATE">🟡 Kechikib kelgan</option>
                              <option value="EXCUSED">🔵 Javob olgan (Ruxsat)</option>
                              <option value="ABSENT">🔴 Sababsiz kelmagan</option>
                              <option value="FIELD_WORK">🌾 Xizmat safari (Dalada)</option>
                              <option value="SICK_LEAVE">🟣 Kasallik varaqasi</option>
                              <option value="DAY_OFF">⚪ Dam olish kuni</option>
                            </select>
                          </td>

                          {/* Check-In Time */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="time"
                                value={rec.checkInTime || ''}
                                onChange={(e) =>
                                  handleRecordChange(rec.employeeId, 'checkInTime', e.target.value)
                                }
                                disabled={rec.status === 'ABSENT' || rec.status === 'DAY_OFF'}
                                className="w-24 bg-white/90 border border-slate-200 rounded-xl px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs disabled:bg-slate-100 disabled:text-slate-400"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const nowTime = new Date().toLocaleTimeString('uz-UZ', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  });
                                  handleRecordChange(rec.employeeId, 'checkInTime', nowTime);
                                }}
                                className="text-[10px] text-sky-600 hover:text-sky-800 font-bold bg-sky-50 px-1.5 py-1 rounded-lg border border-sky-200 transition-all cursor-pointer"
                                title="Hozirgi vaqtni qo‘yish"
                              >
                                Hozir
                              </button>
                            </div>
                          </td>

                          {/* Check-Out Time */}
                          <td className="py-3 px-3">
                            <input
                              type="time"
                              value={rec.checkOutTime || ''}
                              onChange={(e) =>
                                handleRecordChange(rec.employeeId, 'checkOutTime', e.target.value)
                              }
                              disabled={rec.status === 'ABSENT' || rec.status === 'DAY_OFF'}
                              className="w-24 bg-white/90 border border-slate-200 rounded-xl px-2 py-1 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs disabled:bg-slate-100 disabled:text-slate-400"
                            />
                          </td>

                          {/* Work Hours */}
                          <td className="py-3 px-3 text-center">
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="24"
                              value={rec.workHours}
                              onChange={(e) =>
                                handleRecordChange(
                                  rec.employeeId,
                                  'workHours',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-16 text-center bg-white/90 border border-slate-200 rounded-xl py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                            />
                          </td>

                          {/* Reason / Hourly Note Text Input */}
                          <td className="py-3 px-3">
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={rec.reason || ''}
                                placeholder="Kelmaganlik, kechikish yoki javob olish sababi..."
                                onChange={(e) =>
                                  handleRecordChange(rec.employeeId, 'reason', e.target.value)
                                }
                                className="w-full bg-white/90 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs font-medium"
                              />

                              {/* Quick reason badge helper if empty */}
                              {!rec.reason && rec.status !== 'PRESENT' && (
                                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                                  {QUICK_REASONS.slice(0, 3).map((qr, i) => (
                                    <button
                                      key={i}
                                      onClick={() => handleRecordChange(rec.employeeId, 'reason', qr)}
                                      className="text-[10px] text-slate-500 hover:text-sky-700 bg-slate-100 hover:bg-sky-50 px-2 py-0.5 rounded-full border border-slate-200 transition-all cursor-pointer whitespace-nowrap"
                                    >
                                      + {qr.split(' ')[0]}...
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Hourly Log Button */}
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleOpenHourlyModal(rec)}
                              className={`p-2 rounded-xl transition-all border cursor-pointer active:scale-95 ${
                                rec.hourlyLog
                                  ? 'bg-sky-50 text-sky-700 border-sky-300 shadow-xs'
                                  : 'bg-white/80 text-slate-400 hover:text-slate-700 border-slate-200'
                              }`}
                              title="Soatma-soat yozuvlar va izohlarni ko‘rish / tahrirlash"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Controls Bar */}
            <div className="p-4 bg-gradient-to-r from-sky-50/50 via-white to-sky-50/50 border-t border-sky-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span className="font-bold text-slate-900">Eslatma:</span>
                <span>
                  Barcha kiritilgan vaqtlar va sabablar «Tabelni Saqlash» tugmasi bosilganda serverda doimiy saqlanadi va Excelga to‘liq yuklanadi.
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-black shadow-lg shadow-sky-600/30 transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saqlanmoqda...' : 'O‘zgarishlarni Saqlash'}</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* 4. HOURLY TIMELINE MODAL / DRAWER                         */}
      {/* ========================================================= */}
      {activeHourlyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sky-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Soatma-soat Sabab va Voqealar Qaydi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeHourlyModal.employeeName} ({activeHourlyModal.position})
                </p>
              </div>
              <button
                onClick={() => setActiveHourlyModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                Kun davomidagi voqealar va sabablar (Soatbay):
              </label>
              <textarea
                rows={5}
                value={hourlyInput}
                onChange={(e) => setHourlyInput(e.target.value)}
                placeholder="Masalan:&#10;08:45 - Bo‘lim binosiga keldi va ish boshladi&#10;10:30 - Tish shifokoriga borish uchun 1 soatga javob so‘radi&#10;11:45 - Qaytib keldi va dala ko‘rigiga chiqdi&#10;17:30 - Bo‘limga qaytdi"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium leading-relaxed"
              />
            </div>

            {/* Quick Templates */}
            <div>
              <p className="text-[11px] font-bold text-slate-500 mb-1.5">Tezkor shablonlar (Qo‘shish uchun bosing):</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REASONS.map((reason, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const nowTime = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
                      const addition = `${nowTime} - ${reason}`;
                      setHourlyInput((prev) => (prev ? `${prev}\n${addition}` : addition));
                    }}
                    className="text-[10px] text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-xl border border-sky-200 transition-all cursor-pointer"
                  >
                    + {reason}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveHourlyModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSaveHourlyLog}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold shadow-md shadow-sky-600/25 transition-all cursor-pointer"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
