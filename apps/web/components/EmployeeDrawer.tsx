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
} from 'lucide-react';
import Link from 'next/link';

interface EmployeeDrawerProps {
  employee: EmployeeLiveSummary | null;
  onClose: () => void;
}

export function EmployeeDrawer({ employee, onClose }: EmployeeDrawerProps) {
  if (!employee) return null;

  let statusBadge = (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
      Ishda (GPS faol)
    </span>
  );

  if (employee.status === 'DELAYED') {
    statusBadge = (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
        Lokatsiya kechikmoqda
      </span>
    );
  } else if (employee.status === 'OFFLINE' || employee.status === 'NOT_WORKING') {
    statusBadge = (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
        Offline / Ishda emas
      </span>
    );
  }

  const lastUpdateText =
    employee.lastUpdateAgoSeconds !== undefined
      ? `${employee.lastUpdateAgoSeconds} soniya avval`
      : 'Ma‘lumot yo‘q';

  return (
    <div className="absolute top-4 right-4 z-20 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-120px)] animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow">
            {employee.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">{employee.name}</h3>
            <p className="text-xs text-sky-400">{employee.employeeCode} | {employee.position}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body details */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* Status bar */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Monitoring holati</span>
          {statusBadge}
        </div>

        {/* Current Location Info */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Joriy Joylashuv</h4>
          <div className="bg-sky-50 border border-sky-100 p-3 rounded-lg space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-600" />
                Tuman / Shahar:
              </span>
              <span className="font-bold text-slate-900">{employee.currentDistrict}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Viloyat:</span>
              <span className="font-semibold text-slate-800">{employee.currentRegion}</span>
            </div>

            {employee.latestLocation && (
              <div className="flex items-center justify-between pt-1 border-t border-sky-200/60">
                <span className="text-slate-600 font-medium">GPS Koordinatalar:</span>
                <span className="font-mono text-slate-700 text-[11px]">
                  {employee.latestLocation.latitude.toFixed(5)}, {employee.latestLocation.longitude.toFixed(5)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-sky-200/60 text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Oxirgi yangilanish:
              </span>
              <span className="font-medium text-slate-700">{lastUpdateText}</span>
            </div>
          </div>
        </div>

        {/* Work Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Navigation className="w-4 h-4 text-emerald-600" />
              Bugungi Masofa
            </div>
            <p className="text-lg font-bold text-slate-900">{employee.todayDistanceKm} km</p>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Clock className="w-4 h-4 text-sky-600" />
              Ish Vaqti
            </div>
            <p className="text-sm font-bold text-slate-900">{employee.workingHoursStart} - {employee.workingHoursEnd}</p>
          </div>
        </div>

        {/* Profile metadata */}
        <div className="space-y-2 text-xs">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Xodim Ma‘lumotlari</h4>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
            <p className="flex justify-between">
              <span className="text-slate-500">Bo‘lim:</span>
              <span className="font-medium text-slate-800">{employee.department}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-500">Telefon:</span>
              <span className="font-medium text-slate-800">{employee.phone}</span>
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <Link
            href={`/history?employeeId=${employee.employeeId}`}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <Route className="w-4 h-4" />
            Bugungi Marshrutni Ko‘rish
          </Link>
          <Link
            href={`/sessions?employeeId=${employee.employeeId}`}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <History className="w-4 h-4" />
            Ish Seanslari Tarixi
          </Link>
        </div>
      </div>
    </div>
  );
}
