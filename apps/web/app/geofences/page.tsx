'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Geofence } from '@repo/types';
import { ShieldAlert, Plus, MapPin, CheckCircle2 } from 'lucide-react';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="p-4 text-xs text-slate-500">Geozonalar xaritasi...</div>,
});

export default function GeofencesPage() {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Bandixon Tuman Hokimligi',
    latitude: 37.5255,
    longitude: 67.2458,
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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Geozonalar va Chegaralangan Hududlar" />

        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full flex-1 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-sky-600" />
              Nazorat ostidagi geozonalar
            </h3>

            <button
              onClick={() => setShowModal(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Yangi Geozona Yaratish
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
            {/* List of Geofences */}
            <div className="space-y-3 overflow-y-auto max-h-[500px]">
              {geofences.map((gf) => (
                <div key={gf.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-900 text-sm">
                    <span>{gf.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px]">Faol</span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-600" />
                    Radius: <strong className="text-slate-800">{gf.radius} metr</strong>
                  </p>
                  <div className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                    GPS: {gf.latitude}, {gf.longitude}
                  </div>
                </div>
              ))}
            </div>

            {/* Geofence Visualizer Map */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden min-h-[450px]">
              <MapView geofences={geofences} />
            </div>
          </div>
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Yangi Geozona Kiritish</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Geozona Nomi</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Masalan: Bandixon Tuman Hokimligi"
                  className="w-full p-2 border border-slate-200 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Kenglik (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Uzunlik (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                    className="w-full p-2 border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Radius (Metrlarda)</label>
                <input
                  type="number"
                  required
                  value={formData.radius}
                  onChange={(e) => setFormData({ ...formData, radius: Number(e.target.value) })}
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
