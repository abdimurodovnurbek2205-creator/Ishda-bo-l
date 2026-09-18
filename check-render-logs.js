const https = require('https');
const apiKey = 'rnd_hgNsIkhWrPLBhRUIXIs6fLRaH5B2';
const serviceId = 'srv-damh4clbedkc73bo2qp0';

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

async function checkDeploy() {
  console.log('Fetching deploys for ishda-bol-gps...');
  const deploys = await renderApiCall(`/services/${serviceId}/deploys?limit=5`);
  console.log('Deploys:', JSON.stringify(deploys, null, 2));
}

checkDeploy();
