import { dbStore } from '@repo/database';
import {
  Employee,
  User,
  LocationPoint,
  WorkSession,
  EmployeeLiveSummary,
  LocationUpdatePayload,
  Geofence,
  GeofenceEvent,
} from '@repo/types';
import { detectUzbekistanDistrict } from './uzbekistan-geocoder';
import { calculateTotalRouteDistance } from './distance';
import { checkGeofenceTransitions } from './geofence';

import { getUzbekistanDateString } from './date-utils';

export const storeService = {
  // 1. Auth & Users
  getUserByEmail(email: string) {
    const allUsers = Array.from(dbStore.users.values());
    for (const u of allUsers) {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return u;
      }
    }
    return null;
  },

  getUserByPhoneOrEmail(identifier: string) {
    const cleanId = identifier.trim().toLowerCase().replace(/[\s\-\(\)]/g, '');
    const allUsers = Array.from(dbStore.users.values());
    for (const u of allUsers) {
      const cleanEmail = u.email.toLowerCase();
      const cleanPhone = u.phone.toLowerCase().replace(/[\s\-\(\)]/g, '');
      const pinflMatch = u.pinfl ? u.pinfl.trim() === cleanId : false;
      if (cleanEmail === cleanId || cleanPhone === cleanId || cleanPhone.endsWith(cleanId) || pinflMatch) {
        return u;
      }
    }
    return null;
  },

  getUserByPinfl(pinfl: string) {
    const cleanPinfl = pinfl.trim();
    const allUsers = Array.from(dbStore.users.values());
    for (const u of allUsers) {
      if (u.pinfl && u.pinfl.trim() === cleanPinfl) {
        return u;
      }
    }
    return null;
  },

  getUserByOneId(oneIdUserId: string) {
    const cleanId = oneIdUserId.trim();
    const allUsers = Array.from(dbStore.users.values());
    for (const u of allUsers) {
      if (u.oneIdUserId && u.oneIdUserId.trim() === cleanId) {
        return u;
      }
    }
    return null;
  },

  getUserById(id: string) {
    return dbStore.users.get(id) || null;
  },

  getEmployeeByUserId(userId: string): Employee | null {
    const allEmps = Array.from(dbStore.employees.values());
    for (const emp of allEmps) {
      if (emp.userId === userId) {
        const user = dbStore.users.get(userId);
        return { ...emp, user };
      }
    }
    return null;
  },

  getEmployeeById(id: string): Employee | null {
    const emp = dbStore.employees.get(id);
    if (!emp) return null;
    const user = dbStore.users.get(emp.userId);
    return { ...emp, user };
  },

  // 2. Employee CRUD
  getAllEmployees(): Employee[] {
    const result: Employee[] = [];
    const allEmps = Array.from(dbStore.employees.values());
    for (const emp of allEmps) {
      const user = dbStore.users.get(emp.userId);
      result.push({ ...emp, user });
    }
    return result;
  },

  createEmployee(data: {
    name: string;
    phone: string;
    email: string;
    employeeCode: string;
    department: string;
    position: string;
    workingHoursStart?: string;
    workingHoursEnd?: string;
    passwordHash: string;
  }): Employee {
    const userId = `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const empId = `emp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const user: User & { passwordHash: string } = {
      id: userId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      passwordHash: data.passwordHash,
      role: 'EMPLOYEE',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dbStore.users.set(userId, user);

    const employee: Employee = {
      id: empId,
      userId,
      employeeCode: data.employeeCode,
      department: data.department,
      position: data.position,
      isTrackingEnabled: true,
      workingHoursStart: data.workingHoursStart || '09:00',
      workingHoursEnd: data.workingHoursEnd || '18:00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user,
    };
    dbStore.employees.set(empId, employee);
    dbStore.saveToFile();

    return employee;
  },

  updateEmployee(id: string, updates: Partial<Employee & { name?: string; phone?: string; isActive?: boolean }>) {
    const emp = dbStore.employees.get(id);
    if (!emp) return null;

    if (updates.workingHoursStart !== undefined) emp.workingHoursStart = updates.workingHoursStart;
    if (updates.workingHoursEnd !== undefined) emp.workingHoursEnd = updates.workingHoursEnd;
    if (updates.isTrackingEnabled !== undefined) emp.isTrackingEnabled = updates.isTrackingEnabled;
    if (updates.department !== undefined) emp.department = updates.department;
    if (updates.position !== undefined) emp.position = updates.position;
    emp.updatedAt = new Date().toISOString();

    if (emp.userId) {
      const u = dbStore.users.get(emp.userId);
      if (u) {
        if (updates.name !== undefined) u.name = updates.name;
        if (updates.phone !== undefined) u.phone = updates.phone;
        if (updates.isActive !== undefined) u.isActive = updates.isActive;
        u.updatedAt = new Date().toISOString();
      }
    }

    return this.getEmployeeById(id);
  },

  // 3. Work Sessions
  getActiveWorkSession(employeeId: string): WorkSession | null {
    const allSessions = Array.from(dbStore.workSessions.values());
    for (const ws of allSessions) {
      if (ws.employeeId === employeeId && ws.status === 'ACTIVE') {
        return ws;
      }
    }
    return null;
  },

  startWorkSession(employeeId: string, lat?: number, lng?: number): WorkSession {
    // Close any previous open session
    const existing = this.getActiveWorkSession(employeeId);
    if (existing) {
      existing.status = 'COMPLETED';
      existing.endedAt = new Date().toISOString();
    }

    const startLat = lat ?? 37.842429;
    const startLng = lng ?? 67.377811;

    const wsId = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const session: WorkSession = {
      id: wsId,
      employeeId,
      startedAt: new Date().toISOString(),
      startLatitude: startLat,
      startLongitude: startLng,
      status: 'ACTIVE',
    };

    dbStore.workSessions.set(wsId, session);

    // Automatically add initial location point for session start
    this.addLocation({
      employeeId,
      latitude: startLat,
      longitude: startLng,
      timestamp: session.startedAt,
    });

    dbStore.saveToFile();
    return session;
  },

  endWorkSession(employeeId: string, lat?: number, lng?: number): WorkSession | null {
    const session = this.getActiveWorkSession(employeeId);
    if (!session) return null;

    session.status = 'COMPLETED';
    session.endedAt = new Date().toISOString();
    if (lat !== undefined) session.endLatitude = lat;
    if (lng !== undefined) session.endLongitude = lng;

    dbStore.saveToFile();
    return session;
  },

  // 4. Location Ingestion & Queries
  addLocation(payload: LocationUpdatePayload): { location: LocationPoint; events: GeofenceEvent[] } {
    const districtInfo = detectUzbekistanDistrict(payload.latitude, payload.longitude);

    const locId = `loc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const point: LocationPoint = {
      id: locId,
      employeeId: payload.employeeId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy: payload.accuracy ?? null,
      speed: payload.speed ?? null,
      heading: payload.heading ?? null,
      region: districtInfo.region,
      district: districtInfo.district,
      timestamp: payload.timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Find previous location for geofence transition checking
    const empLocs = this.getEmployeeLocations(payload.employeeId);
    const prevLoc = empLocs.length > 0 ? empLocs[empLocs.length - 1] : null;

    dbStore.locations.push(point);
    dbStore.saveToFile();

    // Geofence check
    const emp = this.getEmployeeById(payload.employeeId);
    const empName = emp?.user?.name || 'Xodim';
    const allGeofences = Array.from(dbStore.geofences.values());
    const events = checkGeofenceTransitions(
      payload.employeeId,
      empName,
      payload.latitude,
      payload.longitude,
      allGeofences,
      prevLoc
    );

    return { location: point, events };
  },

  getEmployeeLocations(employeeId: string, dateStr?: string): LocationPoint[] {
    let list = dbStore.locations.filter((l) => l.employeeId === employeeId);
    if (dateStr) {
      list = list.filter((l) => {
        const uzDate = getUzbekistanDateString(l.timestamp);
        return uzDate === dateStr || l.timestamp.startsWith(dateStr);
      });
    }
    // Sort ascending by timestamp
    return list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  // 5. Live Summary for Manager Dashboard
  getLiveSummary(): EmployeeLiveSummary[] {
    const employees = this.getAllEmployees();
    const now = Date.now();
    const todayStr = getUzbekistanDateString();

    return employees.map((emp) => {
      const empLocs = this.getEmployeeLocations(emp.id);
      const activeSession = this.getActiveWorkSession(emp.id);

      let latestLoc: LocationPoint | null = null;
      let todayDistanceKm = 0;
      let status: 'WORKING' | 'DELAYED' | 'OFFLINE' | 'NOT_WORKING' = 'NOT_WORKING';

      if (activeSession) {
        status = 'WORKING'; // Active session is ALWAYS WORKING
        const sessionStartTime = new Date(activeSession.startedAt).getTime();
        const sessionLocs = empLocs.filter((l) => new Date(l.timestamp).getTime() >= sessionStartTime - 30000);

        if (sessionLocs.length > 0) {
          latestLoc = sessionLocs[sessionLocs.length - 1];
        } else {
          // If session started today but no location update arrived yet, fallback to session start point
          latestLoc = {
            id: `loc-session-start-${activeSession.id}`,
            employeeId: emp.id,
            latitude: activeSession.startLatitude || 37.842429,
            longitude: activeSession.startLongitude || 67.377811,
            accuracy: 5,
            speed: 0,
            heading: 0,
            region: 'Surxondaryo viloyati',
            district: 'Bandixon tumani',
            timestamp: activeSession.startedAt,
            createdAt: activeSession.startedAt,
          };
        }

        // Calculate distance for active session points
        const startPoint = {
          latitude: activeSession.startLatitude || 37.842429,
          longitude: activeSession.startLongitude || 67.377811,
        };
        const pointsForDistance = [startPoint, ...sessionLocs.map((l) => ({ latitude: l.latitude, longitude: l.longitude }))];
        todayDistanceKm = calculateTotalRouteDistance(pointsForDistance);
      } else {
        status = 'NOT_WORKING';
        const todayLocs = this.getEmployeeLocations(emp.id, todayStr);
        if (todayLocs.length > 0) {
          latestLoc = todayLocs[todayLocs.length - 1];
          todayDistanceKm = calculateTotalRouteDistance(todayLocs);
        } else if (empLocs.length > 0) {
          latestLoc = empLocs[empLocs.length - 1];
        }
      }

      // Final default location fallback if employee has no location point at all (Bandixon HQ)
      if (!latestLoc) {
        latestLoc = {
          id: `loc-default-${emp.id}`,
          employeeId: emp.id,
          latitude: 37.842429,
          longitude: 67.377811,
          accuracy: 10,
          speed: 0,
          heading: 0,
          region: 'Surxondaryo viloyati',
          district: 'Bandixon tumani',
          timestamp: emp.createdAt || new Date().toISOString(),
          createdAt: emp.createdAt || new Date().toISOString(),
        };
      }

      let lastUpdateAgoSeconds = undefined;
      if (latestLoc) {
        lastUpdateAgoSeconds = Math.max(0, Math.round((now - new Date(latestLoc.timestamp).getTime()) / 1000));
      }

      const currentDistrict = latestLoc?.district || 'Bandixon tumani';
      const currentRegion = latestLoc?.region || 'Surxondaryo viloyati';

      return {
        employeeId: emp.id,
        userId: emp.userId,
        name: emp.user?.name || 'Noma‘lum',
        phone: emp.user?.phone || '',
        employeeCode: emp.employeeCode,
        department: emp.department,
        position: emp.position,
        status,
        isTrackingEnabled: emp.isTrackingEnabled,
        workingHoursStart: emp.workingHoursStart,
        workingHoursEnd: emp.workingHoursEnd,
        latestLocation: latestLoc,
        currentWorkSession: activeSession,
        todayDistanceKm,
        currentDistrict,
        currentRegion,
        lastUpdateAgoSeconds,
      };
    });
  },
};
