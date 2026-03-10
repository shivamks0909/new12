import http from 'http';

function requestRedirect(urlStr, cookieStr = '') {
    return new Promise((resolve, reject) => {
        const req = http.get(urlStr, { headers: { Cookie: cookieStr } }, (res) => {
            resolve({ statusCode: res.statusCode, location: res.headers.location, headers: res.headers });
        });
        req.on('error', reject);
    });
}

function getJson(urlStr, cookieStr = '') {
    return new Promise((resolve, reject) => {
        const req = http.get(urlStr, { headers: { Cookie: cookieStr } }, (res) => {
            let result = '';
            res.on('data', d => result += d);
            res.on('end', () => {
                try {
                    resolve({ statusCode: res.statusCode, data: JSON.parse(result || '{}'), headers: res.headers });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data: result, headers: res.headers });
                }
            });
        });
        req.on('error', reject);
    });
}

function postJson(urlStr, data, cookieStr = '') {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const body = JSON.stringify(data);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                'Cookie': cookieStr
            }
        };

        const req = http.request(options, (res) => {
            let result = '';
            res.on('data', d => result += d);
            res.on('end', () => {
                try {
                    resolve({ statusCode: res.statusCode, data: JSON.parse(result || '{}'), headers: res.headers });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data: result, headers: res.headers });
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function runE2ETest() {
    const baseUrl = 'http://localhost:3001';
    console.log('--- Starting E2E Verification of Custom Stable RID System ---');

    try {
        // 1. Login
        console.log('1. Logging in as admin...');
        const loginRes = await postJson(`${baseUrl}/api/auth/login`, { username: 'admin', password: 'admin123' });
        if (loginRes.statusCode !== 200) throw new Error(`Login failed: ${loginRes.statusCode}`);

        let cookie = '';
        if (loginRes.headers['set-cookie']) {
            cookie = loginRes.headers['set-cookie'][0].split(';')[0];
        }
        console.log('   Login successful.');

        // 2. Create Project
        console.log('2. Creating a new project with custom RID Config...');
        const projectRes = await postJson(`${baseUrl}/api/projects`, {
            pid: 'RID-VERIFY-01',
            name: 'Verification Custom RID',
            surveyUrl: 'https://example.com/survey',
            clientRidPrefix: 'VMOEXR',
            clientRidCountryCode: 'US',
            clientRidPadding: 3,
            status: 'active'
        }, cookie);

        if (projectRes.statusCode !== 200 && projectRes.statusCode !== 201) {
            throw new Error(`Project creation failed: ${projectRes.statusCode} ${JSON.stringify(projectRes.data)}`);
        }
        const project = projectRes.data;
        console.log(`   Project created successfully with ID: ${project.id}`);

        // 3. Add Supplier
        console.log('3. Adding a supplier to generate entry link...');
        const supplierRes = await postJson(`${baseUrl}/api/projects/${project.id}/suppliers`, {
            name: 'Test Supplier custom',
            supplierCode: 'TSTC'
        }, cookie);

        if (supplierRes.statusCode !== 200 && supplierRes.statusCode !== 201) {
            throw new Error(`Supplier creation failed: ${supplierRes.statusCode} ${JSON.stringify(supplierRes.data)}`);
        }
        const supplierLink = supplierRes.data.entryLink;
        console.log(`   Supplier entry link generated: ${supplierLink}`);

        // 4. Test Redirect 1
        console.log('4. Making first request to entry link (simulating RARUS01)...');
        const realSupplierLink1 = supplierLink.replace('{RID}', 'RARUS01');
        const redirect1Res = await requestRedirect(realSupplierLink1);
        console.log(`   Response 1 Status: ${redirect1Res.statusCode}`);

        // 5. Test Redirect 2
        console.log('5. Making second request to entry link (simulating RARUS02)...');
        const realSupplierLink2 = supplierLink.replace('{RID}', 'RARUS02');
        const redirect2Res = await requestRedirect(realSupplierLink2);
        console.log(`   Response 2 Status: ${redirect2Res.statusCode}`);

        // 6. Verify in Database
        console.log('6. Verifying generated RIDs in database responses...');
        const responsesRes = await getJson(`${baseUrl}/api/responses?projectId=${project.id}`, cookie);
        const responses = responsesRes.data.data || [];

        // The sorting is by createdAt desc, so the newest (RARUS02) is first.
        const resp2 = responses.find((r: any) => r.uid === 'RARUS02');
        const resp1 = responses.find((r: any) => r.uid === 'RARUS01');

        if (!resp1) throw new Error('First response (RARUS01) not found in DB');
        if (!resp2) throw new Error('Second response (RARUS02) not found in DB');

        console.log(`   Internal DB Resp 1 (Original: ${resp1.uid}) -> Generated stableRid: ${resp1.stableRid}`);
        console.log(`   Internal DB Resp 2 (Original: ${resp2.uid}) -> Generated stableRid: ${resp2.stableRid}`);

        if (resp1.stableRid !== 'VMOEXRUS001') {
            throw new Error(`Expected VMOEXRUS001 but got ${resp1.stableRid}`);
        }
        console.log('   ✅ First custom RID verified.');

        if (resp2.stableRid !== 'VMOEXRUS002') {
            throw new Error(`Expected VMOEXRUS002 but got ${resp2.stableRid}`);
        }
        console.log('   ✅ Second custom RID verified sequentially.');

        console.log('--- E2E Verification Completed Successfully ---');
        process.exit(0);
    } catch (error: any) {
        console.error('--- Test Failed ---');
        console.error(error.stack || error.message);
        process.exit(1);
    }
}

runE2ETest();
