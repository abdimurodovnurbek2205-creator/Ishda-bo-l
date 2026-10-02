'use client';

import React, { useState, useEffect, useRef } from 'react';
import { User, Employee } from '@repo/types';
import {
  Shield,
  MapPin,
  Play,
  Square,
  Clock,
  Navigation,
  CheckCircle2,
  LogOut,
  Phone,
  Award,
  Wifi,
  WifiOff,
  CloudUpload,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { offlineSyncManager, QueuedLocation } from '@/lib/offline-sync';
import { DedicatedWorkerIcon } from './DedicatedWorkerIcon';

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
  const [lastSentTime, setLastSentTime] = useState<string>('');

  // Offline sync & network states
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);

  // Time & countdown states
  const [workDuration, setWorkDuration] = useState<string>('00:00:00');
  const [timeUntil18, setTimeUntil18] = useState<string>('');

  // 1. Initial Load & Session Recovery (Persists through reload until 18:00)
  useEffect(() => {
    if (!employee) return;

    // Check offline queue count
    setOfflineQueueCount(offlineSyncManager.getQueue().length);
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

    // Check local persistent session first (guarantees session stays active even if refreshed!)
    const localSession = offlineSyncManager.getSession(employee.id);
    const before18 = offlineSyncManager.isBeforeEndOfDay();

    if (localSession && before18) {
      setActiveSession(localSession);
      console.log('[Session] Restored active session from persistent local cache:', localSession);
    }

    // In parallel, verify with backend
    fetch(`/api/work-sessions?employeeId=${employee.id}`)
      .then((res) => res.json())
      .then((data) => {
        const found = data?.session || (Array.isArray(data) ? data.find((s: any) => s.employeeId === employee.id && s.status === 'ACTIVE') : null);
        if (found) {
          setActiveSession(found);
          offlineSyncManager.saveSession(employee.id, found);
        } else if (localSession && before18) {
          // If server restarted but local session is active for today before 18:00, re-sync with server!
          fetch('/api/work-sessions/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: employee.id,
              latitude: localSession.startLatitude || 37.842429,
              longitude: localSession.startLongitude || 67.377811,
            }),
          })
            .then((r) => r.json())
            .then((restarted) => {
              if (restarted.session) {
                setActiveSession(restarted.session);
                offlineSyncManager.saveSession(employee.id, restarted.session);
              }
            })
            .catch(() => {});
        }
      })
      .catch((e) => console.error('Fetch session error:', e));

    // Online / Offline network listeners
    const handleOnline = async () => {
      setIsOnline(true);
      setMessage('📶 Internet aloqasi tiklandi! Dala ma‘lumotlari sinxronizatsiya qilinmoqda...');
      const res = await offlineSyncManager.flush();
      if (res.uploadedCount > 0) {
        setMessage(`✅ Dala hududida to‘plangan ${res.uploadedCount} ta GPS nuqtasi serverga muvaffaqiyatli uzatildi!`);
      }
      setOfflineQueueCount(offlineSyncManager.getQueue().length);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setMessage('⚠️ Internet uzildi (Dala rejimi). Xavotir olmang: GPS sun‘iy yo‘ldosh orqali xotiraga to‘planaveradi!');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [employee?.id]);

  // 2. Timer: Elapsed work duration & Countdown to 18:00
  useEffect(() => {
    if (!activeSession?.startedAt) return;

    const timer = setInterval(() => {
      const start = new Date(activeSession.startedAt).getTime();
      const now = Date.now();
      const elapsed = Math.max(0, Math.floor((now - start) / 1000));

      const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
      const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
      const s = String(elapsed % 60).padStart(2, '0');
      setWorkDuration(`${h}:${m}:${s}`);

      // Calculate time until 18:00 Tashkent
      const nowD = new Date();
      const endD = new Date();
      endD.setHours(18, 0, 0, 0);

      const diffMs = endD.getTime() - nowD.getTime();
      if (diffMs > 0) {
        const leftH = Math.floor(diffMs / 3600000);
        const leftM = Math.floor((diffMs % 3600000) / 60000);
        setTimeUntil18(`${leftH} soat ${leftM} daqiqa`);
      } else {
        setTimeUntil18('Ish vaqti yakunlandi (18:00 dan keyin)');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession?.startedAt]);

  // 3. Location Sender with Offline Fallback
  const sendLocationUpdate = async (
    lat: number,
    lng: number,
    speed?: number | null,
    heading?: number | null,
    accuracy?: number | null
  ) => {
    if (!employee) return;

    const payload: QueuedLocation = {
      employeeId: employee.id,
      latitude: lat,
      longitude: lng,
      accuracy: accuracy ?? 5,
      speed: speed ?? 0,
      heading: heading ?? 0,
      timestamp: new Date().toISOString(),
    };

    // If device is offline (e.g. out in distant agricultural fields with no cell signal)
    if (!navigator.onLine) {
      const qLen = offlineSyncManager.enqueue(payload);
      setOfflineQueueCount(qLen);
      setLastSentTime(`${new Date().toLocaleTimeString('uz-UZ')} (Xotirada)`);
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/location/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Network response not ok');

      setLastSentTime(new Date().toLocaleTimeString('uz-UZ'));

      // If there are pending points from earlier offline moments in the field, flush them now!
      if (offlineSyncManager.getQueue().length > 0) {
        const flushRes = await offlineSyncManager.flush(token);
        setOfflineQueueCount(offlineSyncManager.getQueue().length);
        if (flushRes.uploadedCount > 0) {
          setMessage(`✅ Aloqa tiklandi: Daladagi ${flushRes.uploadedCount} ta nuqta boshliq platformasiga tushdi.`);
        }
      }
    } catch (e) {
      // Network failed during send -> save to offline queue safely
      const qLen = offlineSyncManager.enqueue(payload);
      setOfflineQueueCount(qLen);
      setLastSentTime(`${new Date().toLocaleTimeString('uz-UZ')} (Xotirada)`);
    }
  };

  // 4. GPS Watch Position Loop
  useEffect(() => {
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
          console.warn('Geolocation watch notice:', err);
          if (err.code === err.PERMISSION_DENIED) {
            setGpsError('⚠️ Brauzerga geolokatsiya ruxsati berilmagan. Iltimos, brauzer sozlamalaridan ruxsatni yoqing!');
          }
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 25000 }
      );
    } else {
      setGpsError('⚠️ Qurilmangizda geolokatsiya qo‘llab-quvvatlanmaydi.');
    }

    // Periodic heartbeat sync every 15 seconds while active
    if (activeSession) {
      syncInterval = setInterval(() => {
        if (currentCoords) {
          sendLocationUpdate(currentCoords.lat, currentCoords.lng);
        }
      }, 15000);
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [employee?.id, activeSession?.id, currentCoords?.lat, currentCoords?.lng]);

  // 5. Start Work Session ("Ishda bo'l")
  const handleStartSession = async () => {
    if (!employee) return;

    setLoading(true);
    setMessage('');

    // Fallback coordinates if GPS is still warming up
    const lat = currentCoords?.lat || 37.842429;
    const lng = currentCoords?.lng || 67.377811;

    try {
      const res = await fetch('/api/work-sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employee.id,
          latitude: lat,
          longitude: lng,
        }),
      });

      const data = await res.json();
      if (res.ok && data.session) {
        setActiveSession(data.session);
        // Persist session to local storage until 18:00 (guarantees survival against phone reload!)
        offlineSyncManager.saveSession(employee.id, data.session);
        setMessage('✅ "Ishda bo‘l" faollashtirildi! Lokatsiyangiz 18:00 gacha uzluksiz kuzatiladi.');
        sendLocationUpdate(lat, lng);
      } else {
        setMessage(`❌ Xatolik: ${data.error || 'Ishni boshlashda xatolik yuz berdi'}`);
      }
    } catch (e: any) {
      // Even if network failed, create local persistent session
      const offlineSession = {
        id: `local-ws-${Date.now()}`,
        employeeId: employee.id,
        startedAt: new Date().toISOString(),
        startLatitude: lat,
        startLongitude: lng,
        status: 'ACTIVE',
      };
      setActiveSession(offlineSession);
      offlineSyncManager.saveSession(employee.id, offlineSession);
      setMessage('✅ Ish kuni xotirada boshlandi (Offline rejim).');
    } finally {
      setLoading(false);
    }
  };

  // 6. End Work Session
  const handleEndSession = async () => {
    if (!employee) return;

    if (!confirm('Haqiqatan ham bugungi ish kunini yakunlamoqchimisiz?')) return;

    setLoading(true);
    setMessage('');
    try {
      const lat = currentCoords?.lat || 37.842429;
      const lng = currentCoords?.lng || 67.377811;

      await fetch('/api/work-sessions/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: employee.id, latitude: lat, longitude: lng }),
      });

      // Clear local persistent session
      offlineSyncManager.clearSession(employee.id);
      setActiveSession(null);
      setMessage('🏁 Ish kuni muvaffaqiyatli yakunlandi. Rahmat!');
    } catch (e: any) {
      offlineSyncManager.clearSession(employee.id);
      setActiveSession(null);
      setMessage('🏁 Ish kuni yakunlandi.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-glass-pattern text-slate-900 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-sky-300/25 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-300/25 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-xl w-full glass-panel rounded-3xl border border-white/80 shadow-2xl overflow-hidden relative z-10 backdrop-blur-xl">
        {/* Top Header with Dedicated Worker Icon */}
        <div className="bg-gradient-to-br from-sky-600/90 via-sky-700/90 to-blue-800/90 p-5 text-white flex items-center justify-between backdrop-blur-md relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <DedicatedWorkerIcon size="sm" showTooltip={false} />
            <div>
              <h2 className="font-black text-sm sm:text-base tracking-tight leading-tight">BANDIXON MONITORING</h2>
              <p className="text-[11px] text-sky-100 font-medium">Xodim Shaxsiy Kabineti ("Ishda bo‘l")</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border border-white/20"
          >
            <LogOut className="w-3.5 h-3.5" /> Chiqish
          </button>
        </div>

        <div className="p-5 sm:p-7 space-y-5">
          {/* User Profile Card with Animated Worker Icon */}
          <div className="bg-white/85 p-4 rounded-3xl border border-slate-200/80 shadow-md flex items-center gap-4 backdrop-blur-md">
            <DedicatedWorkerIcon size="md" showTooltip={false} />
            <div className="space-y-0.5 min-w-0 flex-1">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">{user.name}</h3>
              <p className="text-xs text-sky-700 font-bold flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-sky-600 shrink-0" /> {employee?.position || 'Karantin nazoratchisi'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" /> {user.phone}
              </p>
            </div>
          </div>

          {/* Connection & Offline Status Pill */}
          <div className="flex items-center justify-between text-xs px-3.5 py-2.5 rounded-2xl bg-white/70 border border-slate-200/80 font-semibold shadow-xs">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-800 font-bold">Internet bor (Jonli GPS)</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span className="text-amber-800 font-bold">Internet yo‘q (Dala / Offline)</span>
                </>
              )}
            </div>

            {offlineQueueCount > 0 ? (
              <span className="text-[11px] text-sky-800 bg-sky-100/90 px-3 py-1 rounded-full border border-sky-300 font-bold animate-pulse">
                🌾 {offlineQueueCount} ta nuqta xotirada
              </span>
            ) : (
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
                ✓ Barcha nuqtalar uzatilgan
              </span>
            )}
          </div>

          {gpsError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold text-center shadow-xs">
              {gpsError}
            </div>
          )}

          {message && (
            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-medium text-center shadow-xs">
              {message}
            </div>
          )}

          {/* Session Controller Card with Hero Worker Showcase */}
          <div className="bg-white/90 p-6 rounded-3xl border border-sky-200/80 text-center space-y-4 shadow-xl shadow-sky-900/5 backdrop-blur-md relative overflow-hidden">
            {/* Center Animated Worker Icon Badge */}
            <div className="flex flex-col items-center justify-center pt-1">
              <div className="relative p-1.5 rounded-3xl bg-gradient-to-b from-sky-400/20 via-sky-300/10 to-transparent border border-sky-200/60 shadow-lg">
                <DedicatedWorkerIcon size="lg" />
              </div>
              <p className="text-[11px] font-bold text-sky-800 mt-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {activeSession ? 'Har qanday ob-havoda o‘z burchida — "Ishda bo‘l"' : 'Ertalabki ishni boshlash timsoli'}
              </p>
            </div>

            {/* Status Beacon */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black tracking-wide border shadow-2xs ${
                activeSession
                  ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-800'
                  : 'bg-slate-100 border-slate-300 text-slate-600'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  activeSession ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
                }`}
              ></span>
              {activeSession ? 'ISHDA BO‘LISH FAOL (18:00 gacha uzluksiz)' : 'ISH KUNI BOSHLANMAGAN'}
            </div>

            {activeSession ? (
              <div className="space-y-4 pt-1">
                {/* Timer Display */}
                <div className="bg-gradient-to-br from-slate-900 to-sky-950 p-4 rounded-2xl text-white shadow-inner border border-sky-400/30">
                  <p className="text-[10px] text-sky-300 font-bold tracking-wider uppercase">Ish vaqti hisoblagichi</p>
                  <p className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-emerald-400 mt-0.5">
                    {workDuration}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-sky-200 pt-2 border-t border-sky-500/20 mt-2 font-medium">
                    <span>Kelgan vaqti: <strong className="text-white font-mono">{new Date(activeSession.startedAt).toLocaleTimeString('uz-UZ')}</strong></span>
                    <span>18:00 gacha: <strong className="text-amber-300">{timeUntil18}</strong></span>
                  </div>
                </div>

                {lastSentTime && (
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-600 font-semibold">
                    <Navigation className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
                    <span>So‘nggi GPS signali: <strong className="text-slate-900 font-mono">{lastSentTime}</strong></span>
                  </div>
                )}

                <div className="p-3 rounded-2xl bg-sky-50/80 border border-sky-200/80 text-[11px] text-sky-900 text-left space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-sky-800">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Dala va har qanday hududda himoyalangan:
                  </p>
                  <p>Ilovani yopsangiz ham, telefoningizni o‘chirib-yoqsangiz ham yoki internet yo‘q dalaga chiqsangiz ham GPS o‘chmaydi. 18:00 da yoki ish yakunida barcha joylashuvlar to‘liq saqlanadi.</p>
                </div>

                <button
                  onClick={handleEndSession}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 active:scale-[0.99] transition-all cursor-pointer text-xs"
                >
                  <Square className="w-4 h-4 fill-current" />
                  Ish Kunini Yakunlash
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Ertalab ishxonaga kelganda quyidagi tugmani bosing. Ishxonadan boshlang‘ich geolokatsiya olinadi va soat 18:00 gacha faol turadi.
                </p>

                <button
                  onClick={handleStartSession}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/30 active:scale-[0.99] transition-all cursor-pointer text-sm tracking-wide"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Geolokatsiya aniqlanmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span>ISHDA BO‘LISHNI BOSHLASH</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Quick info metrics */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Hudud</span>
              <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" /> Bandixon tumani
              </p>
            </div>
            <div className="bg-white/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ish Rejimi</span>
              <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {employee?.workingHoursStart || '09:00'} - {employee?.workingHoursEnd || '18:00'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
