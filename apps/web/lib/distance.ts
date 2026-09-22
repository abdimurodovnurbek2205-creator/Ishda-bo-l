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
  minThresholdMeters: number = 5
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
