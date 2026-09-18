import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';

interface EmployeeMapViewProps {
  latitude: number;
  longitude: number;
  district?: string;
  isInsideOffice?: boolean;
}

export function EmployeeMapView({
  latitude,
  longitude,
  district = 'Bandixon tumani',
  isInsideOffice = true,
}: EmployeeMapViewProps) {
  const [mapMode, setMapMode] = useState<'standard' | 'satellite'>('standard');

  const tileUrl =
    mapMode === 'satellite'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const cleanDistrict = (district || 'Bandixon tumani').replace(/'/g, '&#39;');

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #f1f5f9; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        try {
          var map = L.map('map', { zoomControl: false }).setView([${latitude}, ${longitude}], 15);
          L.tileLayer("${tileUrl}", { maxZoom: 19 }).addTo(map);

          // Office Geofence Circle (500m radius around Office Center)
          L.circle([37.842429, 67.377811], {
            radius: 500,
            color: '#0284c7',
            fillColor: '#38bdf8',
            fillOpacity: 0.15,
            weight: 2
          }).addTo(map).bindPopup("<b>Bandixon tuman O&#39;simliklar karantini va himoyasi bo&#39;limi</b>");

          // Current Employee Marker (Green / Red Dot)
          L.circleMarker([${latitude}, ${longitude}], {
            radius: 10,
            fillColor: "${isInsideOffice ? '#10b981' : '#ef4444'}",
            color: '#ffffff',
            weight: 3,
            fillOpacity: 1
          }).addTo(map).bindPopup("<b>Sizning Joriy Joylashuvingiz</b><br>${cleanDistrict}");
        } catch (e) {
          console.error("Map init error:", e);
        }
      </script>
    </body>
    </html>
  `;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🗺️ Sizning GPS Xaritaniz</Text>
          <View style={styles.modeControls}>
            <TouchableOpacity
              style={[styles.modeButton, mapMode === 'standard' && styles.modeButtonActive]}
              onPress={() => setMapMode('standard')}
            >
              <Text style={[styles.modeText, mapMode === 'standard' && styles.modeTextActive]}>Vektor</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mapMode === 'satellite' && styles.modeButtonActive]}
              onPress={() => setMapMode('satellite')}
            >
              <Text style={[styles.modeText, mapMode === 'satellite' && styles.modeTextActive]}>Sputnik</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mapFrameBox}>
          <iframe
            key={`${latitude}-${longitude}-${mapMode}`}
            srcDoc={mapHtml}
            style={{ width: '100%', height: '220px', border: 'none', borderRadius: '12px' }}
            title="Employee GPS Location Map"
          />
        </View>

        <View style={styles.footerInfo}>
          <Text style={styles.coordsText}>
            📍 GPS Koordinata: {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </Text>
          <Text style={styles.statusBadgeText}>
            {isInsideOffice ? '🟢 Ishxona Hududida Tasdiqlandi' : '⚠️ Ishxona Hududidan Tashqarida'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗺️ Sizning GPS Geolokatsiyangiz</Text>
      <Text style={styles.coordsText}>
        Lat: {latitude.toFixed(5)}, Lng: {longitude.toFixed(5)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modeControls: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
  },
  modeButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modeButtonActive: {
    backgroundColor: '#0284c7',
  },
  modeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  modeTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  mapFrameBox: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f1f5f9',
  },
  footerInfo: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordsText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#475569',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0369a1',
  },
});
