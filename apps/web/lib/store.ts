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
      if (cleanEmail === cleanId || cleanPhone === cleanId || cleanPhone.endsWith(cleanId)) {
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
      workingHoursStart: data.workingHoursStart || '08:00',
      workingHoursEnd: data.workingHoursEnd || '17:00',
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

    const wsId = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const session: WorkSession = {
      id: wsId,
      employeeId,
      startedAt: new Date().toISOString(),
      startLatitude: lat ?? null,
      startLongitude: lng ?? null,
      status: 'ACTIVE',
    };

    dbStore.workSessions.set(wsId, session);
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
      list = list.filter((l) => l.timestamp.startsWith(dateStr));
    }
    // Sort ascending by timestamp
    return list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  // 5. Live Summary for Manager Dashboard
  getLiveSummary(): EmployeeLiveSummary[] {
    const employees = this.getAllEmployees();
    const now = Date.now();

    return employees.map((emp) => {
      const empLocs = this.getEmployeeLocations(emp.id);
      const latestLoc = empLocs.length > 0 ? empLocs[empLocs.length - 1] : null;
      const activeSession = this.getActiveWorkSession(emp.id);

      // Today's distance
      const todayStr = new Date().toISOString().split('T')[0];
      const todayLocs = this.getEmployeeLocations(emp.id, todayStr);
      const todayDistanceKm = calculateTotalRouteDistance(todayLocs);

      let lastUpdateAgoSeconds = undefined;
      let status: 'WORKING' | 'DELAYED' | 'OFFLINE' | 'NOT_WORKING' = 'NOT_WORKING';

      if (latestLoc) {
        lastUpdateAgoSeconds = Math.round((now - new Date(latestLoc.timestamp).getTime()) / 1000);
      }

      if (activeSession) {
        if (lastUpdateAgoSeconds !== undefined && lastUpdateAgoSeconds <= 120) {
          status = 'WORKING'; // Green
        } else if (lastUpdateAgoSeconds !== undefined && lastUpdateAgoSeconds <= 600) {
          status = 'DELAYED'; // Yellow
        } else {
          status = 'OFFLINE'; // Red
        }
      } else {
        status = 'NOT_WORKING';
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
