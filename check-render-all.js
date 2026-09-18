const https = require('https');
const apiKey = 'rnd_hgNsIkhWrPLBhRUIXIs6fLRaH5B2';

function renderApiCall(path, method = 'GET', bodyData = null) {
  return new Promise((resolve, reject) => {
    const payload = bodyData ? JSON.stringify(bodyData) : null;
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: '/v1' + path,
      method: method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
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
    if (payload) req.write(payload);
    req.end();
  });
}

async function check() {
  console.log('Listing all services on Render...');
  const services = await renderApiCall('/services?limit=20');
  console.log('All Services:', JSON.stringify(services, null, 2));
}

check();
