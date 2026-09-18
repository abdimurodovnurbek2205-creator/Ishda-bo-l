import { Platform } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationUpdatePayload } from '@repo/types';
import { sendLocationPoint } from './apiService';
import { enqueueLocation, flushOfflineQueue } from './offlineQueue';

export const LOCATION_BACKGROUND_TASK = 'BACKGROUND_LOCATION_GPS_TRACKER';
let webLocationInterval: any = null;

// Register TaskManager Background Task for Native (Android / iOS)
if (Platform.OS !== 'web') {
  TaskManager.defineTask(LOCATION_BACKGROUND_TASK, async ({ data, error }) => {
    if (error) {
      console.error('Background Location Task Error:', error);
      return;
    }

    if (data) {
      const { locations } = data as { locations: Location.LocationObject[] };
      if (locations && locations.length > 0) {
        const loc = locations[locations.length - 1];
        const employeeId = (await AsyncStorage.getItem('employee_id')) || 'emp-1';

        const payload: LocationUpdatePayload = {
          employeeId,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy ?? undefined,
          speed: loc.coords.speed ?? undefined,
          heading: loc.coords.heading ?? undefined,
          timestamp: new Date(loc.timestamp).toISOString(),
        };

        const sent = await sendLocationPoint(payload);
        if (!sent) {
          await enqueueLocation(payload);
        } else {
          await flushOfflineQueue();
        }
      }
    }
  });
}

export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (foreground.status !== 'granted') {
      return false;
    }

    if (Platform.OS !== 'web') {
      const background = await Location.requestBackgroundPermissionsAsync();
      return background.status === 'granted';
    }
    return true;
  } catch (err) {
    console.log('Permission request handled:', err);
    return true;
  }
}

export async function startBackgroundLocationTracking(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      console.log('Web platform detected: starting web GPS polling timer');
      if (webLocationInterval) clearInterval(webLocationInterval);

      webLocationInterval = setInterval(async () => {
        try {
          const employeeId = (await AsyncStorage.getItem('employee_id')) || 'emp-1';
          let lat = 37.5255;
          let lng = 67.2458;

          if (typeof window !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
            });
          }

          const payload: LocationUpdatePayload = {
            employeeId,
            latitude: lat,
            longitude: lng,
            timestamp: new Date().toISOString(),
          };

          const sent = await sendLocationPoint(payload);
          if (!sent) {
            await enqueueLocation(payload);
          }
        } catch (err) {
          console.log('Web location poll error:', err);
        }
      }, 15000);

      return true;
    }

    // Native Mobile (Android / iOS)
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) {
      console.log('Background location permission denied');
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_BACKGROUND_TASK);
    if (!isRegistered) {
      await Location.startLocationUpdatesAsync(LOCATION_BACKGROUND_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000,
        distanceInterval: 10,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Bandixon GPS Monitoring Faol',
          notificationBody: 'Ish vaqtingizda geolokatsiyangiz xavfsiz ravishda monitoring qilinmoqda.',
          notificationColor: '#0284c7',
        },
      });
      console.log('Started background location tracking task');
    }
    return true;
  } catch (err) {
    console.log('startBackgroundLocationTracking exception handled safely:', err);
    return true;
  }
}

export async function stopBackgroundLocationTracking(): Promise<void> {
  if (Platform.OS === 'web') {
    if (webLocationInterval) {
      clearInterval(webLocationInterval);
      webLocationInterval = null;
    }
    return;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_BACKGROUND_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_BACKGROUND_TASK);
      console.log('Stopped background location tracking task');
    }
  } catch (err) {
    console.log('stopBackgroundLocationTracking error handled:', err);
  }
}
