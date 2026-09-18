const https = require('https');

const apiKey = 'rnd_hgNsIkhWrPLBhRUIXIs6fLRaH5B2';
const serviceId = 'srv-d9um53ugekts73cpu5j0';

const envVars = [
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
];

function renderApiCall(path, method, bodyData) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(bodyData);
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: '/v1' + path,
      method: method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(payload)
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
    req.write(payload);
    req.end();
  });
}

async function updateEnvAndDeploy() {
  console.log('Setting Environment Variables on Render Web Service...');
  const envRes = await renderApiCall(`/services/${serviceId}/env-vars`, 'PUT', envVars);
  console.log('Env Vars update result:', JSON.stringify(envRes, null, 2));

  console.log('Triggering new Deploy on Render...');
  const deployRes = await renderApiCall(`/services/${serviceId}/deploys`, 'POST', { clearCache: 'do_not_clear' });
  console.log('Deploy result:', JSON.stringify(deployRes, null, 2));
}

updateEnvAndDeploy();
