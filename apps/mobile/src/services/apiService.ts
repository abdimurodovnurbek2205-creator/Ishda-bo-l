import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationUpdatePayload } from '@repo/types';

// Dynamic host detection: uses active browser/phone network IP so login works seamlessly on mobile
const getDynamicHost = () => {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return window.location.hostname;
  }
  return '192.168.100.37';
};

export const API_BASE_URL = `http://${getDynamicHost()}:3000/api`;

export async function getAuthToken(): Promise<string | null> {
  return await AsyncStorage.getItem('auth_token');
}

export async function sendLocationPoint(payload: LocationUpdatePayload): Promise<boolean> {
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/location/update`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.log('Location upload network error, will queue offline point:', error);
    return false;
  }
}

export async function sendBatchLocations(locations: LocationUpdatePayload[]): Promise<boolean> {
  if (locations.length === 0) return true;
  try {
    const token = await getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/location/update`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ locations }),
    });

    return response.ok;
  } catch (error) {
    console.log('Batch upload network error:', error);
    return false;
  }
}

export async function registerUser(payload: {
  name: string;
  phone: string;
  password: string;
  department?: string;
  position?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Ro‘yxatdan o‘tishda xatolik yuz berdi');
  }
  return data;
}

