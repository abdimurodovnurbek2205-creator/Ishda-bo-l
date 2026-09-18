import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationUpdatePayload } from '../types';
import { sendBatchLocations } from './apiService';

const QUEUE_STORAGE_KEY = '@offline_gps_queue';
let autoSyncTimer: any = null;

export async function enqueueLocation(location: LocationUpdatePayload): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    const list: LocationUpdatePayload[] = raw ? JSON.parse(raw) : [];
    list.push(location);
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(list));
    console.log(`[Offline GPS Queue] Enqueued location point. Total queued: ${list.length}`);
  } catch (err) {
    console.error('Failed to enqueue location', err);
  }
}

export async function flushOfflineQueue(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return true;
    const list: LocationUpdatePayload[] = JSON.parse(raw);
    if (list.length === 0) return true;

    console.log(`[Offline GPS Queue] Attempting to upload ${list.length} cached offline GPS points...`);
    const success = await sendBatchLocations(list);

    if (success) {
      await AsyncStorage.removeItem(QUEUE_STORAGE_KEY);
      console.log('Successfully flushed offline GPS queue to server!');
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error flushing offline queue', err);
    return false;
  }
}

export async function getQueueLength(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return 0;
    const list: LocationUpdatePayload[] = JSON.parse(raw);
    return list.length;
  } catch (e) {
    return 0;
  }
}

export function startAutoSyncTimer(intervalMs = 15000): void {
  if (autoSyncTimer) return;
  autoSyncTimer = setInterval(async () => {
    const count = await getQueueLength();
    if (count > 0) {
      console.log(`[Auto-Sync] Found ${count} queued points, syncing with server...`);
      await flushOfflineQueue();
    }
  }, intervalMs);
}

export function stopAutoSyncTimer(): void {
  if (autoSyncTimer) {
    clearInterval(autoSyncTimer);
    autoSyncTimer = null;
  }
}
