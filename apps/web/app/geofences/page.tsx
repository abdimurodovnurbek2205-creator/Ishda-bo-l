'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Geofence } from '@repo/types';
import { ShieldAlert, Plus, MapPin, CheckCircle2, X, RefreshCw } from 'lucide-react';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-sky-50/50 text-slate-500 font-bold text-xs">
      <div className="flex items-center gap-2 p-4 rounded-2xl glass-panel shadow-lg">
        <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
        <span>Geozonalar xaritasi yuklanmoqda...</span>
      </div>
    </div>
  ),
});

export default function GeofencesPage() {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "Bandixon tuman O'simliklar karantini va himoyasi bo'limi",
    latitude: 37.842429,
    longitude: 67.377811,
    radius: 500,
  });

  const fetchGeofences = async () => {
    try {
      const res = await fetch('/api/geofences');
      const data = await res.json();
      if (Array.isArray(data)) setGeofences(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGeofences();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/geofences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowModal(false);
        fetchGeofences();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex min-h-screen relative text-slate-900">
      {/* Ambient background light orbs */}
      <div className="fixed top-12 right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-sky-400/25 via-cyan-300/20 to-blue-500/10 blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="fixed bottom-16 left-60 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-teal-300/20 via-sky-300/20 to-indigo-400/15 blur-3xl pointer-events-none -z-10" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        <Header title="Geozonalar va Chegaralangan Hududlar" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full flex-1 flex flex-col relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-xs shadow-purple-500/50"></span>
                Nazorat Ostidagi Geozonalar
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Xodimlar ushbu hududlarga kirganda yoki chiqqanda avtomatik qayd etiladi
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="group bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white text-xs font-bold px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-sky-500/25 hover:shadow-sky-400/40 transition-all active:scale-95 border border-white/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>Yangi Geozona Yaratish</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">
            {/* List of Geofences */}
            <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1">
              {geofences.map((gf) => (
                <div
                  key={gf.id}
                  className="glass-panel p-5 rounded-3xl border border-white/80 shadow-md space-y-2.5 hover:-translate-y-1 transition-all"
                >
                  <div className="flex items-center justify-between font-extrabold text-slate-900 text-sm">
                    <span className="line-clamp-1">{gf.name}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 border border-emerald-300/60 font-bold text-[10px]">
                      Faol
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                    <MapPin className="w-4 h-4 text-sky-600" />
                    Radius: <strong className="text-slate-900 font-bold">{gf.radius} metr</strong>
                  </p>
                  <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-sky-100 flex justify-between">
                    <span>GPS Markaz:</span>
                    <strong className="text-sky-900">{gf.latitude}, {gf.longitude}</strong>
                  </div>
                </div>
              ))}
            </div>

            {/* Geofence Visualizer Map */}
            <div className="lg:col-span-2 glass-panel rounded-3xl border border-white/80 shadow-xl overflow-hidden min-h-[500px]">
              <MapView geofences={geofences} />
            </div>
          </div>
        </main>
      </div>

      {/* Modal for adding geofence */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-white/90">
            <div className="flex items-center justify-between pb-3 border-b border-sky-100">
              <h3 className="text-base font-extrabold text-slate-900">Yangi Geozona Belgilash</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-sky-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Geozona Nomi</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-white/80 border border-sky-200/80 rounded-2xl outline-none focus:border-sky-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kenglik (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    className="w-full p-2.5 bg-white/80 border border-sky-200/80 rounded-2xl outline-none focus:border-sky-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Uzunlik (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    className="w-full p-2.5 bg-white/80 border border-sky-200/80 rounded-2xl outline-none focus:border-sky-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Radius (metrda)</label>
                <input
                  type="number"
                  required
                  value={formData.radius}
                  onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) })}
                  className="w-full p-2.5 bg-white/80 border border-sky-200/80 rounded-2xl outline-none focus:border-sky-500 font-mono font-bold"
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
                  Yaratish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
