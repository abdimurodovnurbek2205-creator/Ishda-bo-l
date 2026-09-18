import { Client } from 'pg';

const pass = encodeURIComponent("Ishdabo'l#123");
const ref = "sarinjrlatsuyvtbdcyw";

const connectionCandidates = [
  `postgresql://postgres:${pass}@db.${ref}.supabase.co:5432/postgres`,
  `postgresql://postgres.${ref}:${pass}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${ref}:${pass}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${ref}:${pass}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${ref}:${pass}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
];

async function tryConnect() {
  console.log('Testing connection candidates...');
  for (const connString of connectionCandidates) {
    const hidden = connString.replace(pass, '***');
    console.log(`Trying connection string: ${hidden}`);
    const client = new Client({
      connectionString: connString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    try {
      await client.connect();
      console.log(`SUCCESS! Connected via ${hidden}`);
      
      console.log('Creating tables in Supabase...');

      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role VARCHAR(20) NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS employees (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          employee_code VARCHAR(50) NOT NULL UNIQUE,
          department VARCHAR(100) NOT NULL,
          position VARCHAR(100) NOT NULL,
          is_tracking_enabled BOOLEAN NOT NULL DEFAULT true,
          working_hours_start VARCHAR(10) NOT NULL DEFAULT '08:00',
          working_hours_end VARCHAR(10) NOT NULL DEFAULT '17:00',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS locations (
          id VARCHAR(64) PRIMARY KEY,
          employee_id VARCHAR(64) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
          latitude DOUBLE PRECISION NOT NULL,
          longitude DOUBLE PRECISION NOT NULL,
          accuracy DOUBLE PRECISION,
          speed DOUBLE PRECISION,
          heading DOUBLE PRECISION,
          region VARCHAR(100),
          district VARCHAR(100),
          timestamp TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_locations_employee_id ON locations(employee_id);
        CREATE INDEX IF NOT EXISTS idx_locations_timestamp ON locations(timestamp);
        CREATE INDEX IF NOT EXISTS idx_locations_emp_timestamp ON locations(employee_id, timestamp);

        CREATE TABLE IF NOT EXISTS work_sessions (
          id VARCHAR(64) PRIMARY KEY,
          employee_id VARCHAR(64) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
          started_at TIMESTAMP NOT NULL,
          ended_at TIMESTAMP,
          start_latitude DOUBLE PRECISION,
          start_longitude DOUBLE PRECISION,
          end_latitude DOUBLE PRECISION,
          end_longitude DOUBLE PRECISION,
          status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS geofences (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          latitude DOUBLE PRECISION NOT NULL,
          longitude DOUBLE PRECISION NOT NULL,
          radius DOUBLE PRECISION NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR(64) PRIMARY KEY,
          user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          action VARCHAR(100) NOT NULL,
          metadata JSONB,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      console.log('Tables created successfully in Supabase!');

      // Seed Bandixon Geofence
      await client.query(`
        INSERT INTO geofences (id, name, latitude, longitude, radius, is_active, created_at)
        VALUES ('gf-1', 'Bandixon tuman O''simliklar karantini va himoyasi bo''limi', 37.842429, 67.377811, 500, true, NOW())
        ON CONFLICT DO NOTHING;
      `);

      // Seed Users
      await client.query(`
        INSERT INTO users (id, name, phone, email, password_hash, role, is_active, created_at, updated_at)
        VALUES 
          ('usr-admin-1', 'Sherzod Hakimov', '+998901234567', 'admin@bandixon.gov.uz', 'c81e728d9d4c2f636f067f89cc14862c', 'ADMIN', true, NOW(), NOW()),
          ('usr-emp-3', 'O''rozov Isomiddin', '+998992652707', 'orozov@bandixon.gov.uz', 'salt_bandixon_2026_123456', 'EMPLOYEE', true, NOW(), NOW())
        ON CONFLICT DO NOTHING;
      `);

      await client.query(`
        INSERT INTO employees (id, user_id, employee_code, department, position, is_tracking_enabled, working_hours_start, working_hours_end, created_at, updated_at)
        VALUES ('emp-3', 'usr-emp-3', 'EMP-325', 'Bandixon tuman O''simliklar karantini va himoyasi bo''limi', 'Davlat inspektori', true, '08:00', '17:00', NOW(), NOW())
        ON CONFLICT DO NOTHING;
      `);

      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema='public'
      `);
      console.log('Public tables in Supabase database:', tablesRes.rows.map(r => r.table_name));

      await client.end();
      return connString;
    } catch (err: any) {
      console.log(`Failed for ${hidden}: ${err.message}`);
      try { await client.end(); } catch (e) {}
    }
  }
  throw new Error('All connection attempts failed');
}

tryConnect()
  .then((workingString) => {
    console.log('SUCCESSFUL_CONNECTION_STRING:', workingString);
    process.exit(0);
  })
  .catch((e) => {
    console.error('Migration error:', e.message);
    process.exit(1);
  });
