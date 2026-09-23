'use client';

import React, { useState, useEffect } from 'react';
import { User, Employee } from '@repo/types';
import { Shield, MapPin, Play, Square, Clock, Navigation, CheckCircle2, LogOut, Phone, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EmployeeDashboardViewProps {
  user: User;
  employee: Employee | null;
}

export function EmployeeDashboardView({ user, employee }: EmployeeDashboardViewProps) {
  const router = useRouter();
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [message, setMessage] = useState<string>('');

  const [gpsError, setGpsError] = useState<string>('');

  const fetchSession = async () => {
    if (!employee) return;
    try {
      const res = await fetch(`/api/work-sessions?employeeId=${employee.id}`);
      const data = await res.json();
      if (data.session) {
        setActiveSession(data.session);
      } else {
        setActiveSession(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [lastSentTime, setLastSentTime] = useState<string>('');

  const sendLocationUpdate = async (lat: number, lng: number, speed?: number | null, heading?: number | null, accuracy?: number | null) => {
    if (!employee) return;
    try {
      const payload = {
        employeeId: employee.id,
        latitude: lat,
        longitude: lng,
        accuracy: accuracy ?? 5,
        speed: speed ?? 0,
        heading: heading ?? 0,
        timestamp: new Date().toISOString(),
      };
      const token = localStorage.getItem('auth_token');
      await fetch('/api/location/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      setLastSentTime(new Date().toLocaleTimeString('uz-UZ'));
    } catch (e) {
      console.error('Failed to post live location update', e);
    }
  };

  useEffect(() => {
    fetchSession();

    let watchId: number | null = null;
    let syncInterval: any = null;

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed, heading, accuracy } = pos.coords;
          setCurrentCoords({ lat: latitude, lng: longitude });
          setGpsError('');
          if (activeSession) {
            sendLocationUpdate(latitude, longitude, speed, heading, accuracy);
          }
        },
        (err) => {
          console.log('Geolocation watch error:', err);
          setGpsError('⚠️ Telefoningizda GPS o‘chirilgan yoki brauzerga joylashuv ruxsati berilmagan. Iltimos, sozlamalardan GPS va Ruxsatni yoqing!');
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
      );
    } else {
      setGpsError('⚠️ Qurilmangizda geolokatsiya qo‘llab-quvvatlanmaydi.');
    }

    if (activeSession) {
      syncInterval = setInterval(() => {
        if (currentCoords) {
          sendLocationUpdate(currentCoords.lat, currentCoords.lng);
        }
      }, 10000);
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [employee, activeSession?.id]);

  const handleStartSession = async () => {
    if (!employee) return;
    if (!currentCoords) {
      setMessage('⚠️ GPS joylashuv hali aniqlanmadi. Telefonda GPS-ni yoqing va brauzerga joylashuv ruxsatini bering!');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const lat = currentCoords.lat;
      const lng = currentCoords.lng;

      const res = await fetch('/api/work-sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: employee.id, latitude: lat, longitude: lng }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveSession(data.session);
        setMessage('✅ Ish kuni va haqiqiy GPS monitoring boshlandi!');
        sendLocationUpdate(lat, lng);
      } else {
        setMessage(`❌ Xatolik: ${data.error}`);
      }
    } catch (e: any) {
      setMessage(`❌ Xatolik: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!employee) return;
    setLoading(true);
    setMessage('');
    try {
      const lat = currentCoords?.lat || 37.842429;
      const lng = currentCoords?.lng || 67.377811;

      const res = await fetch('/api/work-sessions/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: employee.id, latitude: lat, longitude: lng }),
      });
      if (res.ok) {
        setActiveSession(null);
        setMessage('🏁 Ish kuni yakunlandi.');
      }
    } catch (e: any) {
      setMessage(`❌ Xatolik: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-start p-4 md:p-8">
      <div className="max-w-xl w-full bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-sky-600 to-sky-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">BANDIXON MONITORING</h2>
              <p className="text-xs text-sky-100">Xodim Shaxsiy Kabineti</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Chiqish
          </button>
        </div>

        {/* User Card */}
        <div className="p-6 space-y-6">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-700/60 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-sky-500/20 text-sky-400 font-bold text-xl flex items-center justify-center border border-sky-500/30">
              {user.name ? user.name.charAt(0) : 'X'}
            </div>
            <div className="space-y-1 min-w-0">
              <h3 className="font-bold text-white text-base truncate">{user.name}</h3>
              <p className="text-xs text-sky-400 font-semibold flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> {employee?.position || 'Xodim'}
              </p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-500" /> {user.phone}
              </p>
            </div>
          </div>

          {gpsError && (
            <div className="p-3 rounded-lg bg-rose-900/60 border border-rose-700 text-rose-200 text-xs text-center font-semibold">
              {gpsError}
            </div>
          )}

          {message && (
            <div className="p-3 rounded-lg bg-sky-900/50 border border-sky-700 text-sky-200 text-xs text-center font-medium">
              {message}
            </div>
          )}

          {/* Session Controller Card */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border" style={{
              backgroundColor: activeSession ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
              borderColor: activeSession ? 'rgba(16, 185, 129, 0.4)' : 'rgba(100, 116, 139, 0.4)',
              color: activeSession ? '#34d399' : '#94a3b8'
            }}>
              <span className={`w-2 h-2 rounded-full ${activeSession ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
              {activeSession ? 'ISH KUNI FAOL (GPS MONITORING)' : 'ISH KUNI BOSHLANMAGAN'}
            </div>

            {activeSession ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4 text-xs text-slate-300">
                  <p>
                    Boshlangan vaqti: <span className="font-mono text-emerald-400 font-bold">{new Date(activeSession.startedAt).toLocaleTimeString()}</span>
                  </p>
                  {lastSentTime && (
                    <p className="text-[11px] text-sky-400 font-medium">
                      📡 So‘nggi GPS: <span className="font-mono font-bold text-sky-300">{lastSentTime}</span>
                    </p>
                  )}
                </div>
                <button
                  onClick={handleEndSession}
                  disabled={loading}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
                >
                  <Square className="w-5 h-5 fill-current" />
                  Ish Kunini Yakunlash
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Kunlik ish vaqti rejimingizni boshlash uchun quyidagi tugmani bosing.
                </p>
                <button
                  onClick={handleStartSession}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Ish Kunini Boshlash
                </button>
              </div>
            )}
          </div>

          {/* Location details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Joriy Tuman</span>
              <p className="font-bold text-sky-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-sky-400" /> Bandixon tumani
              </p>
            </div>
            <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Ish Rejimi</span>
              <p className="font-bold text-slate-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> {employee?.workingHoursStart || '09:00'} - {employee?.workingHoursEnd || '18:00'}
              </p>
            </div>
          </div>

          {/* Info note */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">📌 Diqqat:</p>
            <p>Ish vaqti davomida geolokatsiyangiz avtomatik tarzda Bo'lim boshlig'i Bo'riyev Shuxrat kuzatuv paneliga uzatilib turadi.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
