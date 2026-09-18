const https = require('https');

const apiKey = 'rnd_hgNsIkhWrPLBhRUIXIs6fLRaH5B2';
const ownerId = 'tea-d9ullndbedkc73ah26l0'; // My Workspace

const payload = {
  type: 'web_service',
  name: 'ishda-bol-gps',
  ownerId: ownerId,
  repo: 'https://github.com/abdimurodovnurbek2205-creator/Ishda-bo-l',
  autoDeploy: 'yes',
  branch: 'main',
  serviceDetails: {
    env: 'node',
    plan: 'free',
    region: 'virginia',
    envSpecificDetails: {
      buildCommand: 'npm install; npm run build',
      startCommand: 'npm run start'
    },
    envVars: [
      {
        key: 'DATABASE_URL',
        value: "postgresql://postgres.sarinjrlatsuyvtbdcyw:Ishdabo%27l%23123@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
      },
      {
        key: 'NEXT_PUBLIC_SUPABASE_URL',
        value: 'https://sarinjrlatsuyvtbdcyw.supabase.co'
      },
      {
        key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        value: 'sb_publishable_ytIOPt3UgsQpAhafYFGV4w_v0W3nxcr'
      },
      {
        key: 'NODE_ENV',
        value: 'production'
      }
    ]
  }
};

function renderApiCall(path, method, bodyData) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(bodyData);
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: '/v1' + path,
      method: method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function createService() {
  console.log('Creating new Web Service on Render for Ishda-bo-l repo...');
  const res = await renderApiCall('/services', 'POST', payload);
  console.log('Create Web Service Response:', JSON.stringify(res, null, 2));
}

createService();
