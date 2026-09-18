const https = require('https');
const apiKey = 'rnd_hgNsIkhWrPLBhRUIXIs6fLRaH5B2';

function renderApiCall(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: '/v1' + path,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function listServices() {
  const res = await renderApiCall('/services');
  console.log('Services:', JSON.stringify(res, null, 2));
}

listServices();
