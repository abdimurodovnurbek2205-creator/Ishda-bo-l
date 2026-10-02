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
    let dir = process.cwd();
    for (let i = 0; i < 4; i++) {
      const candidateDir = path.join(dir, 'packages/database/data');
      if (fs.existsSync(candidateDir)) {
        return path.join(candidateDir, 'db_store.json');
      }
      if (fs.existsSync(path.join(dir, 'packages/database'))) {
        try {
          fs.mkdirSync(candidateDir, { recursive: true });
        } catch (e) {}
        return path.join(candidateDir, 'db_store.json');
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    return path.join(process.cwd(), 'db_store.json');
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
        const nowMs = Date.now();
        for (const ws of parsed.workSessions) {
          if (ws.status === 'ACTIVE' && ws.startedAt) {
            const ageHours = (nowMs - new Date(ws.startedAt).getTime()) / (1000 * 3600);
            if (ageHours > 16) {
              ws.status = 'COMPLETED';
              ws.endedAt = new Date(new Date(ws.startedAt).getTime() + 9 * 3600 * 1000).toISOString();
            }
          }
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
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) return;
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
      workingHoursStart: '09:00',
      workingHoursEnd: '18:00',
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
      workingHoursStart: '09:00',
      workingHoursEnd: '18:00',
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
      workingHoursStart: '09:00',
      workingHoursEnd: '18:00',
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
      workingHoursStart: '09:00',
      workingHoursEnd: '18:00',
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
      workingHoursStart: '09:00',
      workingHoursEnd: '18:00',
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
      workingHoursStart: '09:00',
      workingHoursEnd: '18:00',
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
      workingHoursStart: '09:00',
      workingHoursEnd: '18:00',
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
      workingHoursStart: '09:00',
      workingHoursEnd: '18:00',
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

    // Seed Active Work Session for today: O'rozov Isomiddin (Davlat inspektori)
    const todayMorning = new Date();
    todayMorning.setUTCHours(3, 45, 0, 0); // 08:45 AM Tashkent time

    const wsOrozov: WorkSession = {
      id: 'ws-orozov-today',
      employeeId: 'emp-orozov',
      startedAt: todayMorning.toISOString(),
      startLatitude: 37.842429,
      startLongitude: 67.377811,
      status: 'ACTIVE',
    };
    this.workSessions.set(wsOrozov.id, wsOrozov);

    // Today's agricultural inspection route & visited stops in Bandixon tumani
    const nowMs = Date.now();
    const orozovPoints: LocationPoint[] = [
      {
        id: 'loc-orozov-today-1',
        employeeId: 'emp-orozov',
        latitude: 37.842429,
        longitude: 67.377811,
        accuracy: 5,
        speed: 0,
        heading: 0,
        region: 'Surxondaryo viloyati',
        district: 'Bandixon tumani (Bo‘lim binosi)',
        timestamp: new Date(todayMorning.getTime()).toISOString(),
        createdAt: new Date(todayMorning.getTime()).toISOString(),
      },
      {
        id: 'loc-orozov-today-2',
        employeeId: 'emp-orozov',
        latitude: 37.8475,
        longitude: 67.3842,
        accuracy: 6,
        speed: 22,
        heading: 40,
        region: 'Surxondaryo viloyati',
        district: 'Bandixon tumani (Limonchilik issiqxona majmuasi)',
        timestamp: new Date(todayMorning.getTime() + 45 * 60000).toISOString(),
        createdAt: new Date(todayMorning.getTime() + 45 * 60000).toISOString(),
      },
      {
        id: 'loc-orozov-today-3',
        employeeId: 'emp-orozov',
        latitude: 37.8542,
        longitude: 67.3985,
        accuracy: 8,
        speed: 15,
        heading: 55,
        region: 'Surxondaryo viloyati',
        district: 'Bandixon tumani (Bektepa MFY bog‘dorchilik dalalari)',
        timestamp: new Date(todayMorning.getTime() + 90 * 60000).toISOString(),
        createdAt: new Date(todayMorning.getTime() + 90 * 60000).toISOString(),
      },
      {
        id: 'loc-orozov-today-4',
        employeeId: 'emp-orozov',
        latitude: 37.8630,
        longitude: 67.4110,
        accuracy: 5,
        speed: 18,
        heading: 30,
        region: 'Surxondaryo viloyati',
        district: 'Bandixon tumani (Chorvador MFY fitonazorat posti)',
        timestamp: new Date(todayMorning.getTime() + 160 * 60000).toISOString(),
        createdAt: new Date(todayMorning.getTime() + 160 * 60000).toISOString(),
      },
      {
        id: 'loc-orozov-today-5',
        employeeId: 'emp-orozov',
        latitude: 37.8510,
        longitude: 67.4230,
        accuracy: 7,
        speed: 20,
        heading: 120,
        region: 'Surxondaryo viloyati',
        district: 'Bandixon tumani (Poliz va g‘allachilik fermer xo‘jaligi)',
        timestamp: new Date(todayMorning.getTime() + 240 * 60000).toISOString(),
        createdAt: new Date(todayMorning.getTime() + 240 * 60000).toISOString(),
      },
      {
        id: 'loc-orozov-today-6',
        employeeId: 'emp-orozov',
        latitude: 37.8445,
        longitude: 67.3910,
        accuracy: 5,
        speed: 24,
        heading: 230,
        region: 'Surxondaryo viloyati',
        district: 'Bandixon tumani (Markaziy agrologistika yo‘nalishi)',
        timestamp: new Date(todayMorning.getTime() + 320 * 60000).toISOString(),
        createdAt: new Date(todayMorning.getTime() + 320 * 60000).toISOString(),
      },
      {
        id: 'loc-orozov-today-7',
        employeeId: 'emp-orozov',
        latitude: 37.8432,
        longitude: 67.3805,
        accuracy: 4,
        speed: 0,
        heading: 180,
        region: 'Surxondaryo viloyati',
        district: 'Bandixon tumani (Fitosanitar laboratoriya va karantin punkti)',
        timestamp: new Date(Math.max(todayMorning.getTime() + 360 * 60000, nowMs - 45000)).toISOString(),
        createdAt: new Date(Math.max(todayMorning.getTime() + 360 * 60000, nowMs - 45000)).toISOString(),
      },
    ];

    for (const p of orozovPoints) {
      this.locations.push(p);
    }
  }
}

export const dbStore = new MemoryDatabase();

export { schema };
