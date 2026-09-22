'use client';

import React, { useEffect, useRef, useState } from 'react';
import { EmployeeLiveSummary, LocationPoint, Geofence } from '@repo/types';
import { Map, Layers, Mountain, Globe } from 'lucide-react';

interface MapViewProps {
  employees?: EmployeeLiveSummary[];
  selectedEmployeeId?: string | null;
  onSelectEmployee?: (emp: EmployeeLiveSummary) => void;
  routePoints?: LocationPoint[];
  geofences?: Geofence[];
  center?: [number, number];
  zoom?: number;
}

type MapMode = 'standard' | 'satellite' | 'relief' | 'hybrid';

const MAP_LAYERS: Record<MapMode, { name: string; url: string; attribution: string; subdomains?: string[] }> = {
  standard: {
    name: 'Vektor',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap | Bandixon Monitoring',
  },
  satellite: {
    name: 'Yo‘ldosh (Sputnik)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri World Imagery | Bandixon Monitoring',
  },
  relief: {
    name: 'Relyef (Tog‘lar)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap | Bandixon Monitoring',
  },
  hybrid: {
    name: 'Gibrat (Sputnik + Ko‘cha)',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '© Google Maps | Bandixon Monitoring',
  },
};

export default function MapView({
  employees = [],
  selectedEmployeeId = null,
  onSelectEmployee,
  routePoints = [],
  geofences = [],
  center = [37.842429, 67.377811], // Default Bandixon tuman O'simliklar karantini va himoyasi bo'limi
  zoom = 13,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const geofenceGroupRef = useRef<any>(null);

  const [activeMapMode, setActiveMapMode] = useState<MapMode>('standard');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadLeaflet = async () => {
      const L = (await import('leaflet')).default;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current).setView(center, zoom);

        const config = MAP_LAYERS.standard;
        tileLayerRef.current = L.tileLayer(config.url, {
          maxZoom: 19,
          attribution: config.attribution,
        }).addTo(map);

        markersGroupRef.current = L.layerGroup().addTo(map);
        routeLayerRef.current = L.layerGroup().addTo(map);
        geofenceGroupRef.current = L.layerGroup().addTo(map);

        mapInstanceRef.current = map;
      }
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch Tile Layer when activeMapMode changes
  const switchMapMode = async (mode: MapMode) => {
    setActiveMapMode(mode);
    if (!mapInstanceRef.current) return;

    const L = (await import('leaflet')).default;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const config = MAP_LAYERS[mode];
    tileLayerRef.current = L.tileLayer(config.url, {
      maxZoom: 19,
      attribution: config.attribution,
    }).addTo(mapInstanceRef.current);
  };

  // Update Markers when employees prop changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    const renderMarkers = async () => {
      const L = (await import('leaflet')).default;
      markersGroupRef.current.clearLayers();

      employees.forEach((emp) => {
        if (!emp.latestLocation) return;

        const { latitude, longitude } = emp.latestLocation;
        let colorClass = 'bg-emerald-500 border-white text-white';
        let statusBadge = 'Ishda';

        if (emp.status === 'DELAYED') {
          colorClass = 'bg-amber-500 border-white text-white';
          statusBadge = 'Kechikmoqda';
        } else if (emp.status === 'OFFLINE' || emp.status === 'NOT_WORKING') {
          colorClass = 'bg-rose-500 border-white text-white';
          statusBadge = 'Offline';
        }

        const isSelected = emp.employeeId === selectedEmployeeId;

        const customIcon = L.divIcon({
          className: 'custom-map-marker',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="w-8 h-8 rounded-full ${colorClass} border-2 shadow-lg flex items-center justify-center font-bold text-xs ${isSelected ? 'ring-4 ring-sky-400 scale-125' : ''}">
                ${emp.name.substring(0, 2).toUpperCase()}
              </div>
              <span class="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-90 shadow-md">
                ${emp.name}
              </span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([latitude, longitude], { icon: customIcon });

        const lastUpdateText = emp.lastUpdateAgoSeconds !== undefined
          ? `${emp.lastUpdateAgoSeconds} sek avval`
          : 'Yaqinda';

        marker.bindPopup(`
          <div class="p-1 text-slate-800 text-xs">
            <h4 class="font-bold text-sm text-slate-900">${emp.name}</h4>
            <p class="text-slate-600">${emp.position} (${emp.department})</p>
            <div class="mt-2 space-y-1 border-t pt-1 text-[11px]">
              <p><strong>Holat:</strong> <span class="font-semibold">${statusBadge}</span></p>
              <p><strong>Tuman:</strong> ${emp.currentDistrict}</p>
              <p><strong>Viloyat:</strong> ${emp.currentRegion}</p>
              <p><strong>Oxirgi yangilanish:</strong> ${lastUpdateText}</p>
              <p><strong>Bugungi masofa:</strong> ${emp.todayDistanceKm} km</p>
            </div>
          </div>
        `);

        marker.on('click', () => {
          if (onSelectEmployee) onSelectEmployee(emp);
        });

        markersGroupRef.current.addLayer(marker);
      });
    };

    renderMarkers();
  }, [employees, selectedEmployeeId, onSelectEmployee]);

  const prevSelectedEmpIdRef = useRef<string | null>(null);
  const hasFittedRouteRef = useRef<boolean>(false);

  // Reset route fit state when routePoints change
  useEffect(() => {
    hasFittedRouteRef.current = false;
  }, [routePoints]);

  // Auto-fly map view ONLY when selectedEmployeeId changes to a new employee ID
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedEmployeeId) return;

    if (prevSelectedEmpIdRef.current !== selectedEmployeeId) {
      prevSelectedEmpIdRef.current = selectedEmployeeId;
      const target = employees.find((e) => e.employeeId === selectedEmployeeId);
      if (target && target.latestLocation) {
        mapInstanceRef.current.flyTo(
          [target.latestLocation.latitude, target.latestLocation.longitude],
          16,
          { animate: true, duration: 1 }
        );
      }
    }
  }, [selectedEmployeeId, employees]);

  // Render Polyline Route when routePoints are provided
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerRef.current) return;

    const renderRoute = async () => {
      const L = (await import('leaflet')).default;
      routeLayerRef.current.clearLayers();

      if (routePoints.length < 1) return;

      const coords: [number, number][] = routePoints.map((p) => [p.latitude, p.longitude]);

      // Render Polyline Path
      if (coords.length >= 2) {
        const polyline = L.polyline(coords, {
          color: '#0284c7',
          weight: 5,
          opacity: 0.85,
          lineJoin: 'round',
          lineCap: 'round',
        });
        routeLayerRef.current.addLayer(polyline);
      }

      // Render Intermediate Waypoint Markers (Turns & Stops along the street)
      routePoints.forEach((pt, index) => {
        const timeStr = pt.timestamp
          ? new Date(pt.timestamp).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
          : '';
        const speedStr = pt.speed ? `${pt.speed} km/s` : '0 km/s';

        if (index === 0) {
          // Start Marker (Green Pin)
          const startMarker = L.circleMarker([pt.latitude, pt.longitude], {
            radius: 10,
            fillColor: '#10b981',
            color: '#ffffff',
            weight: 3,
            fillOpacity: 1,
          }).bindPopup(`
            <div class="p-1 text-xs">
              <h5 class="font-bold text-emerald-700">🚀 Boshlanish Joyi (Start)</h5>
              <p><strong>Vaqt:</strong> ${timeStr}</p>
              <p><strong>Joy:</strong> ${pt.district || 'Bandixon tumani'}</p>
            </div>
          `);
          routeLayerRef.current.addLayer(startMarker);
        } else if (index === routePoints.length - 1) {
          // End Marker (Red Pin)
          const endMarker = L.circleMarker([pt.latitude, pt.longitude], {
            radius: 10,
            fillColor: '#ef4444',
            color: '#ffffff',
            weight: 3,
            fillOpacity: 1,
          }).bindPopup(`
            <div class="p-1 text-xs">
              <h5 class="font-bold text-rose-700">🏁 Oxirgi Joylashuv (Finish)</h5>
              <p><strong>Vaqt:</strong> ${timeStr}</p>
              <p><strong>Joy:</strong> ${pt.district || 'Bandixon tumani'}</p>
            </div>
          `);
          routeLayerRef.current.addLayer(endMarker);
        } else {
          // Waypoint Dot Marker (Blue Circle with sequence number)
          const wayIcon = L.divIcon({
            className: 'custom-waypoint-marker',
            html: `
              <div class="w-6 h-6 rounded-full bg-sky-600 border-2 border-white shadow-md flex items-center justify-center font-bold text-[10px] text-white">
                ${index + 1}
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          const wayMarker = L.marker([pt.latitude, pt.longitude], { icon: wayIcon }).bindPopup(`
            <div class="p-1 text-xs text-slate-800">
              <h5 class="font-bold text-sky-700">📍 Harakat Nuqtasi / Burilish #${index + 1}</h5>
              <p><strong>Vaqt:</strong> ${timeStr}</p>
              <p><strong>Ko‘cha / Tuman:</strong> ${pt.district || 'Bandixon tumani'}</p>
              <p><strong>Tezlik:</strong> ${speedStr}</p>
              <p class="text-[10px] text-slate-400 font-mono mt-1">GPS: ${pt.latitude.toFixed(5)}, ${pt.longitude.toFixed(5)}</p>
            </div>
          `);
          routeLayerRef.current.addLayer(wayMarker);
        }
      });

      // Fit bounds ONLY ONCE when a new route is loaded
      if (coords.length > 0 && !hasFittedRouteRef.current) {
        hasFittedRouteRef.current = true;
        const bounds = L.latLngBounds(coords);
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
      }
    };

    renderRoute();
  }, [routePoints]);

  // Render Geofences
  useEffect(() => {
    if (!mapInstanceRef.current || !geofenceGroupRef.current) return;

    const renderGeofences = async () => {
      const L = (await import('leaflet')).default;
      geofenceGroupRef.current.clearLayers();

      geofences.forEach((gf) => {
        const circle = L.circle([gf.latitude, gf.longitude], {
          radius: gf.radius,
          color: '#0284c7',
          fillColor: '#38bdf8',
          fillOpacity: 0.2,
          weight: 2,
        }).bindPopup(`<b>Geozona: ${gf.name}</b><br>Radius: ${gf.radius} metr`);
        geofenceGroupRef.current.addLayer(circle);
      });
    };

    renderGeofences();
  }, [geofences]);

  return (
    <div className="w-full h-full relative">
      {/* Map View Mode Control Buttons */}
      <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur border border-slate-200 shadow-lg rounded-xl p-1.5 flex items-center gap-1 text-xs">
        <button
          onClick={() => switchMapMode('standard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeMapMode === 'standard'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          Vektor
        </button>

        <button
          onClick={() => switchMapMode('satellite')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeMapMode === 'satellite'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          Sputnik
        </button>

        <button
          onClick={() => switchMapMode('relief')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeMapMode === 'relief'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Mountain className="w-3.5 h-3.5" />
          Relyef (Tog‘)
        </button>

        <button
          onClick={() => switchMapMode('hybrid')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeMapMode === 'hybrid'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Gibrat
        </button>
      </div>

      <div ref={mapContainerRef} className="w-full h-full min-h-[450px]" />
    </div>
  );
}
