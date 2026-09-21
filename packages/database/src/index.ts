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
    // Bo'lim Boshlig'i: Bo'riyev Shuxrat (Bandixon tuman O'simliklar karantini va himoyasi bo'limi)
    const adminUser: User & { passwordHash: string } = {
      id: 'usr-admin-1',
      name: 'Bo‘riyev Shuxrat',
      email: 'boriyev@bandixon.gov.uz',
      phone: '+998901234567',
      role: 'ADMIN',
      passwordHash: hashPassword('shuxrat123'),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(adminUser.id, adminUser);

    const adminEmp: Employee = {
      id: 'emp-admin-1',
      userId: adminUser.id,
      employeeCode: 'EMP-001',
      department: 'Bandixon tuman O‘simliklar karantini va himoyasi bo‘limi',
      position: 'Bo‘lim boshlig‘i',
      isTrackingEnabled: false,
      workingHoursStart: '08:00',
      workingHoursEnd: '17:00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: adminUser,
    };
    this.employees.set(adminEmp.id, adminEmp);

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
