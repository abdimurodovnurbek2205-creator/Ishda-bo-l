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
  DailyTimesheetRecord,
  AttendanceStatus,
} from '@repo/types';
import { detectUzbekistanDistrict } from './uzbekistan-geocoder';
import { calculateTotalRouteDistance, haversineDistanceKm } from './distance';
import { checkGeofenceTransitions } from './geofence';

import {
  getUzbekistanDateString,
  isWeekend,
  getKnownHolidayUz,
  getDayOfWeekUz,
  getDaysInMonth,
} from './date-utils';

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
    const todayStr = getUzbekistanDateString();
    for (const ws of allSessions) {
      if (ws.employeeId === employeeId && ws.status === 'ACTIVE') {
        const sessionDate = getUzbekistanDateString(ws.startedAt);
        // Stale session from a previous day -> auto-close
        if (sessionDate !== todayStr) {
          ws.status = 'COMPLETED';
          ws.endedAt = new Date(new Date(ws.startedAt).getTime() + 9 * 3600 * 1000).toISOString();
          dbStore.saveToFile();
          continue;
        }
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

    // Find previous location for geofence transition checking and noise filtering
    const empLocs = this.getEmployeeLocations(payload.employeeId);
    const prevLoc = empLocs.length > 0 ? empLocs[empLocs.length - 1] : null;

    // Filter out indoor GPS jitter if employee hasn't moved beyond 15 meters
    if (prevLoc) {
      const distKm = haversineDistanceKm(prevLoc.latitude, prevLoc.longitude, payload.latitude, payload.longitude);
      if (distKm * 1000 < 15) {
        prevLoc.timestamp = point.timestamp;
        dbStore.saveToFile();
        return { location: prevLoc, events: [] };
      }
    }

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

        const lastSignalSeconds = latestLoc
          ? Math.max(0, Math.round((now - new Date(latestLoc.timestamp).getTime()) / 1000))
          : Math.max(0, Math.round((now - sessionStartTime) / 1000));

        if (lastSignalSeconds > 900) {
          status = 'OFFLINE'; // Signal lost over 15 minutes ago
        } else if (lastSignalSeconds > 300) {
          status = 'DELAYED'; // Signal delayed over 5 minutes ago
        } else {
          status = 'WORKING'; // Active real-time signal
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
        } else {
          const allLocs = this.getEmployeeLocations(emp.id);
          if (allLocs.length > 0) {
            latestLoc = allLocs[allLocs.length - 1];
          } else {
            latestLoc = {
              id: `loc-default-${emp.id}`,
              employeeId: emp.id,
              latitude: 37.842429,
              longitude: 67.377811,
              accuracy: 10,
              speed: 0,
              heading: 0,
              region: 'Surxondaryo viloyati',
              district: 'Bandixon tumani (Bo‘lim)',
              timestamp: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            };
          }
          todayDistanceKm = 0;
        }
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

  // 6. Daily Timesheet (Kunlik Tabel)
  getTimesheetByDate(date: string): DailyTimesheetRecord[] {
    const allRecords = Array.from(dbStore.timesheets.values()).filter((r) => r.date === date);
    const employees = this.getAllEmployees();

    const weekend = isWeekend(date);
    const holidayName = getKnownHolidayUz(date);
    const dayName = getDayOfWeekUz(date).full;

    if (allRecords.length === 0) {
      // Create initial drafted records for all employees
      const newRecords: DailyTimesheetRecord[] = employees.map((emp) => {
        // Check if employee has an active work session for this date
        const empSessions = Array.from(dbStore.workSessions.values()).filter(
          (s) => s.employeeId === emp.id && s.startedAt.startsWith(date)
        );
        const session = empSessions[0];

        let status: AttendanceStatus = 'PRESENT';
        let checkIn = '09:00';
        let checkOut = '18:00';
        let workHours = 8.0;
        let reason = '';
        let hourlyLog = '';

        if (holidayName) {
          status = 'DAY_OFF';
          checkIn = '';
          checkOut = '';
          workHours = 0;
          reason = `Bayram kuni: ${holidayName}`;
          hourlyLog = `Rasmiy bayram - Dam olish kuni (${holidayName})`;
        } else if (weekend) {
          status = 'DAY_OFF';
          checkIn = '';
          checkOut = '';
          workHours = 0;
          reason = `${dayName} - Dam olish kuni`;
          hourlyLog = `${dayName} - Dam olish kuni`;
        } else if (session) {
          checkIn = new Date(session.startedAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
          checkOut = session?.endedAt
            ? new Date(session.endedAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
            : '18:00';
          hourlyLog = `${checkIn} - Ishga kelgan deb belgilandi`;
        } else {
          hourlyLog = '09:00 - Ishga kelgan deb belgilandi';
        }

        const recId = `ts-${date}-${emp.id}`;
        const record: DailyTimesheetRecord = {
          id: recId,
          date,
          employeeId: emp.id,
          employeeName: emp.user?.name || 'Noma‘lum',
          employeeCode: emp.employeeCode,
          department: emp.department,
          position: emp.position,
          status,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          workHours,
          reason,
          hourlyLog,
          recordedBy: 'Bo‘riyev Shuxrat Xursandovich (Bo‘lim boshlig‘i)',
          updatedAt: new Date().toISOString(),
        };
        dbStore.timesheets.set(recId, record);
        return record;
      });
      dbStore.saveToFile();
      return newRecords.sort((a, b) => a.employeeCode.localeCompare(b.employeeCode));
    }

    // Ensure all current employees exist in timesheet
    let updated = false;
    for (const emp of employees) {
      const exists = allRecords.some((r) => r.employeeId === emp.id);
      if (!exists) {
        let status: AttendanceStatus = 'PRESENT';
        let checkIn = '09:00';
        let checkOut = '18:00';
        let workHours = 8.0;
        let reason = '';
        let hourlyLog = '';

        if (holidayName) {
          status = 'DAY_OFF';
          checkIn = '';
          checkOut = '';
          workHours = 0;
          reason = `Bayram kuni: ${holidayName}`;
          hourlyLog = `Rasmiy bayram - Dam olish kuni (${holidayName})`;
        } else if (weekend) {
          status = 'DAY_OFF';
          checkIn = '';
          checkOut = '';
          workHours = 0;
          reason = `${dayName} - Dam olish kuni`;
          hourlyLog = `${dayName} - Dam olish kuni`;
        }

        const recId = `ts-${date}-${emp.id}`;
        const record: DailyTimesheetRecord = {
          id: recId,
          date,
          employeeId: emp.id,
          employeeName: emp.user?.name || 'Noma‘lum',
          employeeCode: emp.employeeCode,
          department: emp.department,
          position: emp.position,
          status,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          workHours,
          reason,
          hourlyLog,
          recordedBy: 'Bo‘riyev Shuxrat Xursandovich (Bo‘lim boshlig‘i)',
          updatedAt: new Date().toISOString(),
        };
        dbStore.timesheets.set(recId, record);
        allRecords.push(record);
        updated = true;
      }
    }
    if (updated) {
      dbStore.saveToFile();
    }

    return allRecords.sort((a, b) => a.employeeCode.localeCompare(b.employeeCode));
  },

  saveTimesheetRecord(record: Partial<DailyTimesheetRecord> & { employeeId: string; date: string }): DailyTimesheetRecord {
    const recId = record.id || `ts-${record.date}-${record.employeeId}`;
    const existing = dbStore.timesheets.get(recId);
    const emp = this.getEmployeeById(record.employeeId);

    const updatedRecord: DailyTimesheetRecord = {
      id: recId,
      date: record.date,
      employeeId: record.employeeId,
      employeeName: record.employeeName || emp?.user?.name || existing?.employeeName || 'Noma‘lum',
      employeeCode: record.employeeCode || emp?.employeeCode || existing?.employeeCode || '',
      department: record.department || emp?.department || existing?.department || '',
      position: record.position || emp?.position || existing?.position || '',
      status: record.status || existing?.status || 'PRESENT',
      checkInTime: record.checkInTime !== undefined ? record.checkInTime : (existing?.checkInTime || ''),
      checkOutTime: record.checkOutTime !== undefined ? record.checkOutTime : (existing?.checkOutTime || ''),
      workHours: record.workHours !== undefined ? record.workHours : (existing?.workHours ?? 8.0),
      reason: record.reason !== undefined ? record.reason : (existing?.reason || ''),
      hourlyLog: record.hourlyLog !== undefined ? record.hourlyLog : (existing?.hourlyLog || ''),
      recordedBy: record.recordedBy || existing?.recordedBy || 'Bo‘riyev Shuxrat Xursandovich',
      updatedAt: new Date().toISOString(),
    };

    dbStore.timesheets.set(recId, updatedRecord);
    dbStore.saveToFile();
    return updatedRecord;
  },

  bulkSaveTimesheet(records: (Partial<DailyTimesheetRecord> & { employeeId: string; date: string })[]): DailyTimesheetRecord[] {
    const results: DailyTimesheetRecord[] = [];
    for (const r of records) {
      results.push(this.saveTimesheetRecord(r));
    }
    return results;
  },

  // Set an entire day as Holiday or Workday for all employees
  setDayTypeForDate(date: string, isHolidayOrDayOff: boolean, reasonText?: string): DailyTimesheetRecord[] {
    const dayRecords = this.getTimesheetByDate(date);
    const updated = dayRecords.map((r) => {
      if (isHolidayOrDayOff) {
        return this.saveTimesheetRecord({
          ...r,
          status: 'DAY_OFF',
          checkInTime: '',
          checkOutTime: '',
          workHours: 0,
          reason: reasonText || 'Bayram / Dam olish kuni',
        });
      } else {
        return this.saveTimesheetRecord({
          ...r,
          status: 'PRESENT',
          checkInTime: '09:00',
          checkOutTime: '18:00',
          workHours: 8.0,
          reason: '',
        });
      }
    });
    return updated;
  },

  // 7. Monthly Timesheet Matrix (Sentabr - Dekabr 2026)
  getTimesheetForMonth(year: number, month: number) {
    const totalDays = getDaysInMonth(year, month);
    const employees = this.getAllEmployees().sort((a, b) => a.employeeCode.localeCompare(b.employeeCode));

    const days = [];
    for (let day = 1; day <= totalDays; day++) {
      const monthStr = String(month).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      const weekend = isWeekend(dateStr);
      const holiday = getKnownHolidayUz(dateStr);
      const dayOfWeek = getDayOfWeekUz(dateStr);

      // Ensure records exist for this day
      const dayRecords = this.getTimesheetByDate(dateStr);
      const firstRec = dayRecords[0];
      const isCustomHoliday = !weekend && dayRecords.length > 0 && dayRecords.every((r) => r.status === 'DAY_OFF') && Boolean(firstRec?.reason);
      const customHolidayName = isCustomHoliday ? (firstRec?.reason || 'Dam olish kuni') : null;

      days.push({
        date: dateStr,
        dayNumber: day,
        dayOfWeek: dayOfWeek.short,
        dayOfWeekFull: dayOfWeek.full,
        isWeekend: weekend,
        isHoliday: Boolean(holiday) || isCustomHoliday,
        holidayName: holiday || customHolidayName,
      });
    }

    // Build matrix for each employee
    const matrix = employees.map((emp) => {
      const empRecords = days.map((d) => {
        const recId = `ts-${d.date}-${emp.id}`;
        return (
          dbStore.timesheets.get(recId) ||
          this.saveTimesheetRecord({ employeeId: emp.id, date: d.date })
        );
      });

      const totalWorkDays = empRecords.filter(
        (r) => r.status === 'PRESENT' || r.status === 'LATE' || r.status === 'FIELD_WORK'
      ).length;
      const totalWorkHours = empRecords.reduce((sum, r) => sum + (Number(r.workHours) || 0), 0);
      const totalExcusedDays = empRecords.filter((r) => r.status === 'EXCUSED').length;
      const totalAbsentDays = empRecords.filter((r) => r.status === 'ABSENT').length;
      const totalSickDays = empRecords.filter((r) => r.status === 'SICK_LEAVE').length;
      const totalDaysOff = empRecords.filter((r) => r.status === 'DAY_OFF').length;

      return {
        employee: emp,
        records: empRecords,
        summary: {
          totalWorkDays,
          totalWorkHours: Math.round(totalWorkHours * 10) / 10,
          totalExcusedDays,
          totalAbsentDays,
          totalSickDays,
          totalDaysOff,
        },
      };
    });

    return {
      year,
      month,
      totalDays,
      days,
      employees,
      matrix,
    };
  },
};
