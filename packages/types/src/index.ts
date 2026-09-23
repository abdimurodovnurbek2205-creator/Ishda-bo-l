export type Role = 'ADMIN' | 'EMPLOYEE';

export type WorkSessionStatus = 'ACTIVE' | 'COMPLETED';

export type EmployeeOnlineStatus = 'WORKING' | 'DELAYED' | 'OFFLINE' | 'NOT_WORKING';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  pinfl?: string;
  oneIdUserId?: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  userId: string;
  employeeCode: string;
  department: string;
  position: string;
  isTrackingEnabled: boolean;
  workingHoursStart: string; // HH:mm format (e.g., "08:00")
  workingHoursEnd: string;   // HH:mm format (e.g., "17:00")
  createdAt: string;
  updatedAt: string;
  // Joined fields
  user?: User;
}

export interface LocationPoint {
  id: string;
  employeeId: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  region?: string | null;
  district?: string | null;
  timestamp: string;
  createdAt: string;
}

export interface WorkSession {
  id: string;
  employeeId: string;
  startedAt: string;
  endedAt?: string | null;
  startLatitude?: number | null;
  startLongitude?: number | null;
  endLatitude?: number | null;
  endLongitude?: number | null;
  status: WorkSessionStatus;
  totalDistanceKm?: number;
  durationMinutes?: number;
}

export interface Geofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  isActive: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

export interface EmployeeLiveSummary {
  employeeId: string;
  userId: string;
  name: string;
  phone: string;
  employeeCode: string;
  department: string;
  position: string;
  status: EmployeeOnlineStatus;
  isTrackingEnabled: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  latestLocation?: LocationPoint | null;
  currentWorkSession?: WorkSession | null;
  todayDistanceKm: number;
  currentDistrict: string;
  currentRegion: string;
  lastUpdateAgoSeconds?: number;
}

export interface LocationUpdatePayload {
  employeeId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string; // ISO string
}

export interface BatchLocationPayload {
  locations: LocationUpdatePayload[];
}

export interface GeofenceEvent {
  geofenceId: string;
  geofenceName: string;
  employeeId: string;
  employeeName: string;
  type: 'ENTER' | 'EXIT';
  timestamp: string;
}

export interface UzbekistanDistrictInfo {
  region: string;
  district: string;
}
