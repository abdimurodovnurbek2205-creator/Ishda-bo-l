import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, getAuthToken } from '../services/apiService';
import {
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
} from '../services/locationService';
import { getQueueLength, flushOfflineQueue, startAutoSyncTimer } from '../services/offlineQueue';
import { EmployeeMapView } from '../components/EmployeeMapView';

interface HomeScreenProps {
  user: any;
  employee: any;
  onLogout: () => void;
}

export function HomeScreen({ user, employee, onLogout }: HomeScreenProps) {
  const [isWorking, setIsWorking] = useState(false);
  const [workStartedAt, setWorkStartedAt] = useState<string | null>(null);
  const [currentDistrict, setCurrentDistrict] = useState<string>('Bandixon tumani');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [queuedPointsCount, setQueuedPointsCount] = useState(0);

  useEffect(() => {
    checkActiveSession();
    updateQueueCount();
    startAutoSyncTimer(10000);
    const interval = setInterval(updateQueueCount, 3000);
    return () => clearInterval(interval);
  }, []);

  const updateQueueCount = async () => {
    const count = await getQueueLength();
    setQueuedPointsCount(count);
  };

  const checkActiveSession = async () => {
    try {
      const savedStartedAt = await AsyncStorage.getItem('active_work_started_at');
      if (savedStartedAt) {
        setIsWorking(true);
        setWorkStartedAt(savedStartedAt);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const handleStartWork = async () => {
    setLoading(true);
    try {
      let lat = 37.842429;
      let lng = 67.377811;
      let accuracy: number | null = 5.0;
      let speed: number | null = 0;
      let heading: number | null = 0;

      // 1. Try Expo Location permissions and current position
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
          accuracy = loc.coords.accuracy;
          speed = loc.coords.speed;
          heading = loc.coords.heading;
        }
      } catch (e) {
        console.log('Expo Location API call handled, using browser/HTML5 geolocation fallback');
      }

      // 2. Try HTML5 Geolocation if available on web browser
      if (typeof window !== 'undefined' && navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
              accuracy = pos.coords.accuracy;
              resolve();
            },
            () => resolve(),
            { timeout: 5000 }
          );
        });
      }

      setCoords({ latitude: lat, longitude: lng });

      const empId = employee?.id || 'emp-1';
      const token = await getAuthToken();

      // 3. API Call to Start Work Session
      const res = await fetch(`${API_BASE_URL}/work-sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId: empId,
          latitude: lat,
          longitude: lng,
          accuracy,
          speed,
          heading,
        }),
      });

      if (!res.ok) {
        throw new Error('Ish seansini boshlashda xatolik');
      }

      // 4. Send initial location point to backend so Manager Dashboard renders marker immediately
      await fetch(`${API_BASE_URL}/location/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          employeeId: empId,
          latitude: lat,
          longitude: lng,
          accuracy,
          speed,
          heading,
          timestamp: new Date().toISOString(),
        }),
      });

      // 5. Start Background Location Service
      await startBackgroundLocationTracking();

      const startTimeStr = new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
      setIsWorking(true);
      setWorkStartedAt(startTimeStr);
      await AsyncStorage.setItem('active_work_started_at', startTimeStr);

      Alert.alert('Ish Boshlandi!', 'GPS tracking muvaffaqiyatli ishga tushirildi va Boshqaruv paneliga uzatildi');
    } catch (err: any) {
      Alert.alert('Xatolik', err.message || 'Ishni boshlashda xatolik yuz berdi');
    } finally {
      setLoading(false);
      updateQueueCount();
    }
  };

  const handleEndWork = async () => {
    setLoading(true);
    try {
      // 1. Get final position if available
      let finalLat, finalLng;
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        finalLat = loc.coords.latitude;
        finalLng = loc.coords.longitude;
      } catch (e) {
        console.log('Final position fetch skipped');
      }

      const empId = employee?.id || 'emp-1';
      const token = await getAuthToken();

      // 2. API Call to End Work Session
      await fetch(`${API_BASE_URL}/work-sessions/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId: empId,
          latitude: finalLat,
          longitude: finalLng,
        }),
      });

      // 3. Stop Background Tracking
      await stopBackgroundLocationTracking();

      // 4. Flush any remaining offline queued points
      await flushOfflineQueue();

      setIsWorking(false);
      setWorkStartedAt(null);
      await AsyncStorage.removeItem('active_work_started_at');

      Alert.alert('Ish Yakunlandi', 'Kunlik seans muvaffaqiyatli yopildi');
    } catch (err: any) {
      Alert.alert('Xatolik', err.message || 'Ishni yakunlashda xatolik yuz berdi');
    } finally {
      setLoading(false);
      updateQueueCount();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Employee Greeting Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.substring(0, 2).toUpperCase() || 'XO'}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.greeting}>Salom, {user?.name || 'Xodim'}!</Text>
          <Text style={styles.empDetails}>
            {employee?.position || 'Xodim'} | {employee?.department || 'Monitoring'}
          </Text>
          <Text style={styles.empCode}>Kodi: {employee?.employeeCode || 'EMP-101'} | Tel: {user?.phone || '+998901234567'}</Text>
        </View>
      </View>

      {/* Main Status Box */}
      <View style={[styles.statusCard, isWorking ? styles.statusCardWorking : styles.statusCardIdle]}>
        <Text style={styles.statusLabel}>ISH HOLATI</Text>
        <Text style={[styles.statusTitle, isWorking ? styles.textWorking : styles.textIdle]}>
          {isWorking ? 'WORKING (ISHDA)' : 'NOT WORKING (ISHDA EMAS)'}
        </Text>

        {isWorking && (
          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Boshlangan vaqt:</Text>
              <Text style={styles.detailValue}>{workStartedAt || '08:00'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Joriy Hudud:</Text>
              <Text style={styles.detailValue}>{currentDistrict}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Lokatsiya Tasdiqlash:</Text>
              <Text style={styles.detailValueGreen}>
                {coords ? (
                  Math.hypot(coords.latitude - 37.842429, coords.longitude - 67.377811) < 0.01 ? (
                    'Ishxona Hududida 🏢🟢'
                  ) : (
                    'Ishxonadan Uzoqlashdi ⚠️📍'
                  )
                ) : (
                  'Ishxona Hududida 🏢🟢'
                )}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>GPS Tracking Status:</Text>
              <Text style={styles.detailValueGreen}>Fonda uzluksiz uzatilmoqda 🟢</Text>
            </View>
          </View>
        )}

        {/* Action Button */}
        {loading ? (
          <ActivityIndicator size="large" color={isWorking ? '#ef4444' : '#0284c7'} style={{ marginTop: 20 }} />
        ) : isWorking ? (
          <TouchableOpacity style={styles.endButton} onPress={handleEndWork}>
            <Text style={styles.buttonText}>[ ISHNI TUGATISH ]</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.startButton} onPress={handleStartWork}>
            <Text style={styles.buttonText}>[ ISHNI BOSHLASH ]</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Employee Interactive Map Card */}
      <EmployeeMapView
        latitude={coords?.latitude || 37.842429}
        longitude={coords?.longitude || 67.377811}
        district={currentDistrict}
        isInsideOffice={
          coords
            ? Math.hypot(coords.latitude - 37.842429, coords.longitude - 67.377811) < 0.01
            : true
        }
      />

      {/* Privacy Notice Card */}
      <View style={styles.privacyCard}>
        <Text style={styles.privacyTitle}>🔒 Shaffof GPS Nazorat Eslatmasi</Text>
        <Text style={styles.privacyBody}>
          Joylashuvni kuzatish faqat ish vaqtingizda shaffof tarzda amalga oshiriladi. Ilova hech qachon yashirin nazorat olib bormaydi.
        </Text>
      </View>

      {/* Offline Sync Status Card */}
      {queuedPointsCount > 0 && (
        <View style={styles.offlineCard}>
          <Text style={styles.offlineTitle}>📶 Offline GPS Saqlagich</Text>
          <Text style={styles.offlineBody}>
            Internet uzilishi sababli {queuedPointsCount} ta GPS nuqtasi telefon xotirasida saqlangan. Internet qaytgach avtomatik yuklanadi.
          </Text>
          <TouchableOpacity style={styles.flushButton} onPress={flushOfflineQueue}>
            <Text style={styles.flushButtonText}>Hozir Yuborish</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutText}>Tizimdan Chiqish</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingTop: 50,
    gap: 16,
  },
  headerCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerInfo: {
    marginLeft: 12,
  },
  greeting: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  empDetails: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  empCode: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  statusCardWorking: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  statusCardIdle: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  textWorking: {
    color: '#166534',
  },
  textIdle: {
    color: '#334155',
  },
  detailsBox: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#dcfce7',
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 12,
    color: '#475569',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  detailValueGreen: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#15803d',
  },
  startButton: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  endButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  privacyCard: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 12,
    padding: 14,
  },
  privacyTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  privacyBody: {
    fontSize: 11,
    color: '#0c4a6e',
    marginTop: 4,
    lineHeight: 16,
  },
  offlineCard: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 14,
  },
  offlineTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#b45309',
  },
  offlineBody: {
    fontSize: 11,
    color: '#78350f',
    marginTop: 4,
  },
  flushButton: {
    backgroundColor: '#d97706',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  flushButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  logoutButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
