const fetch = require('node-fetch');

async function test() {
  const BASE_URL = 'http://localhost:3000';
  
  console.log('--- Testing Login ---');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  
  const loginData = await loginRes.json();
  console.log('Login Status:', loginRes.status);
  
  if (loginRes.status !== 200 || !loginData.token) {
    console.error('Login failed');
    return;
  }

  const token = loginData.token;

  console.log('\n--- Testing Project Creation ---');
  const projectCode = 'TEST_PRJ_' + Date.now();
  const projectRes = await fetch(`${BASE_URL}/api/projects`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      projectCode: projectCode,
      projectName: 'Test Project',
      client: 'Internal',
      ridPrefix: 'T',
      ridCountryCode: 'US',
      ridPadding: 4,
      ridCounter: 1,
      completeUrl: 'https://example.com/complete',
      terminateUrl: 'https://example.com/terminate',
      quotafullUrl: 'https://example.com/quotafull',
      securityUrl: 'https://example.com/security'
    })
  });

  const projectData = await projectRes.json();
  console.log('Project Creation Status:', projectRes.status);

  if (projectRes.status !== 201) {
    console.error('Project creation failed', projectData);
    return;
  }

  console.log('\n--- Testing Supplier Creation ---');
  const supplierRes = await fetch(`${BASE_URL}/api/suppliers`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: 'Test Supplier',
      code: 'SUP_' + Date.now(),
      completeUrl: 'https://supplier.com/complete',
      terminateUrl: 'https://supplier.com/terminate',
      quotafullUrl: 'https://supplier.com/quotafull',
      securityUrl: 'https://supplier.com/security'
    })
  });
  const supplierData = await supplierRes.json();
  console.log('Supplier Creation Status:', supplierRes.status);
  const supplierCode = supplierData.code;

  console.log('\n--- Testing Country Survey Creation ---');
  const surveyRes = await fetch(`${BASE_URL}/api/projects/${projectData.id}/surveys`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      projectCode: projectData.projectCode,
      countryCode: 'US',
      surveyUrl: 'https://survey.com/start?rid={RID}&session={oi_session}'
    })
  });
  console.log('Survey Creation Status:', surveyRes.status);

  console.log('\n--- Testing Tracking Redirection ---');
  const trackingUrl = `${BASE_URL}/track?code=${projectData.projectCode}&country=US&sup=${supplierCode}&uid=USER_001`;
  const trackRes = await fetch(trackingUrl, {
    method: 'GET',
    redirect: 'manual'
  });
  console.log('Tracking Status:', trackRes.status);
  console.log('Tracking Redirect to:', trackRes.headers.get('location'));

  const location = trackRes.headers.get('location');
  if (!location) {
    console.error('No redirect location found');
    return;
  }

  console.log('\n--- Testing Callback Handling ---');
  const oiSessionMatch = location.match(/session=([^&]+)/);
  const oiSession = oiSessionMatch ? oiSessionMatch[1] : null;

  if (oiSession) {
    console.log('Detected oiSession:', oiSession);
    const callbackUrl = `${BASE_URL}/api/complete?oi_session=${oiSession}`;
    const cbRes = await fetch(callbackUrl, {
      method: 'GET',
      redirect: 'manual'
    });
    console.log('Callback Status:', cbRes.status);
    console.log('Callback Redirect to:', cbRes.headers.get('location'));
  } else {
    console.error('Failed to detect oiSession from redirect URL');
  }
}

test();
