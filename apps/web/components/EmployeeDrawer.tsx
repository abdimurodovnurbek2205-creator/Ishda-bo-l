'use client';

import React from 'react';
import { EmployeeLiveSummary } from '@repo/types';
import {
  X,
  MapPin,
  Clock,
  Navigation,
  Phone,
  Briefcase,
  Calendar,
  Route,
  History,
  Activity,
  User,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

interface EmployeeDrawerProps {
  employee: EmployeeLiveSummary | null;
  onClose: () => void;
}

export function EmployeeDrawer({ employee, onClose }: EmployeeDrawerProps) {
  if (!employee) return null;

  let statusBadge = (
    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-800 border border-emerald-300/60 flex items-center gap-1.5 shadow-2xs backdrop-blur-xs">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      Ishda (GPS faol)
    </span>
  );

  if (employee.status === 'DELAYED') {
    statusBadge = (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-800 border border-amber-300/60 flex items-center gap-1.5 shadow-2xs backdrop-blur-xs">
        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
        Signal kechikmoqda
      </span>
    );
  } else if (employee.status === 'OFFLINE' || employee.status === 'NOT_WORKING') {
    statusBadge = (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-700 border border-slate-200/80 flex items-center gap-1.5 shadow-2xs backdrop-blur-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        Ishda emas / Offline
      </span>
    );
  }

  const lastUpdateText =
    employee.lastUpdateAgoSeconds !== undefined
      ? `${employee.lastUpdateAgoSeconds} soniya avval`
      : 'Ma‘lumot yo‘q';

  return (
    <div className="absolute top-4 right-4 z-30 w-96 glass-panel rounded-3xl shadow-2xl border border-white/85 overflow-hidden flex flex-col max-h-[calc(100vh-100px)] animate-in fade-in slide-in-from-right-4 duration-300 backdrop-blur-2xl">
      {/* Header with Dark Glass effect */}
      <div className="bg-gradient-to-r from-slate-950/90 via-slate-900/90 to-sky-950/90 text-white p-4.5 flex items-center justify-between border-b border-sky-400/20">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md border border-white/20">
            {employee.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-extrabold text-base leading-tight text-white">{employee.name}</h3>
            <p className="text-xs text-sky-300 font-semibold mt-0.5">{employee.employeeCode} • {employee.position}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body details */}
      <div className="p-5 space-y-4 overflow-y-auto flex-1">
        {/* Status bar */}
        <div className="flex items-center justify-between bg-white/80 p-3.5 rounded-2xl border border-sky-100/80 shadow-2xs backdrop-blur-md">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Monitoring holati</span>
          {statusBadge}
        </div>

        {/* Current Location Info */}
        <div className="space-y-2">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Joriy Joylashuv</h4>
          <div className="bg-gradient-to-br from-sky-500/10 via-cyan-500/10 to-blue-500/10 border border-sky-200/70 p-4 rounded-2xl space-y-2.5 text-xs shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-600" />
                Tuman / Shahar:
              </span>
              <span className="font-extrabold text-slate-900">{employee.currentDistrict}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-semibold">Viloyat:</span>
              <span className="font-bold text-slate-800">{employee.currentRegion}</span>
            </div>

            {employee.latestLocation && (
              <div className="flex items-center justify-between pt-1.5 border-t border-sky-200/60">
                <span className="text-slate-600 font-semibold">GPS Koordinatalar:</span>
                <span className="font-mono text-sky-900 font-bold text-[11px] bg-white/80 px-2 py-0.5 rounded-lg border border-sky-200/50">
                  {employee.latestLocation.latitude.toFixed(5)}, {employee.latestLocation.longitude.toFixed(5)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1.5 border-t border-sky-200/60 text-slate-500">
              <span className="flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                Oxirgi signal:
              </span>
              <span className="font-bold text-slate-700">{lastUpdateText}</span>
            </div>
          </div>
        </div>

        {/* Work Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/80 p-3.5 rounded-2xl border border-sky-100/80 shadow-2xs backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase mb-1">
              <Navigation className="w-4 h-4 text-emerald-600" />
              Bugungi Masofa
            </div>
            <p className="text-xl font-black text-slate-900">{employee.todayDistanceKm} km</p>
          </div>

          <div className="bg-white/80 p-3.5 rounded-2xl border border-sky-100/80 shadow-2xs backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase mb-1">
              <Clock className="w-4 h-4 text-sky-600" />
              Ish Vaqti
            </div>
            <p className="text-sm font-extrabold text-slate-900">{employee.workingHoursStart} - {employee.workingHoursEnd}</p>
          </div>
        </div>

        {/* Profile metadata */}
        <div className="space-y-2 text-xs">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Xodim Ma‘lumotlari</h4>
          <div className="bg-white/80 p-4 rounded-2xl border border-sky-100/80 space-y-2 backdrop-blur-md shadow-2xs">
            <div className="flex justify-between items-start gap-2">
              <span className="text-slate-500 font-medium">Bo‘lim:</span>
              <span className="font-bold text-slate-800 text-right">{employee.department}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-sky-50">
              <span className="text-slate-500 font-medium">Telefon:</span>
              <a href={`tel:${employee.phone}`} className="font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {employee.phone}
              </a>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="space-y-2.5 pt-2 border-t border-sky-100">
          <Link
            href={`/history?employeeId=${employee.employeeId}`}
            className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-bold text-xs py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-500/25 active:scale-95"
          >
            <Route className="w-4 h-4" />
            Bugungi Marshrutni Ko‘rish
          </Link>
          <Link
            href={`/sessions?employeeId=${employee.employeeId}`}
            className="w-full bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 font-bold text-xs py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all border border-sky-100/80 shadow-2xs active:scale-95"
          >
            <History className="w-4 h-4 text-sky-600" />
            Ish Seanslari Tarixi
          </Link>
        </div>
      </div>
    </div>
  );
}
