import { pgTable, text, varchar, timestamp, boolean, doublePrecision, integer, index, jsonb } from 'drizzle-orm/pg-core';

// 1. Users Table
export const users = pgTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().$type<'ADMIN' | 'EMPLOYEE'>(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 2. Employees Table
export const employees = pgTable('employees', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: varchar('user_id', { length: 64 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  employeeCode: varchar('employee_code', { length: 50 }).notNull().unique(),
  department: varchar('department', { length: 100 }).notNull(),
  position: varchar('position', { length: 100 }).notNull(),
  isTrackingEnabled: boolean('is_tracking_enabled').notNull().default(true),
  workingHoursStart: varchar('working_hours_start', { length: 10 }).notNull().default('08:00'),
  workingHoursEnd: varchar('working_hours_end', { length: 10 }).notNull().default('17:00'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 3. Locations Table with required indexes
export const locations = pgTable('locations', {
  id: varchar('id', { length: 64 }).primaryKey(),
  employeeId: varchar('employee_id', { length: 64 }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  accuracy: doublePrecision('accuracy'),
  speed: doublePrecision('speed'),
  heading: doublePrecision('heading'),
  region: varchar('region', { length: 100 }),
  district: varchar('district', { length: 100 }),
  timestamp: timestamp('timestamp').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => {
  return {
    employeeIdIdx: index('idx_locations_employee_id').on(table.employeeId),
    timestampIdx: index('idx_locations_timestamp').on(table.timestamp),
    employeeTimestampIdx: index('idx_locations_emp_timestamp').on(table.employeeId, table.timestamp),
  };
});

// 4. Work Sessions Table
export const workSessions = pgTable('work_sessions', {
  id: varchar('id', { length: 64 }).primaryKey(),
  employeeId: varchar('employee_id', { length: 64 }).notNull().references(() => employees.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at'),
  startLatitude: doublePrecision('start_latitude'),
  startLongitude: doublePrecision('start_longitude'),
  endLatitude: doublePrecision('end_latitude'),
  endLongitude: doublePrecision('end_longitude'),
  status: varchar('status', { length: 20 }).notNull().$type<'ACTIVE' | 'COMPLETED'>().default('ACTIVE'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 5. Geofences Table
export const geofences = pgTable('geofences', {
  id: varchar('id', { length: 64 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  radius: doublePrecision('radius').notNull(), // Radius in meters
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 6. Audit Logs Table
export const auditLogs = pgTable('audit_logs', {
  id: varchar('id', { length: 64 }).primaryKey(),
  userId: varchar('user_id', { length: 64 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 100 }).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
