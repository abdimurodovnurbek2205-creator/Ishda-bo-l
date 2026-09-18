export type Role = 'ADMIN' | 'EMPLOYEE';

export type WorkSessionStatus = 'ACTIVE' | 'COMPLETED';

export type EmployeeOnlineStatus = 'WORKING' | 'DELAYED' | 'OFFLINE' | 'NOT_WORKING';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
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
  workingHoursStart: string;
  workingHoursEnd: string;
  createdAt: string;
  updatedAt: string;
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
  radius: number;
  isActive: boolean;
  createdAt: string;
}

export interface LocationUpdatePayload {
  employeeId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface BatchLocationPayload {
  locations: LocationUpdatePayload[];
}
