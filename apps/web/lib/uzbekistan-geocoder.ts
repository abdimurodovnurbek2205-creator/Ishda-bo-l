import { UzbekistanDistrictInfo } from '@repo/types';

interface DistrictBoundary {
  region: string;
  district: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
}

// Key Uzbekistan Districts with centroids & coverage radius
const UZBEKISTAN_DISTRICTS: DistrictBoundary[] = [
  // Surxondaryo Region
  { region: 'Surxondaryo viloyati', district: 'Bandixon tumani', centerLat: 37.842429, centerLng: 67.377811, radiusKm: 25 },
  { region: 'Surxondaryo viloyati', district: 'Qumqo‘rg‘on tumani', centerLat: 37.4950, centerLng: 67.4100, radiusKm: 25 },
  { region: 'Surxondaryo viloyati', district: 'Termiz shahri', centerLat: 37.2242, centerLng: 67.2783, radiusKm: 12 },
  { region: 'Surxondaryo viloyati', district: 'Termiz tumani', centerLat: 37.2800, centerLng: 67.3100, radiusKm: 20 },
  { region: 'Surxondaryo viloyati', district: 'Sherobod tumani', centerLat: 37.3750, centerLng: 66.9200, radiusKm: 30 },
  { region: 'Surxondaryo viloyati', district: 'Denov tumani', centerLat: 38.2700, centerLng: 67.8900, radiusKm: 25 },
  { region: 'Surxondaryo viloyati', district: 'Boysun tumani', centerLat: 38.2000, centerLng: 67.2000, radiusKm: 35 },
  { region: 'Surxondaryo viloyati', district: 'Jarqo‘rg‘on tumani', centerLat: 37.5000, centerLng: 67.4100, radiusKm: 22 },
  { region: 'Surxondaryo viloyati', district: 'Angor tumani', centerLat: 37.3000, centerLng: 67.1000, radiusKm: 15 },
  { region: 'Surxondaryo viloyati', district: 'Muzrabot tumani', centerLat: 37.3500, centerLng: 66.8500, radiusKm: 25 },
  { region: 'Surxondaryo viloyati', district: 'Sho‘rchi tumani', centerLat: 37.9900, centerLng: 67.7800, radiusKm: 20 },
  { region: 'Surxondaryo viloyati', district: 'Oltinsoy tumani', centerLat: 38.1800, centerLng: 67.6500, radiusKm: 20 },
  { region: 'Surxondaryo viloyati', district: 'Uzun tumani', centerLat: 38.3500, centerLng: 68.1000, radiusKm: 30 },
  { region: 'Surxondaryo viloyati', district: 'Sariosiyo tumani', centerLat: 38.4500, centerLng: 67.9200, radiusKm: 40 },
  { region: 'Surxondaryo viloyati', district: 'Qiziriq tumani', centerLat: 37.6000, centerLng: 67.0500, radiusKm: 20 },

  // Tashkent City & Region
  { region: 'Toshkent shahri', district: 'Yunusobod tumani', centerLat: 41.3650, centerLng: 69.2850, radiusKm: 8 },
  { region: 'Toshkent shahri', district: 'Mirzo Ulug‘bek tumani', centerLat: 41.3300, centerLng: 69.3400, radiusKm: 10 },
  { region: 'Toshkent shahri', district: 'Chilonzor tumani', centerLat: 41.2750, centerLng: 69.2050, radiusKm: 8 },
  { region: 'Toshkent viloyati', district: 'Angren shahri', centerLat: 41.0167, centerLng: 70.1433, radiusKm: 15 },
  { region: 'Toshkent viloyati', district: 'Olmaliq shahri', centerLat: 40.8500, centerLng: 69.6000, radiusKm: 15 },

  // Samarkand
  { region: 'Samarqand viloyati', district: 'Samarqand shahri', centerLat: 39.6542, centerLng: 66.9597, radiusKm: 15 },
  { region: 'Samarqand viloyati', district: 'Kattaqo‘rg‘on tumani', centerLat: 39.9000, centerLng: 66.2500, radiusKm: 20 },

  // Bukhara
  { region: 'Buxoro viloyati', district: 'Buxoro shahri', centerLat: 39.7747, centerLng: 64.4286, radiusKm: 15 },

  // Kashkadarya
  { region: 'Qashqadaryo viloyati', district: 'Qarshi shahri', centerLat: 38.8606, centerLng: 65.7890, radiusKm: 15 },
  { region: 'Qashqadaryo viloyati', district: 'Shahrisabz tumani', centerLat: 39.0500, centerLng: 66.8333, radiusKm: 20 },

  // Fergana
  { region: 'Farg‘ona viloyati', district: 'Farg‘ona shahri', centerLat: 40.3864, centerLng: 71.7864, radiusKm: 12 },
  { region: 'Farg‘ona viloyati', district: 'Qo‘qon shahri', centerLat: 40.5286, centerLng: 70.9425, radiusKm: 12 },

  // Namangan & Andijan
  { region: 'Namangan viloyati', district: 'Namangan shahri', centerLat: 40.9983, centerLng: 71.6726, radiusKm: 15 },
  { region: 'Andijon viloyati', district: 'Andijon shahri', centerLat: 40.7821, centerLng: 72.3442, radiusKm: 15 },

  // Khorezm & Karakalpakstan
  { region: 'Xorazm viloyati', district: 'Urganch shahri', centerLat: 41.5500, centerLng: 60.6333, radiusKm: 15 },
  { region: 'Qoraqalpog‘iston Respublikasi', district: 'Nukus shahri', centerLat: 42.4603, centerLng: 59.6103, radiusKm: 20 },
];

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function detectUzbekistanDistrict(latitude: number, longitude: number): UzbekistanDistrictInfo {
  let closest: DistrictBoundary | null = null;
  let minDistance = Infinity;

  for (const entry of UZBEKISTAN_DISTRICTS) {
    const dist = calculateDistanceKm(latitude, longitude, entry.centerLat, entry.centerLng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = entry;
    }
  }

  if (closest && minDistance <= 60) {
    return {
      region: closest.region,
      district: closest.district,
    };
  }

  // Fallback for general Uzbekistan territory
  if (latitude >= 37.0 && latitude <= 45.5 && longitude >= 56.0 && longitude <= 73.5) {
    return {
      region: 'O‘zbekiston Respublikasi',
      district: 'Noma‘lum tuman',
    };
  }

  return {
    region: 'Tashqari xudud',
    district: 'Xalqaro joylashuv',
  };
}
