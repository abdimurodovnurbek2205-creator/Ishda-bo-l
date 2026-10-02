export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1000) / 1000; // precision in meters converted to km
}

export function calculateTotalRouteDistance(
  points: Array<{ latitude: number; longitude: number }>,
  minThresholdMeters: number = 15
): number {
  if (points.length < 2) return 0;
  let totalKm = 0;
  let prevPoint = points[0];

  for (let i = 1; i < points.length; i++) {
    const currPoint = points[i];
    const distKm = haversineDistanceKm(
      prevPoint.latitude,
      prevPoint.longitude,
      currPoint.latitude,
      currPoint.longitude
    );
    // Ignore small GPS jitter under minThresholdMeters (0.005 km = 5 meters)
    if (distKm * 1000 >= minThresholdMeters) {
      totalKm += distKm;
      prevPoint = currPoint;
    }
  }
  return Math.round(totalKm * 100) / 100;
}

export interface VisitedStop {
  id: string;
  name: string;
  type: 'START' | 'FIELD' | 'END';
  latitude: number;
  longitude: number;
  arrivedAt: string;
  departedAt?: string;
  durationMinutes: number;
  district?: string;
}

/**
 * Xodimning kun davomida dala va obyektlarda to'xtagan, tashrif buyurgan joylarini
 * (Stops / Field Waypoints) avtomatik aniqlash algoritmi.
 * Agar xodim 75 metrlik radiusda 4 daqiqadan ko'proq tursa, u yer alohida "Tashrif nuqtasi" deb belgilanadi.
 */
export function detectVisitedStops(
  points: Array<{
    id?: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    district?: string | null;
  }>
): VisitedStop[] {
  if (!points || points.length === 0) return [];

  const firstPt = points[0];
  const stops: VisitedStop[] = [];

  // 1. Initial Start Point (Ishxona / Bosh bino)
  stops.push({
    id: 'stop-start',
    name: '1. Bosh bino / Ishxona (Ertalabki kelish)',
    type: 'START',
    latitude: firstPt.latitude,
    longitude: firstPt.longitude,
    arrivedAt: firstPt.timestamp,
    durationMinutes: 0,
    district: firstPt.district || 'Bandixon tumani',
  });

  if (points.length < 2) return stops;

  let clusterStartIdx = 0;
  let stopCounter = 2;

  for (let i = 1; i < points.length; i++) {
    const startPt = points[clusterStartIdx];
    const currPt = points[i];
    const distMeters = haversineDistanceKm(startPt.latitude, startPt.longitude, currPt.latitude, currPt.longitude) * 1000;

    if (distMeters > 70) {
      // Cluster boundary exceeded
      const startTime = new Date(startPt.timestamp).getTime();
      const endTime = new Date(points[i - 1].timestamp).getTime();
      const durationMin = Math.round((endTime - startTime) / 60000);

      // If stayed at cluster for at least 4 minutes and it's not immediately at start
      if (durationMin >= 4 && clusterStartIdx > 0) {
        stops.push({
          id: `stop-${stopCounter}`,
          name: `${stopCounter}. Dala hududi / Obyekt (${durationMin} daq)`,
          type: 'FIELD',
          latitude: startPt.latitude,
          longitude: startPt.longitude,
          arrivedAt: startPt.timestamp,
          departedAt: points[i - 1].timestamp,
          durationMinutes: durationMin,
          district: startPt.district || 'Bandixon tumani',
        });
        stopCounter++;
      }
      clusterStartIdx = i;
    }
  }

  // Check ongoing stop at the end
  if (clusterStartIdx < points.length - 1 && clusterStartIdx > 0) {
    const startPt = points[clusterStartIdx];
    const lastPt = points[points.length - 1];
    const startTime = new Date(startPt.timestamp).getTime();
    const endTime = new Date(lastPt.timestamp).getTime();
    const durationMin = Math.round((endTime - startTime) / 60000);

    if (durationMin >= 4) {
      stops.push({
        id: `stop-${stopCounter}`,
        name: `${stopCounter}. Hozirgi dala nuqtasi (${durationMin} daq)`,
        type: 'FIELD',
        latitude: startPt.latitude,
        longitude: startPt.longitude,
        arrivedAt: startPt.timestamp,
        durationMinutes: durationMin,
        district: startPt.district || 'Bandixon tumani',
      });
      stopCounter++;
    }
  }

  // Add final current location if significantly far from previous stop
  const lastPoint = points[points.length - 1];
  const lastStop = stops[stops.length - 1];
  const distFromLastStop = haversineDistanceKm(lastStop.latitude, lastStop.longitude, lastPoint.latitude, lastPoint.longitude) * 1000;
  if (distFromLastStop > 80) {
    stops.push({
      id: 'stop-finish',
      name: `${stops.length + 1}. Hozirgi joylashuv`,
      type: 'END',
      latitude: lastPoint.latitude,
      longitude: lastPoint.longitude,
      arrivedAt: lastPoint.timestamp,
      durationMinutes: 0,
      district: lastPoint.district || 'Bandixon tumani',
    });
  }

  return stops;
}
