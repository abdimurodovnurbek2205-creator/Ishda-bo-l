import * as schema from './schema';
import { User, Employee, LocationPoint, WorkSession, Geofence, AuditLog } from '@repo/types';

// Deterministic SHA-256 password hasher
function hashPassword(password: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(`salt_bandixon_2026_${password}`).digest('hex');
}

// Storage Engine with File Persistence for dev/production fallback
class MemoryDatabase {
  users: Map<string, User & { passwordHash: string }> = new Map();
  employees: Map<string, Employee> = new Map();
  locations: LocationPoint[] = [];
  workSessions: Map<string, WorkSession> = new Map();
  geofences: Map<string, Geofence> = new Map();
  auditLogs: AuditLog[] = [];

  constructor() {
    this.seedInitialData();
    this.loadFromFile();
  }

  getDbFilePath() {
    const path = require('path');
    const fs = require('fs');
    const dir = path.join(process.cwd(), 'packages/database/data');
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (e) {}
    }
    return path.join(dir, 'db_store.json');
  }

  loadFromFile() {
    try {
      const fs = require('fs');
      const filePath = this.getDbFilePath();
      if (!fs.existsSync(filePath)) return;

      const raw = fs.readFileSync(filePath, 'utf8');
      if (!raw) return;

      const parsed = JSON.parse(raw);

      if (parsed.users && Array.isArray(parsed.users)) {
        for (const u of parsed.users) {
          this.users.set(u.id, u);
        }
      }

      if (parsed.employees && Array.isArray(parsed.employees)) {
        for (const emp of parsed.employees) {
          this.employees.set(emp.id, emp);
        }
      }

      if (parsed.workSessions && Array.isArray(parsed.workSessions)) {
        for (const ws of parsed.workSessions) {
          this.workSessions.set(ws.id, ws);
        }
      }

      if (parsed.locations && Array.isArray(parsed.locations)) {
        this.locations = parsed.locations;
      }

      if (parsed.geofences && Array.isArray(parsed.geofences)) {
        for (const gf of parsed.geofences) {
          this.geofences.set(gf.id, gf);
        }
      }
    } catch (err) {
      console.log('File store load error handled:', err);
    }
  }

  saveToFile() {
    try {
      const fs = require('fs');
      const filePath = this.getDbFilePath();
      const payload = {
        users: Array.from(this.users.values()),
        employees: Array.from(this.employees.values()),
        workSessions: Array.from(this.workSessions.values()),
        locations: this.locations,
        geofences: Array.from(this.geofences.values()),
      };
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
    } catch (err) {
      console.log('File store save error handled:', err);
    }
  }

  seedInitialData() {
    // Admin user: admin@bandixon.gov.uz / admin123
    const adminUser: User & { passwordHash: string } = {
      id: 'usr-admin-1',
      name: 'Sherzod Hakimov',
      email: 'admin@bandixon.gov.uz',
      phone: '+998901234567',
      role: 'ADMIN',
      passwordHash: hashPassword('admin123'),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(adminUser.id, adminUser);

    // Employee 1: Ali Valiyev (Bandixon HQ)
    const emp1User: User & { passwordHash: string } = {
      id: 'usr-emp-1',
      name: 'Ali Valiyev',
      email: 'ali@bandixon.gov.uz',
      phone: '+998912345678',
      role: 'EMPLOYEE',
      passwordHash: hashPassword('emp123'),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(emp1User.id, emp1User);

    const emp1: Employee = {
      id: 'emp-1',
      userId: emp1User.id,
      employeeCode: 'EMP-101',
      department: 'Monitoring Bo‘limi',
      position: 'Katta Mutaxassis',
      isTrackingEnabled: true,
      workingHoursStart: '08:00',
      workingHoursEnd: '17:00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: emp1User,
    };
    this.employees.set(emp1.id, emp1);

    // Employee 2: Bekzod Karimov (Qumqo'rg'on / Termiz inspector)
    const emp2User: User & { passwordHash: string } = {
      id: 'usr-emp-2',
      name: 'Bekzod Karimov',
      email: 'bekzod@bandixon.gov.uz',
      phone: '+998934567890',
      role: 'EMPLOYEE',
      passwordHash: hashPassword('emp123'),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(emp2User.id, emp2User);

    const emp2: Employee = {
      id: 'emp-2',
      userId: emp2User.id,
      employeeCode: 'EMP-102',
      department: 'Nazoratchilar Bo‘limi',
      position: 'Inspektor',
      isTrackingEnabled: true,
      workingHoursStart: '08:00',
      workingHoursEnd: '17:00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: emp2User,
    };
    this.employees.set(emp2.id, emp2);

    // Employee 3: O'rozov Isomiddin (Bandixon tuman O'simliklarni himoya qilish bo'limi)
    const emp3User: User & { passwordHash: string } = {
      id: 'usr-emp-3',
      name: "O'rozov Isomiddin",
      email: 'orozov@bandixon.gov.uz',
      phone: '+998992652707',
      role: 'EMPLOYEE',
      passwordHash: hashPassword('123456'),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(emp3User.id, emp3User);

    const emp3: Employee = {
      id: 'emp-3',
      userId: emp3User.id,
      employeeCode: 'EMP-325',
      department: "Bandixon tuman O'simliklarni himoya qilish bo'limi",
      position: 'Davlat inspektori',
      isTrackingEnabled: true,
      workingHoursStart: '08:00',
      workingHoursEnd: '17:00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: emp3User,
    };
    this.employees.set(emp3.id, emp3);

    // Seed active work session for Ali Valiyev starting in Bandixon District Center
    const session1: WorkSession = {
      id: 'ws-1',
      employeeId: 'emp-1',
      startedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
      startLatitude: 37.5255,
      startLongitude: 67.2458,
      status: 'ACTIVE',
    };
    this.workSessions.set(session1.id, session1);

    // Seed location points for Ali (Bandixon District -> Qumqo'rg'on)
    const now = Date.now();
    this.locations.push(
      {
        id: 'loc-1',
        employeeId: 'emp-1',
        latitude: 37.5255,
        longitude: 67.2458,
        accuracy: 5.0,
        speed: 0,
        heading: 0,
        region: 'Surxondaryo viloyati',
        district: 'Bandixon tumani',
        timestamp: new Date(now - 3600 * 1000 * 3.5).toISOString(),
        createdAt: new Date(now - 3600 * 1000 * 3.5).toISOString(),
      },
      {
        id: 'loc-2',
        employeeId: 'emp-1',
        latitude: 37.5310,
        longitude: 67.2600,
        accuracy: 8.0,
        speed: 45,
        heading: 90,
        region: 'Surxondaryo viloyati',
        district: 'Bandixon tumani',
        timestamp: new Date(now - 3600 * 1000 * 2).toISOString(),
        createdAt: new Date(now - 3600 * 1000 * 2).toISOString(),
      },
      {
        id: 'loc-3',
        employeeId: 'emp-1',
        latitude: 37.4950,
        longitude: 67.4100,
        accuracy: 6.0,
        speed: 60,
        heading: 120,
        region: 'Surxondaryo viloyati',
        district: 'Qumqo‘rg‘on tumani',
        timestamp: new Date(now - 120 * 1000).toISOString(),
        createdAt: new Date(now - 120 * 1000).toISOString(),
      }
    );

    // Seed default Geofence: Bandixon tuman O'simliklar karantini va himoyasi bo'limi
    const gf1: Geofence = {
      id: 'gf-1',
      name: "Bandixon tuman O'simliklar karantini va himoyasi bo'limi",
      latitude: 37.842429,
      longitude: 67.377811,
      radius: 500,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.geofences.set(gf1.id, gf1);
  }
}

export const dbStore = new MemoryDatabase();

export { schema };
