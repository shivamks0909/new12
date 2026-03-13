// Using native fetch
const BASE_URL = 'http://localhost:3000';

async function test() {
  console.log('--- Testing API ---');
  
  // 1. Login
  console.log('Attempting login...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    console.error('Login failed:', loginData);
    return;
  }
  console.log('Login success! Token received.');
  const token = loginData.token;

  // 2. Fetch Projects
  console.log('Fetching projects...');
  const projRes = await fetch(`${BASE_URL}/api/projects`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const projects = await projRes.json();
  console.log(`Found ${projects.length} projects.`);

  // 3. Create Project
  console.log('Creating project TEST_API_01...');
  const createRes = await fetch(`${BASE_URL}/api/projects`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      projectCode: 'TEST_API_01',
      projectName: 'API Test Project',
      client: 'System Test',
      status: 'active'
    })
  });
  
  const createData = await createRes.json();
  if (!createRes.ok) {
    console.error('Project creation failed:', createData);
  } else {
    console.log('Project created successfully!');
    console.log('Project ID:', createData.id);
  }

  // 4. Verify Project Redirection (Tracking)
  console.log('Testing tracking redirection for TEST_API_01...');
  const trackRes = await fetch(`${BASE_URL}/r/TEST_API_01`, {
    redirect: 'manual'
  });
  console.log('Tracking URL response status:', trackRes.status);
  console.log('Redirect Location:', trackRes.headers.get('location'));
}

test().catch(console.error);
