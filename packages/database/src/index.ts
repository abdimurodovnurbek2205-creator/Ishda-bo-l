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
    // 1. Bo'lim Boshlig'i: Bo'riyev Shuxrat Xursandovich
    const adminUser: User & { passwordHash: string } = {
      id: 'usr-shuxrat',
      name: 'Bo‘riyev Shuxrat Xursandovich',
      email: 'shuxrat@bandixon.gov.uz',
      phone: '+998993361988',
      role: 'ADMIN',
      passwordHash: hashPassword('shuxrat2026'),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(adminUser.id, adminUser);

    const adminEmp: Employee = {
      id: 'emp-shuxrat',
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

    // 2. Abdurazzoqov Adham Ibragimovich (Prognoz bo'yicha yetakchi mutaxassis)
    const emp1User: User & { passwordHash: string } = {
      id: 'usr-adham',
      name: 'Abdurazzoqov Adham Ibragimovich',
      email: 'adham@bandixon.gov.uz',
      phone: '+998999509300',
      role: 'EMPLOYEE',
      passwordHash: hashPassword('adham2026'),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(emp1User.id, emp1User);

    const emp1: Employee = {
      id: 'emp-adham',
      userId: emp1User.id,
      employeeCode: 'EMP-101',
      department: 'Bandixon tuman O‘simliklar karantini va himoyasi bo‘limi',
      position: 'Prognoz bo‘yicha yetakchi mutaxassis',
      isTrackingEnabled: true,
      workingHoursStart: '08:00',
      workingHoursEnd: '17:00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: emp1User,
    };
    this.employees.set(emp1.id, emp1);

    // 3. Abdimurodov Nurbek Maxmud o'g'li (Akt bo'yicha yetakchi mutaxassis)
    const emp2User: User & { passwordHash: string } = {
      id: 'usr-nurbek',
      name: 'Abdimurodov Nurbek Maxmud o‘g‘li',
      email: 'nurbek@bandixon.gov.uz',
      phone: '+998958702122',
      role: 'EMPLOYEE',
      passwordHash: hashPassword('nurbek2026'),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(emp2User.id, emp2User);

    const emp2: Employee = {
      id: 'emp-nurbek',
      userId: emp2User.id,
      employeeCode: 'EMP-102',
      department: 'Bandixon tuman O‘simliklar karantini va himoyasi bo‘limi',
      position: 'Akt bo‘yicha yetakchi mutaxassis',
      isTrackingEnabled: true,
      workingHoursStart: '08:00',
      workingHoursEnd: '17:00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: emp2User,
    };
    this.employees.set(emp2.id, emp2);

    // 4. Eshboyev Sirojiddin Urol o'g'li (Davlat Inspektori)
    const emp3User: User & { passwordHash: string } = {
      id: 'usr-sirojiddin',
      name: 'Eshboyev Sirojiddin Urol o‘g‘li',
      email: 'sirojiddin@bandixon.gov.uz',
      phone: '+998978489495',
      role: 'EMPLOYEE',
      passwordHash: hashPassword('sirojiddin2026'),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(emp3User.id, emp3User);

    const emp3: Employee = {
      id: 'emp-sirojiddin',
      userId: emp3User.id,
      employeeCode: 'EMP-103',
      department: 'Bandixon tuman O‘simliklar karantini va himoyasi bo‘limi',
      position: 'Davlat inspektori',
      isTrackingEnabled: true,
      workingHoursStart: '08:00',
      workingHoursEnd: '17:00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: emp3User,
    };
    this.employees.set(emp3.id, emp3);

    // 5. Boboqulov Adham Xushboq o'g'li (Davlat inspektori)
    const emp4User: User & { passwordHash: string } = {
      id: 'usr-boboqulov',
      name: 'Boboqulov Adham Xushboq o‘g‘li',
      email: 'boboqulov@bandixon.gov.uz',
      phone: '+998933139495',
      role: 'EMPLOYEE',
      passwordHash: hashPassword('adham9495'),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(emp4User.id, emp4User);

    const emp4: Employee = {
      id: 'emp-boboqulov',
      userId: emp4User.id,
      employeeCode: 'EMP-104',
      department: 'Bandixon tuman O‘simliklar karantini va himoyasi bo‘limi',
      position: 'Davlat inspektori',
      isTrackingEnabled: true,
      workingHoursStart: '08:00',
      workingHoursEnd: '17:00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: emp4User,
    };
    this.employees.set(emp4.id, emp4);

    // 6. Yuldashev Eldor Turdimurot o'g'li (Davlat inspektori)
    const emp5User: User & { passwordHash: string } = {
      id: 'usr-yuldashev',
      name: 'Yuldashev Eldor Turdimurot o‘g‘li',
      email: 'yuldashev@bandixon.gov.uz',
      phone: '+998950681797',
      role: 'EMPLOYEE',
      passwordHash: hashPassword('eldor1797'),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(emp5User.id, emp5User);

    const emp5: Employee = {
      id: 'emp-yuldashev',
      userId: emp5User.id,
      employeeCode: 'EMP-105',
      department: 'Bandixon tuman O‘simliklar karantini va himoyasi bo‘limi',
      position: 'Davlat inspektori',
      isTrackingEnabled: true,
      workingHoursStart: '08:00',
      workingHoursEnd: '17:00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: emp5User,
    };
    this.employees.set(emp5.id, emp5);

    // 7. Yusupov Abdunazar Almurat o'g'li (Davlat inspektori)
    const emp6User: User & { passwordHash: string } = {
      id: 'usr-yusupov',
      name: 'Yusupov Abdunazar Almurat o‘g‘li',
      email: 'yusupov@bandixon.gov.uz',
      phone: '+998888460698',
      role: 'EMPLOYEE',
      passwordHash: hashPassword('abdunazar0698'),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(emp6User.id, emp6User);

    const emp6: Employee = {
      id: 'emp-yusupov',
      userId: emp6User.id,
      employeeCode: 'EMP-106',
      department: 'Bandixon tuman O‘simliklar karantini va himoyasi bo‘limi',
      position: 'Davlat inspektori',
      isTrackingEnabled: true,
      workingHoursStart: '08:00',
      workingHoursEnd: '17:00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: emp6User,
    };
    this.employees.set(emp6.id, emp6);

    // 8. O'rozov Isomiddin Azamat o'g'li (Davlat inspektori)
    const emp7User: User & { passwordHash: string } = {
      id: 'usr-orozov',
      name: 'O‘rozov Isomiddin Azamat o‘g‘li',
      email: 'orozov@bandixon.gov.uz',
      phone: '+998992652707',
      role: 'EMPLOYEE',
      passwordHash: hashPassword('isomiddin2707'),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.set(emp7User.id, emp7User);

    const emp7: Employee = {
      id: 'emp-orozov',
      userId: emp7User.id,
      employeeCode: 'EMP-107',
      department: 'Bandixon tuman O‘simliklar karantini va himoyasi bo‘limi',
      position: 'Davlat inspektori',
      isTrackingEnabled: true,
      workingHoursStart: '08:00',
      workingHoursEnd: '17:00',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: emp7User,
    };
    this.employees.set(emp7.id, emp7);

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
