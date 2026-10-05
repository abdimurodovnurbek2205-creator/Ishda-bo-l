'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { DailyTimesheetRecord, AttendanceStatus, Employee } from '@repo/types';
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
  X,
  Info,
} from 'lucide-react';
import { getMonthNameUz } from '@/lib/date-utils';

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================
const STATUS_CONFIG: Record<
  AttendanceStatus,
  {
    label: string;
    shortLabel: string;
    code: string;
    badgeBg: string;
    badgeText: string;
    cellBg: string;
    cellText: string;
    icon: any;
  }
> = {
  PRESENT: {
    label: 'Ishga kelgan',
    shortLabel: 'Kelgan',
    code: '8',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    badgeText: 'text-emerald-700',
    cellBg: 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 border-emerald-200',
    cellText: 'text-emerald-800',
    icon: UserCheck,
  },
  LATE: {
    label: 'Kechikib kelgan',
    shortLabel: 'Kechikkan',
    code: 'Kch',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-300',
    badgeText: 'text-amber-700',
    cellBg: 'bg-amber-50/80 hover:bg-amber-100 text-amber-800 border-amber-200',
    cellText: 'text-amber-800',
    icon: Clock,
  },
  EXCUSED: {
    label: 'Javob olgan (Ruxsat)',
    shortLabel: 'Javob olgan',
    code: 'J',
    badgeBg: 'bg-sky-50 text-sky-800 border-sky-300',
    badgeText: 'text-sky-700',
    cellBg: 'bg-sky-50/80 hover:bg-sky-100 text-sky-800 border-sky-200',
    cellText: 'text-sky-800',
    icon: HelpCircle,
  },
  ABSENT: {
    label: 'Sababsiz kelmagan',
    shortLabel: 'Sababsiz',
    code: 'S',
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-300',
    badgeText: 'text-rose-700',
    cellBg: 'bg-rose-50/80 hover:bg-rose-100 text-rose-800 border-rose-200',
    cellText: 'text-rose-800',
    icon: UserX,
  },
  FIELD_WORK: {
    label: 'Xizmat safari (Dalada)',
    shortLabel: 'Dalada',
    code: 'X',
    badgeBg: 'bg-teal-50 text-teal-800 border-teal-300',
    badgeText: 'text-teal-700',
    cellBg: 'bg-teal-50/80 hover:bg-teal-100 text-teal-800 border-teal-200',
    cellText: 'text-teal-800',
    icon: Briefcase,
  },
  SICK_LEAVE: {
    label: 'Kasallik varaqasi',
    shortLabel: 'Kasal',
    code: 'K',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-300',
    badgeText: 'text-purple-700',
    cellBg: 'bg-purple-50/80 hover:bg-purple-100 text-purple-800 border-purple-200',
    cellText: 'text-purple-800',
    icon: HeartPulse,
  },
  DAY_OFF: {
    label: 'Dam olish kuni',
    shortLabel: 'Dam',
    code: 'D',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
    badgeText: 'text-slate-600',
    cellBg: 'bg-slate-100/90 hover:bg-slate-200/80 text-slate-600 border-slate-300/80',
    cellText: 'text-slate-600',
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

const PREDEFINED_MONTHS = [
  { year: 2026, month: 9, name: 'Sentabr', icon: '🍂', range: '01.09.2026 - 30.09.2026' },
  { year: 2026, month: 10, name: 'Oktabr', icon: '🍁', range: '01.10.2026 - 31.10.2026' },
  { year: 2026, month: 11, name: 'Noyabr', icon: '🌾', range: '01.11.2026 - 30.11.2026' },
  { year: 2026, month: 12, name: 'Dekabr', icon: '❄️', range: '01.12.2026 - 31.12.2026' },
];

interface MonthDayInfo {
  date: string;
  dayNumber: number;
  dayOfWeek: string;
  dayOfWeekFull: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName: string | null;
}

interface MonthEmployeeRow {
  employee: Employee & { user?: { name: string } };
  records: DailyTimesheetRecord[];
  summary: {
    totalWorkDays: number;
    totalWorkHours: number;
    totalExcusedDays: number;
    totalAbsentDays: number;
    totalSickDays: number;
    totalDaysOff: number;
  };
}

interface MonthlyData {
  year: number;
  month: number;
  totalDays: number;
  days: MonthDayInfo[];
  matrix: MonthEmployeeRow[];
}

export default function TimesheetPage() {
  // Navigation & View Mode
  const [activeTab, setActiveTab] = useState<'monthly' | 'daily'>('monthly');

  // Month navigation (Defaults to Oktabr 2026)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(10);

  // Daily date selection (Defaults to today in YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Data states
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyTimesheetRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Cell Editor Modal state (for monthly matrix)
  const [cellEditTarget, setCellEditTarget] = useState<{
    record: DailyTimesheetRecord;
    dayInfo: MonthDayInfo;
  } | null>(null);

  // Holiday / Day-Off Manager Modal state
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState<boolean>(false);
  const [holidayFormDate, setHolidayFormDate] = useState<string>('2026-10-01');
  const [holidayFormType, setHolidayFormType] = useState<'holiday' | 'workday'>('holiday');
  const [holidayFormReason, setHolidayFormReason] = useState<string>('O‘qituvchi va murabbiylar kuni');

  // Hourly Timeline Modal state (for daily view)
  const [activeHourlyModal, setActiveHourlyModal] = useState<DailyTimesheetRecord | null>(null);
  const [hourlyInput, setHourlyInput] = useState<string>('');

  // =========================================================================
  // DATA FETCHING
  // =========================================================================
  const fetchMonthlyTimesheet = useCallback(async (year: number, month: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/timesheet?year=${year}&month=${month}&t=${Date.now()}`);
      const data = await res.json();
      if (data && data.success && data.type === 'monthly') {
        setMonthlyData({
          year: data.year,
          month: data.month,
          totalDays: data.totalDays,
          days: data.days || [],
          matrix: data.matrix || [],
        });
      }
    } catch (err) {
      console.error('Failed to load monthly timesheet:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDailyTimesheet = useCallback(async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/timesheet?date=${dateStr}&t=${Date.now()}`);
      const data = await res.json();
      if (data && data.records) {
        setDailyRecords(data.records);
      }
    } catch (err) {
      console.error('Failed to load daily timesheet:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'monthly') {
      fetchMonthlyTimesheet(currentYear, currentMonth);
    } else {
      fetchDailyTimesheet(selectedDate);
    }
  }, [activeTab, currentYear, currentMonth, selectedDate, fetchMonthlyTimesheet, fetchDailyTimesheet]);

  // =========================================================================
  // ACTIONS & HANDLERS
  // =========================================================================

  // Change Month tab
  const handleSelectMonth = (year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
    const mStr = String(month).padStart(2, '0');
    setSelectedDate(`${year}-${mStr}-01`);
  };

  // Open holiday modal for a specific day directly
  const handleOpenHolidayModalForDay = (dateStr: string, currentReason?: string | null) => {
    setHolidayFormDate(dateStr);
    setHolidayFormType('holiday');
    setHolidayFormReason(currentReason || 'Bayram / Dam olish kuni');
    setIsHolidayModalOpen(true);
  };

  // Apply Holiday / Day-off across all employees
  const handleApplyDayType = async () => {
    setSaving(true);
    try {
      const isHoliday = holidayFormType === 'holiday';
      const res = await fetch('/api/timesheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setDayType',
          date: holidayFormDate,
          isHolidayOrDayOff: isHoliday,
          reason: isHoliday ? holidayFormReason : '',
        }),
      });

      const data = await res.json();
      if (data && data.success) {
        setIsHolidayModalOpen(false);
        setStatusMessage(
          isHoliday
            ? `✅ ${holidayFormDate} sanasi barcha xodimlar uchun dam olish kuni deb belgilandi!`
            : `✅ ${holidayFormDate} sanasi ish kuni deb belgilandi.`
        );
        setTimeout(() => setStatusMessage(''), 5000);
        if (activeTab === 'monthly') {
          fetchMonthlyTimesheet(currentYear, currentMonth);
        } else {
          fetchDailyTimesheet(selectedDate);
        }
      }
    } catch (err) {
      console.error('Failed to set day type:', err);
      setStatusMessage('❌ Dam olish kunini belgilashda xatolik yuz berdi.');
    } finally {
      setSaving(false);
    }
  };

  // Single cell update in monthly view
  const handleSaveCellEdit = async (
    status: AttendanceStatus,
    workHours: number,
    reason: string
  ) => {
    if (!cellEditTarget) return;
    setSaving(true);
    try {
      const updatedRec: Partial<DailyTimesheetRecord> & { employeeId: string; date: string } = {
        employeeId: cellEditTarget.record.employeeId,
        date: cellEditTarget.record.date,
        status,
        workHours,
        reason,
        checkInTime: status === 'PRESENT' || status === 'LATE' ? '09:00' : '',
        checkOutTime: status === 'PRESENT' || status === 'LATE' ? '18:00' : '',
      };

      const res = await fetch('/api/timesheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record: updatedRec }),
      });

      const data = await res.json();
      if (data && data.success) {
        setCellEditTarget(null);
        fetchMonthlyTimesheet(currentYear, currentMonth);
      }
    } catch (err) {
      console.error('Failed to save cell edit:', err);
    } finally {
      setSaving(false);
    }
  };

  // Daily View record change handler
  const handleDailyRecordChange = (
    employeeId: string,
    field: keyof DailyTimesheetRecord,
    value: any
  ) => {
    setDailyRecords((prev) =>
      prev.map((rec) => {
        if (rec.employeeId !== employeeId) return rec;
        const updated = { ...rec, [field]: value };

        if (field === 'checkInTime' || field === 'checkOutTime') {
          const inVal = field === 'checkInTime' ? value : rec.checkInTime;
          const outVal = field === 'checkOutTime' ? value : rec.checkOutTime;
          if (inVal && outVal && inVal.includes(':') && outVal.includes(':')) {
            const [inH, inM] = inVal.split(':').map(Number);
            const [outH, outM] = outVal.split(':').map(Number);
            const totalInMinutes = inH * 60 + inM;
            const totalOutMinutes = outH * 60 + outM;
            if (totalOutMinutes > totalInMinutes) {
              const diffHours = (totalOutMinutes - totalInMinutes - 60) / 60;
              updated.workHours = Math.max(0, Math.round(diffHours * 10) / 10);
            }
          }
        }

        if (field === 'status') {
          if (value === 'LATE' && !updated.reason) updated.reason = 'Kechikib kelgan';
          else if (value === 'EXCUSED' && !updated.reason) updated.reason = 'Ruxsat so‘rab javob oldi';
          else if (value === 'ABSENT' && !updated.reason) updated.reason = 'Sababsiz ishga kelmadi';
          else if (value === 'FIELD_WORK' && !updated.reason) updated.reason = 'Dala nazorati va ko‘rikka chiqqan';
          else if (value === 'PRESENT' && updated.reason === 'Sababsiz ishga kelmadi') updated.reason = '';
        }

        return updated;
      })
    );
  };

  // Mark all present in daily view
  const handleMarkAllPresentDaily = () => {
    setDailyRecords((prev) =>
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

  // Save monthly matrix to backend
  const handleSaveMonthly = async () => {
    if (!monthlyData) return;
    setSaving(true);
    setStatusMessage('');
    try {
      const allRecords: DailyTimesheetRecord[] = [];
      monthlyData.matrix.forEach((row) => {
        row.records.forEach((rec) => {
          allRecords.push(rec);
        });
      });

      const res = await fetch('/api/timesheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: allRecords }),
      });
      const data = await res.json();
      if (data && data.success) {
        setStatusMessage(`✅ ${currentMonthName} oyi tabeli muvaffaqiyatli saqlandi!`);
        setTimeout(() => setStatusMessage(''), 4500);
        fetchMonthlyTimesheet(currentYear, currentMonth);
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

  // Save daily records to backend
  const handleSaveDaily = async () => {
    setSaving(true);
    setStatusMessage('');
    try {
      const res = await fetch('/api/timesheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: dailyRecords }),
      });
      const data = await res.json();
      if (data && data.success) {
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

  // Hourly modal in daily view
  const handleOpenHourlyModal = (record: DailyTimesheetRecord) => {
    setActiveHourlyModal(record);
    setHourlyInput(record.hourlyLog || '');
  };

  const handleSaveHourlyLog = () => {
    if (!activeHourlyModal) return;
    handleDailyRecordChange(activeHourlyModal.employeeId, 'hourlyLog', hourlyInput);
    setActiveHourlyModal(null);
  };

  // Stats for daily view
  const dailyStats = useMemo(() => {
    return {
      total: dailyRecords.length,
      present: dailyRecords.filter((r) => r.status === 'PRESENT').length,
      late: dailyRecords.filter((r) => r.status === 'LATE').length,
      excused: dailyRecords.filter((r) => r.status === 'EXCUSED').length,
      absent: dailyRecords.filter((r) => r.status === 'ABSENT').length,
      fieldWork: dailyRecords.filter((r) => r.status === 'FIELD_WORK').length,
      sick: dailyRecords.filter((r) => r.status === 'SICK_LEAVE').length,
      dayOff: dailyRecords.filter((r) => r.status === 'DAY_OFF').length,
    };
  }, [dailyRecords]);

  // Uzbek formatted display date
  const displayDateUz = useMemo(() => {
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return selectedDate;
  }, [selectedDate]);

  const currentMonthName = useMemo(() => getMonthNameUz(currentMonth), [currentMonth]);

  return (
    <div className="flex min-h-screen relative text-slate-900 bg-sky-50/20">
      {/* Ambient background glows */}
      <div className="fixed top-12 right-20 w-[550px] h-[550px] rounded-full bg-gradient-to-br from-sky-400/20 via-cyan-300/15 to-blue-500/10 blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-16 left-60 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-teal-300/15 via-sky-300/15 to-indigo-400/10 blur-3xl pointer-events-none -z-10" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <Header title="Kunlik va Oylik Tabel (Sentabr — Dekabr 2026)" />

        <main className="p-3 sm:p-5 lg:p-7 space-y-5 max-w-[1600px] mx-auto w-full relative z-10">
          {/* ========================================================= */}
          {/* 1. TOP HEADER & NAVIGATION BAR                            */}
          {/* ========================================================= */}
          <div className="glass-panel p-4 rounded-3xl border border-white/80 shadow-xl backdrop-blur-xl space-y-3.5">
            {/* Row 1: View Mode Tabs + Month Quick Buttons + Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Tab Switcher: Oylik vs Kunlik */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-inner">
                <button
                  onClick={() => setActiveTab('monthly')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'monthly'
                      ? 'bg-white text-sky-800 shadow-md shadow-sky-900/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <span>Oylik Tabel (2026 Matritsa)</span>
                </button>

                <button
                  onClick={() => setActiveTab('daily')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'daily'
                      ? 'bg-white text-sky-800 shadow-md shadow-sky-900/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Kunlik Tabel (Soatbay)</span>
                </button>
              </div>

              {/* Action Buttons: Holiday mark, Excel Export */}
              <div className="flex items-center flex-wrap gap-2">
                {/* Bayram / Dam olish kiritish */}
                <button
                  onClick={() => {
                    setHolidayFormDate(selectedDate);
                    setHolidayFormType('holiday');
                    setHolidayFormReason('Bayram kuni');
                    setIsHolidayModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 text-xs font-extrabold border border-amber-300/80 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  title="Oradagi dam olish yoki bayram kunlarini kiritish"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Bayram / Dam olish kiritish</span>
                </button>

                {/* Excel Download Button (Tepada Excelda yuklash) */}
                {activeTab === 'monthly' ? (
                  <a
                    href={`/api/timesheet/export?year=${currentYear}&month=${currentMonth}&format=xlsx`}
                    download
                    className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                    title={`${currentMonthName} 2026 oylik tabelini haqiqiy Excel (.xlsx) formatida yuklash`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Excelda yuklash</span>
                  </a>
                ) : (
                  <a
                    href={`/api/timesheet/export?date=${selectedDate}&format=xlsx`}
                    download
                    className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                    title="Kunlik tabelni haqiqiy Excel (.xlsx) formatida yuklash"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Excelda yuklash</span>
                  </a>
                )}
              </div>
            </div>

            {/* Row 2: Prominent Month Selection Pills (Sentabr, Oktabr, Noyabr, Dekabr 2026) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  <span>2026-yil oylari:</span>
                </span>

                {PREDEFINED_MONTHS.map((m) => {
                  const isSelected = currentYear === m.year && currentMonth === m.month;
                  return (
                    <button
                      key={`${m.year}-${m.month}`}
                      onClick={() => handleSelectMonth(m.year, m.month)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border active:scale-95 ${
                        isSelected
                          ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white border-sky-600 shadow-md shadow-sky-600/25'
                          : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200/90 shadow-2xs'
                      }`}
                      title={m.range}
                    >
                      <span>{m.icon}</span>
                      <span>{m.name} 2026</span>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>

              {/* If Daily View is active, show Daily Date Navigator */}
              {activeTab === 'daily' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const d = new Date(selectedDate);
                      d.setDate(d.getDate() - 1);
                      setSelectedDate(d.toISOString().split('T')[0]);
                    }}
                    className="p-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 hover:text-sky-600 border border-slate-200/80 shadow-2xs transition-all cursor-pointer"
                    title="Oldingi kun"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/95 border border-sky-200/80 shadow-2xs">
                    <span className="text-xs font-bold text-slate-600">Sana:</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-transparent font-extrabold text-xs text-slate-900 focus:outline-none cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const d = new Date(selectedDate);
                      d.setDate(d.getDate() + 1);
                      setSelectedDate(d.toISOString().split('T')[0]);
                    }}
                    className="p-1.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 hover:text-sky-600 border border-slate-200/80 shadow-2xs transition-all cursor-pointer"
                    title="Keyingi kun"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                    className="px-2.5 py-1 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 text-xs font-bold border border-sky-200/80 transition-all cursor-pointer"
                  >
                    Bugun
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Feedback banner */}
          {statusMessage && (
            <div className="p-3.5 rounded-2xl glass-panel border border-sky-300 bg-sky-50/90 text-sky-900 font-bold text-xs flex items-center justify-between gap-2 animate-fade-in shadow-md">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{statusMessage}</span>
              </div>
              <button
                onClick={() => setStatusMessage('')}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. MODE A: MONTHLY TIMESHEET MATRIX (SENTABR - DEKABR)    */}
          {/* ========================================================= */}
          {activeTab === 'monthly' &&
            (() => {
              if (loading || !monthlyData) {
                return (
                  <div className="glass-panel p-16 text-center text-slate-500 font-bold text-xs rounded-3xl border border-white/80 shadow-md">
                    Oylik tabel ma'lumotlari yuklanmoqda...
                  </div>
                );
              }

              const md = monthlyData;
              const daysList = md.days;

              return (
                <div className="space-y-4">
                  {/* Legend & Instructions Card */}
                  <div className="glass-panel p-4 rounded-3xl border border-white/80 shadow-md backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-700">Shartli belgilar:</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>8 - Ish kuni (8 soat)</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-300 font-bold">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                        <span>D - Dam olish kuni (Shanba, Bozor)</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 font-bold">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span>B - Rasmiy bayram kuni</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50 text-sky-800 border border-sky-300 font-bold">
                        <span>J - Javob olgan</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-300 font-bold">
                        <span>S - Sababsiz</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-teal-50 text-teal-800 border border-teal-300 font-bold">
                        <span>X - Xizmat safari (Dalada)</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-300 font-bold">
                        <span>K - Kasallik</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-sky-600" />
                      <span>Katakchani yoki kun boshini bosing — holatini o‘zgartiring yoki bayram deb belgilang</span>
                    </div>
                  </div>

                  {/* Monthly Matrix Table */}
                  <div className="glass-panel rounded-3xl overflow-hidden border border-white/80 shadow-2xl backdrop-blur-xl">
                    {/* Header info */}
                    <div className="p-4 sm:p-5 border-b border-sky-100/70 bg-gradient-to-r from-white/95 via-sky-50/50 to-white/90 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                          <CalendarCheck className="w-4 h-4 text-sky-600" />
                          <span>
                            Bandixon Bo‘limi: {currentYear}-yil {currentMonthName} oyi davomat tabeli (1 -{' '}
                            {md.totalDays} {currentMonthName})
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">
                          Shanba va bozor kunlari avtomatik dam olish kuni sifatida hisoblangan.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-white/80 px-3 py-1 rounded-xl border border-slate-200/60 shadow-2xs">
                        <span>Mas'ul:</span>
                        <span className="text-sky-800 font-extrabold">Bo‘riyev Shuxrat X.</span>
                      </div>
                    </div>

                    {/* Interactive Matrix Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs select-none">
                        <thead>
                          <tr className="border-b border-sky-100/80 bg-sky-50/60 text-slate-700 font-extrabold uppercase tracking-wider text-[10px]">
                            <th className="py-2.5 px-2 w-8 text-center sticky left-0 z-20 bg-sky-50/95 border-r border-sky-200/60">
                              №
                            </th>
                            <th className="py-2.5 px-3 min-w-[200px] sticky left-8 z-20 bg-sky-50/95 border-r border-sky-200/60">
                              Xodim F.I.Sh / Lavozimi
                            </th>

                            {/* Day headers (1..30/31) */}
                            {daysList.map((d) => {
                              const isWeekendDay = d.isWeekend;
                              const isHolidayDay = d.isHoliday;

                              let bgClass = 'bg-sky-50/40 text-slate-700';
                              if (isHolidayDay) bgClass = 'bg-amber-100/80 text-amber-900';
                              else if (isWeekendDay) bgClass = 'bg-slate-200/70 text-slate-700';

                              return (
                                <th
                                  key={d.date}
                                  onClick={() => handleOpenHolidayModalForDay(d.date, d.holidayName)}
                                  title={
                                    d.holidayName
                                      ? `Bayram: ${d.holidayName}. O‘zgartirish uchun bosing.`
                                      : isWeekendDay
                                      ? `${d.dayOfWeekFull} - Dam olish kuni. Bayram yoki ish kuni deb belgilash uchun bosing.`
                                      : `${d.dayOfWeekFull}. Bayram deb belgilash uchun bosing.`
                                  }
                                  className={`py-2 px-1 text-center min-w-[32px] cursor-pointer hover:bg-sky-200/70 transition-all border-r border-sky-100/60 ${bgClass}`}
                                >
                                  <div className="font-black text-xs leading-none">{d.dayNumber}</div>
                                  <div className="text-[9px] font-bold text-slate-500 mt-0.5 leading-none">
                                    {d.dayOfWeek}
                                  </div>
                                  {isHolidayDay && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mx-auto mt-0.5" />
                                  )}
                                </th>
                              );
                            })}

                            {/* Summary Columns Header */}
                            <th className="py-2.5 px-2 text-center min-w-[50px] bg-emerald-100/80 text-emerald-900 border-l border-emerald-200">
                              Ish kuni
                            </th>
                            <th className="py-2.5 px-2 text-center min-w-[50px] bg-emerald-100/80 text-emerald-900">
                              Soat
                            </th>
                            <th className="py-2.5 px-2 text-center min-w-[45px] bg-slate-200/80 text-slate-800">
                              Dam
                            </th>
                            <th className="py-2.5 px-2 text-center min-w-[45px] bg-sky-100/80 text-sky-900">
                              Javob
                            </th>
                            <th className="py-2.5 px-2 text-center min-w-[45px] bg-rose-100/80 text-rose-900">
                              Sabab.
                            </th>
                            <th className="py-2.5 px-2 text-center min-w-[45px] bg-teal-100/80 text-teal-900">
                              Dala
                            </th>
                            <th className="py-2.5 px-2 text-center min-w-[45px] bg-purple-100/80 text-purple-900">
                              Kasal
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-sky-100/50 bg-white/70">
                          {md.matrix.map((row, idx) => {
                            const fieldWorkDays = row.records.filter((r) => r.status === 'FIELD_WORK').length;

                            return (
                              <tr key={row.employee.id} className="hover:bg-sky-50/40 transition-colors">
                                {/* Row Index */}
                                <td className="py-2 px-1 text-center font-bold text-slate-400 text-xs sticky left-0 z-10 bg-white/95 border-r border-sky-100">
                                  {idx + 1}
                                </td>

                                {/* Employee Name & Position */}
                                <td className="py-2 px-3 sticky left-8 z-10 bg-white/95 border-r border-sky-100">
                                  <div className="font-extrabold text-slate-900 text-xs truncate max-w-[190px]">
                                    {row.employee.user?.name || row.employee.id}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                                    <span className="font-mono font-bold text-sky-800">
                                      {row.employee.employeeCode}
                                    </span>
                                    <span className="truncate max-w-[140px]">{row.employee.position}</span>
                                  </div>
                                </td>

                                {/* 1..30/31 Day Cells */}
                                {row.records.map((rec, dIdx) => {
                                  const dayInfo = daysList[dIdx];
                                  if (!dayInfo) return null;

                                  const isWeekendDay = dayInfo.isWeekend;
                                  const isHolidayDay = dayInfo.isHoliday;

                                  let code = '8';
                                  let cellStyle = STATUS_CONFIG.PRESENT.cellBg;

                                  if (rec.status === 'DAY_OFF') {
                                    if (isHolidayDay) {
                                      code = 'B';
                                      cellStyle = 'bg-amber-100/90 hover:bg-amber-200 text-amber-900 border-amber-300 font-black';
                                    } else {
                                      code = 'D';
                                      cellStyle = STATUS_CONFIG.DAY_OFF.cellBg;
                                    }
                                  } else if (rec.status === 'PRESENT') {
                                    code = String(rec.workHours || 8);
                                    cellStyle = STATUS_CONFIG.PRESENT.cellBg;
                                  } else if (rec.status === 'LATE') {
                                    code = `${rec.workHours || 8}`;
                                    cellStyle = STATUS_CONFIG.LATE.cellBg;
                                  } else if (rec.status === 'EXCUSED') {
                                    code = 'J';
                                    cellStyle = STATUS_CONFIG.EXCUSED.cellBg;
                                  } else if (rec.status === 'ABSENT') {
                                    code = 'S';
                                    cellStyle = STATUS_CONFIG.ABSENT.cellBg;
                                  } else if (rec.status === 'FIELD_WORK') {
                                    code = 'X';
                                    cellStyle = STATUS_CONFIG.FIELD_WORK.cellBg;
                                  } else if (rec.status === 'SICK_LEAVE') {
                                    code = 'K';
                                    cellStyle = STATUS_CONFIG.SICK_LEAVE.cellBg;
                                  }

                                  return (
                                    <td
                                      key={rec.id || `${rec.date}-${rec.employeeId}`}
                                      onClick={() => setCellEditTarget({ record: rec, dayInfo })}
                                      className="p-0.5 text-center border-r border-sky-100/60"
                                    >
                                      <div
                                        className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center font-bold text-xs transition-all cursor-pointer border shadow-2xs hover:scale-110 active:scale-95 ${cellStyle}`}
                                        title={`${row.employee.user?.name || 'Xodim'}: ${dayInfo.dayNumber}-${currentMonthName} (${dayInfo.dayOfWeekFull})\nHolati: ${STATUS_CONFIG[rec.status]?.label || rec.status}\nSoat: ${rec.workHours} soat${rec.reason ? '\nSabab: ' + rec.reason : ''}`}
                                      >
                                        {code}
                                      </div>
                                    </td>
                                  );
                                })}

                                {/* Summary Totals */}
                                <td className="py-2 px-1 text-center font-black text-xs text-emerald-800 bg-emerald-50/60 border-l border-emerald-200">
                                  {row.summary.totalWorkDays}
                                </td>
                                <td className="py-2 px-1 text-center font-black text-xs text-emerald-800 bg-emerald-50/60">
                                  {row.summary.totalWorkHours}
                                </td>
                                <td className="py-2 px-1 text-center font-bold text-xs text-slate-600 bg-slate-100/60">
                                  {row.summary.totalDaysOff}
                                </td>
                                <td className="py-2 px-1 text-center font-bold text-xs text-sky-800 bg-sky-50/60">
                                  {row.summary.totalExcusedDays}
                                </td>
                                <td className="py-2 px-1 text-center font-black text-xs text-rose-700 bg-rose-50/60">
                                  {row.summary.totalAbsentDays}
                                </td>
                                <td className="py-2 px-1 text-center font-bold text-xs text-teal-800 bg-teal-50/60">
                                  {fieldWorkDays}
                                </td>
                                <td className="py-2 px-1 text-center font-bold text-xs text-purple-800 bg-purple-50/60">
                                  {row.summary.totalSickDays}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer Controls & Quick Legend */}
                    <div className="p-4 bg-gradient-to-r from-sky-50/50 via-white to-sky-50/50 border-t border-sky-100 flex flex-wrap items-center justify-between gap-4">
                      <div className="text-xs text-slate-600 font-medium flex items-center gap-2">
                        <Info className="w-4 h-4 text-sky-600 shrink-0" />
                        <span>
                          <strong className="text-slate-900">Izoh:</strong> Shanba va bozor kunlari (D) dam olish kuni deb avtomatik belgilangan. Har qanday xodim katakchasini bosib soatini yoki sababini qo‘lda o‘zgartirishingiz mumkin.
                        </span>
                      </div>

                      {/* Pasga Saqlash tugmasi */}
                      <button
                        onClick={handleSaveMonthly}
                        disabled={saving}
                        className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-black shadow-lg shadow-sky-600/30 transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* ========================================================= */}
          {/* 3. MODE B: DAILY DETAILED TIMESHEET (HOURLY / SOATBAY)     */}
          {/* ========================================================= */}
          {activeTab === 'daily' && (
            <div className="space-y-5">
              {/* Daily KPI summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="glass-panel p-3.5 rounded-2xl border border-white/80 shadow-md">
                  <p className="text-[11px] font-bold text-slate-500">Jami xodimlar</p>
                  <p className="text-xl font-black text-slate-900 mt-1">{dailyStats.total} nafar</p>
                  <p className="text-[10px] text-slate-400 mt-1">Bandixon bo‘limi</p>
                </div>

                <div className="glass-panel p-3.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/30 shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-emerald-800">Ishda / Kelgan</p>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <p className="text-xl font-black text-emerald-700 mt-1">{dailyStats.present}</p>
                  <p className="text-[10px] text-emerald-600/80 mt-1">O‘z vaqtida kelgan</p>
                </div>

                <div className="glass-panel p-3.5 rounded-2xl border border-amber-200/80 bg-amber-50/30 shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-amber-800">Kechikkan</p>
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  </div>
                  <p className="text-xl font-black text-amber-700 mt-1">{dailyStats.late}</p>
                  <p className="text-[10px] text-amber-600/80 mt-1">09:00 dan keyin</p>
                </div>

                <div className="glass-panel p-3.5 rounded-2xl border border-sky-200/80 bg-sky-50/30 shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-sky-800">Javob olgan</p>
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  </div>
                  <p className="text-xl font-black text-sky-700 mt-1">{dailyStats.excused}</p>
                  <p className="text-[10px] text-sky-600/80 mt-1">Ruxsat so‘ragan</p>
                </div>

                <div className="glass-panel p-3.5 rounded-2xl border border-rose-200/80 bg-rose-50/30 shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-rose-800">Sababsiz</p>
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  </div>
                  <p className="text-xl font-black text-rose-700 mt-1">{dailyStats.absent}</p>
                  <p className="text-[10px] text-rose-600/80 mt-1">Qayd etilmagan</p>
                </div>

                <div className="glass-panel p-3.5 rounded-2xl border border-teal-200/80 bg-teal-50/30 shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-teal-800">Dalada</p>
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  </div>
                  <p className="text-xl font-black text-teal-700 mt-1">{dailyStats.fieldWork}</p>
                  <p className="text-[10px] text-teal-600/80 mt-1">Dala ko‘rigida</p>
                </div>
              </div>

              {/* Main Daily Table */}
              <div className="glass-panel rounded-3xl overflow-hidden border border-white/80 shadow-2xl backdrop-blur-xl">
                <div className="p-4 sm:p-5 border-b border-sky-100/70 bg-gradient-to-r from-white/95 via-sky-50/50 to-white/90 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-sky-600" />
                      <span>Kunlik Soatma-soat Davomat ({displayDateUz} yil)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Kelgan va ketgan vaqtini, soatini va sababini qo‘lda yozing
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMarkAllPresentDaily}
                      className="px-3 py-1.5 rounded-xl bg-white/85 hover:bg-white text-slate-700 hover:text-emerald-700 text-xs font-extrabold border border-slate-200/80 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Barchasi Ishda</span>
                    </button>
                  </div>
                </div>

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
                            Yuklanmoqda...
                          </td>
                        </tr>
                      ) : dailyRecords.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500 font-bold text-xs">
                            Xodimlar ro‘yxati topilmadi.
                          </td>
                        </tr>
                      ) : (
                        dailyRecords.map((rec, idx) => {
                          const cfg = STATUS_CONFIG[rec.status] || STATUS_CONFIG.PRESENT;

                          return (
                            <tr key={rec.id} className="hover:bg-sky-50/50 transition-colors">
                              <td className="py-3 px-3 text-center font-bold text-slate-400 text-xs">
                                {idx + 1}
                              </td>

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

                              {/* Status select */}
                              <td className="py-3 px-3">
                                <select
                                  value={rec.status}
                                  onChange={(e) =>
                                    handleDailyRecordChange(
                                      rec.employeeId,
                                      'status',
                                      e.target.value as AttendanceStatus
                                    )
                                  }
                                  className={`w-full text-xs font-bold rounded-xl px-2.5 py-1.5 border shadow-2xs focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer ${cfg.badgeBg}`}
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

                              {/* CheckIn */}
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="time"
                                    value={rec.checkInTime || ''}
                                    onChange={(e) =>
                                      handleDailyRecordChange(rec.employeeId, 'checkInTime', e.target.value)
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
                                      handleDailyRecordChange(rec.employeeId, 'checkInTime', nowTime);
                                    }}
                                    className="text-[10px] text-sky-600 hover:text-sky-800 font-bold bg-sky-50 px-1.5 py-1 rounded-lg border border-sky-200 transition-all cursor-pointer"
                                  >
                                    Hozir
                                  </button>
                                </div>
                              </td>

                              {/* CheckOut */}
                              <td className="py-3 px-3">
                                <input
                                  type="time"
                                  value={rec.checkOutTime || ''}
                                  onChange={(e) =>
                                    handleDailyRecordChange(rec.employeeId, 'checkOutTime', e.target.value)
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
                                    handleDailyRecordChange(
                                      rec.employeeId,
                                      'workHours',
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-16 text-center bg-white/90 border border-slate-200 rounded-xl py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                                />
                              </td>

                              {/* Reason */}
                              <td className="py-3 px-3">
                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    value={rec.reason || ''}
                                    placeholder="Kelmaganlik, kechikish yoki javob olish sababi..."
                                    onChange={(e) =>
                                      handleDailyRecordChange(rec.employeeId, 'reason', e.target.value)
                                    }
                                    className="w-full bg-white/90 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs font-medium"
                                  />
                                  {!rec.reason && rec.status !== 'PRESENT' && (
                                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                                      {QUICK_REASONS.slice(0, 3).map((qr, i) => (
                                        <button
                                          key={i}
                                          onClick={() =>
                                            handleDailyRecordChange(rec.employeeId, 'reason', qr)
                                          }
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

                {/* Bottom Bar */}
                <div className="p-4 bg-gradient-to-r from-sky-50/50 via-white to-sky-50/50 border-t border-sky-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-slate-600 font-medium flex items-center gap-2">
                    <Info className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>
                      <strong className="text-slate-900">Eslatma:</strong> Barcha kiritilgan o‘zgarishlar «Saqlash» tugmasi bosilganda to‘liq saqlanadi.
                    </span>
                  </div>

                  {/* Pasga Saqlash tugmasi */}
                  <button
                    onClick={handleSaveDaily}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-black shadow-lg shadow-sky-600/30 transition-all cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* 4. MODAL: CELL QUICK EDIT (MONTHLY MATRIX)                 */}
      {/* ========================================================= */}
      {cellEditTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-sky-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Davomatni Tahrirlash
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {cellEditTarget.record.employeeName} — {cellEditTarget.dayInfo.dayNumber}-{currentMonthName} ({cellEditTarget.dayInfo.dayOfWeekFull})
                </p>
              </div>
              <button
                onClick={() => setCellEditTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Status Buttons */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Holatni tanlang (Tezkor):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveCellEdit('PRESENT', 8, '')}
                  className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer text-left"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Ishda (8 soat)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveCellEdit('DAY_OFF', 0, 'Dam olish kuni')}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer text-left"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <span>Dam olish (D)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveCellEdit('DAY_OFF', 0, 'Rasmiy bayram kuni')}
                  className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer text-left"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Bayram kuni (B)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveCellEdit('EXCUSED', 0, 'Ruxsat so‘rab javob oldi')}
                  className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer text-left"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  <span>Javob olgan (J)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveCellEdit('ABSENT', 0, 'Sababsiz kelmadi')}
                  className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer text-left"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span>Sababsiz (S)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveCellEdit('FIELD_WORK', 8, 'Dala nazoratida')}
                  className="p-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer text-left"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                  <span>Dalada / Xizmat (X)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveCellEdit('SICK_LEAVE', 0, 'Kasallik varaqasi')}
                  className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer text-left col-span-2"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <span>Kasallik varaqasi (K)</span>
                </button>
              </div>
            </div>

            {/* Custom hours & reason */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-bold text-slate-700">Ishlagan soati:</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  defaultValue={cellEditTarget.record.workHours}
                  id="cellEditWorkHours"
                  className="w-20 text-center bg-slate-50 border border-slate-200 rounded-xl py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Sabab yoki izoh:</label>
                <input
                  type="text"
                  defaultValue={cellEditTarget.record.reason || ''}
                  id="cellEditReason"
                  placeholder="Sababini yozing..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCellEditTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => {
                  const hoursInput = document.getElementById('cellEditWorkHours') as HTMLInputElement;
                  const reasonInput = document.getElementById('cellEditReason') as HTMLInputElement;
                  const hours = parseFloat(hoursInput?.value) || 0;
                  const reason = reasonInput?.value || '';
                  handleSaveCellEdit(cellEditTarget.record.status, hours, reason);
                }}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold shadow-md shadow-sky-600/25 transition-all cursor-pointer"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL: HOLIDAY & CUSTOM DAY-OFF MANAGER                */}
      {/* ========================================================= */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-sky-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>Bayram yoki Dam Olish Kunini Belgilash</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Barcha xodimlar uchun bir bosishda dam olish yoki ish kuni deb belgilanadi
                </p>
              </div>
              <button
                onClick={() => setIsHolidayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Sana tanlash */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Dam olish / Bayram sanasi:
                </label>
                <input
                  type="date"
                  value={holidayFormDate}
                  onChange={(e) => setHolidayFormDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                />
              </div>

              {/* Turi */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Kunning turi:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHolidayFormType('holiday')}
                    className={`p-2.5 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer text-center ${
                      holidayFormType === 'holiday'
                        ? 'bg-amber-50 text-amber-900 border-amber-400 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🎉 Bayram / Dam olish kuni
                  </button>

                  <button
                    type="button"
                    onClick={() => setHolidayFormType('workday')}
                    className={`p-2.5 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer text-center ${
                      holidayFormType === 'workday'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-400 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    💼 Ish kuni (8 soat)
                  </button>
                </div>
              </div>

              {/* Sababi / Nomi */}
              {holidayFormType === 'holiday' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Bayram yoki dam olish sababi (Nomi):
                  </label>
                  <input
                    type="text"
                    value={holidayFormReason}
                    onChange={(e) => setHolidayFormReason(e.target.value)}
                    placeholder="Masalan: 1-oktabr O‘qituvchi va murabbiylar kuni"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />

                  {/* Shablonlar */}
                  <div className="mt-2">
                    <p className="text-[11px] font-bold text-slate-500 mb-1">Rasmiy bayramlar:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { date: '2026-09-01', name: 'Mustaqillik kuni' },
                        { date: '2026-10-01', name: 'O‘qituvchi va murabbiylar kuni' },
                        { date: '2026-12-08', name: 'Konstitutsiya kuni' },
                        { date: holidayFormDate, name: 'Qo‘shimcha dam olish kuni' },
                      ].map((h, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setHolidayFormDate(h.date);
                            setHolidayFormReason(h.name);
                          }}
                          className="text-[10px] text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-xl border border-amber-200 transition-all cursor-pointer"
                        >
                          + {h.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsHolidayModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleApplyDayType}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md shadow-amber-600/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Qo‘llanilmoqda...' : 'Barcha xodimlar uchun qo‘llash'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. MODAL: HOURLY TIMELINE LOG (DAILY VIEW)                */}
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
                <X className="w-4 h-4" />
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
              <p className="text-[11px] font-bold text-slate-500 mb-1.5">
                Tezkor shablonlar (Qo‘shish uchun bosing):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REASONS.map((reason, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const nowTime = new Date().toLocaleTimeString('uz-UZ', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
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
