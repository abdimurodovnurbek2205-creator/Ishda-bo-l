/**
 * OFFLINE GPS QUEUE & SYNC MANAGER
 * Internet yo'q (Dala hududi, past signal, aloqasiz zonalar) sharoitida ham
 * GPS lokatsiyalarni mahalliy xotirada (localStorage) xavfsiz to'plash va 
 * internet paydo bo'lganda (18:00 dan keyin bo'lsa ham) avtomatik serverga yuklash.
 */

export interface QueuedLocation {
  employeeId: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: string;
  offlineRecorded?: boolean;
}

const STORAGE_KEY = 'offline_gps_queue_v1';
const ACTIVE_SESSION_PREFIX = 'employee_active_session_';

export const offlineSyncManager = {
  // 1. Get queued offline points
  getQueue(): QueuedLocation[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  // 2. Add location to offline queue
  enqueue(loc: QueuedLocation): number {
    if (typeof window === 'undefined') return 0;
    try {
      const queue = this.getQueue();
      // Avoid duplicate timestamps
      const exists = queue.some(
        (p) => Math.abs(new Date(p.timestamp).getTime() - new Date(loc.timestamp).getTime()) < 2000
      );
      if (!exists) {
        queue.push({ ...loc, offlineRecorded: true });
        // Keep max 2000 points to prevent storage overflow
        if (queue.length > 2000) queue.shift();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
      }
      return queue.length;
    } catch (e) {
      console.error('Failed to enqueue offline GPS point', e);
      return 0;
    }
  },

  // 3. Clear queue
  clearQueue() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  },

  // 4. Flush / upload all queued offline locations to server
  async flush(authToken?: string | null): Promise<{ success: boolean; uploadedCount: number }> {
    if (typeof window === 'undefined' || !navigator.onLine) {
      return { success: false, uploadedCount: 0 };
    }

    const queue = this.getQueue();
    if (queue.length === 0) return { success: true, uploadedCount: 0 };

    try {
      const token = authToken || localStorage.getItem('auth_token');
      const res = await fetch('/api/location/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ locations: queue }),
      });

      if (res.ok) {
        const count = queue.length;
        this.clearQueue();
        console.log(`[OfflineSync] Successfully uploaded ${count} offline GPS locations to server!`);
        return { success: true, uploadedCount: count };
      } else {
        return { success: false, uploadedCount: 0 };
      }
    } catch (err) {
      console.warn('[OfflineSync] Server flush failed, retaining queue:', err);
      return { success: false, uploadedCount: 0 };
    }
  },

  // 5. Work Session Persistence (until 18:00)
  saveSession(employeeId: string, sessionData: any) {
    if (typeof window === 'undefined') return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const payload = {
        ...sessionData,
        date: today,
        persistedAt: new Date().toISOString(),
        activeUntil: '18:00',
      };
      localStorage.setItem(`${ACTIVE_SESSION_PREFIX}${employeeId}`, JSON.stringify(payload));
    } catch {}
  },

  getSession(employeeId: string): any | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(`${ACTIVE_SESSION_PREFIX}${employeeId}`);
      if (!raw) return null;
      const data = JSON.parse(raw);
      const today = new Date().toISOString().split('T')[0];
      // Only valid if started today
      if (data.date === today) {
        return data;
      }
      return null;
    } catch {
      return null;
    }
  },

  clearSession(employeeId: string) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(`${ACTIVE_SESSION_PREFIX}${employeeId}`);
    } catch {}
  },

  // Check if current Tashkent time is before 18:00
  isBeforeEndOfDay(): boolean {
    const now = new Date();
    // Tashkent is UTC+5
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const tashkentTime = new Date(utc + 5 * 3600000);
    const hours = tashkentTime.getHours();
    return hours < 18;
  },
};
