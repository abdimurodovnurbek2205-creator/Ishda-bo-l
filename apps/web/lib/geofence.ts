import { Geofence, GeofenceEvent } from '@repo/types';
import { haversineDistanceKm } from './distance';

export function isPointInsideGeofence(
  lat: number,
  lng: number,
  geofenceLat: number,
  geofenceLng: number,
  radiusMeters: number
): boolean {
  const distKm = haversineDistanceKm(lat, lng, geofenceLat, geofenceLng);
  const distMeters = distKm * 1000;
  return distMeters <= radiusMeters;
}

export function checkGeofenceTransitions(
  employeeId: string,
  employeeName: string,
  latitude: number,
  longitude: number,
  geofences: Geofence[],
  previousLocation?: { latitude: number; longitude: number } | null
): GeofenceEvent[] {
  const events: GeofenceEvent[] = [];
  const now = new Date().toISOString();

  for (const gf of geofences) {
    if (!gf.isActive) continue;

    const isInsideNow = isPointInsideGeofence(
      latitude,
      longitude,
      gf.latitude,
      gf.longitude,
      gf.radius
    );

    let wasInsideBefore = false;
    if (previousLocation) {
      wasInsideBefore = isPointInsideGeofence(
        previousLocation.latitude,
        previousLocation.longitude,
        gf.latitude,
        gf.longitude,
        gf.radius
      );
    }

    if (isInsideNow && !wasInsideBefore) {
      events.push({
        geofenceId: gf.id,
        geofenceName: gf.name,
        employeeId,
        employeeName,
        type: 'ENTER',
        timestamp: now,
      });
    } else if (!isInsideNow && wasInsideBefore) {
      events.push({
        geofenceId: gf.id,
        geofenceName: gf.name,
        employeeId,
        employeeName,
        type: 'EXIT',
        timestamp: now,
      });
    }
  }

  return events;
}
