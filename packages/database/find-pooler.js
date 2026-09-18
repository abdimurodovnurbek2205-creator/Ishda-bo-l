const { Client } = require('pg');

const pass = encodeURIComponent("Ishdabo'l#123");
const ref = "sarinjrlatsuyvtbdcyw";

const regions = [
  'ap-southeast-1', 'ap-south-1', 'ap-northeast-1', 'ap-northeast-2', 'ap-southeast-2',
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'me-central-1',
  'us-east-1', 'us-west-1', 'us-east-2', 'sa-east-1'
];

async function scan() {
  for (const region of regions) {
    for (const prefix of ['aws-0', 'aws-1']) {
      for (const port of [5432, 6543]) {
        const host = `${prefix}-${region}.pooler.supabase.com`;
        const connString = `postgresql://postgres.${ref}:${pass}@${host}:${port}/postgres`;
        const client = new Client({
          connectionString: connString,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 2500,
        });

        try {
          console.log(`Checking ${host}:${port}...`);
          await client.connect();
          console.log(`FOUND WORKING POOLER! ${host}:${port}`);
          await client.end();
          return connString;
        } catch (err) {
          if (!err.message.includes('tenant/user') && !err.message.includes('ENOTFOUND') && !err.message.includes('timeout')) {
            console.log(`Interesting response from ${host}:${port} -> ${err.message}`);
          }
          try { await client.end(); } catch (e) {}
        }
      }
    }
  }
  throw new Error('No working pooler region found');
}

scan()
  .then(res => console.log('RESULT_CONNECTION:', res))
  .catch(err => console.error('SCAN_ERROR:', err.message));
