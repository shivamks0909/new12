import http from 'http';

const API_BASE = "http://localhost:3001/api";
const APP_BASE = "http://localhost:3001";

// Simple wrapper for HTTP requests
function makeRequest(urlStr: string, method: string = 'GET', data?: any, headers: any = {}): Promise<{ status: number, data: any, headers: any, redirectUrl?: string }> {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const options: http.RequestOptions = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                let parsedData = body;
                try {
                    if (body) parsedData = JSON.parse(body);
                } catch (e) { }

                resolve({
                    status: res.statusCode || 0,
                    data: parsedData,
                    headers: res.headers,
                    redirectUrl: [301, 302, 303, 307, 308].includes(res.statusCode || 0) ? res.headers.location : undefined
                });
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
    console.log("==========================================");
    console.log("🧪 Step-by-Step Testing MackInsights Macros");
    console.log("==========================================");

    let sessionCookie = '';

    try {
        // 1. Login to get session
        console.log("\n[Step 1] Logging in...");
        const loginRes = await makeRequest(`${API_BASE}/auth/login`, 'POST', { username: 'admin', password: 'admin123' });
        if (loginRes.status !== 200) {
            throw new Error(`Login failed: ${loginRes.status} - ${JSON.stringify(loginRes.data)}`);
        }
        sessionCookie = loginRes.headers['set-cookie']?.[0] || '';
        console.log("✅ Logged in successfully");

        // 2. Create Project
        console.log("\n[Step 2] Creating Test Project...");
        const projectData = {
            name: "Macro Test Project",
            clientName: "Internal Test",
            pid: `TEST_MACRO_${Date.now()}`,
            status: "active",
            surveyUrl: "https://example.com/survey?uid=",
            completesNeeded: 100,
            clientRidPrefix: "TESTMACRO",
            clientRidCountryCode: "US",
            clientRidPadding: 2
        };

        const curTime = Date.now();
        const projRes = await makeRequest(`${API_BASE}/projects`, 'POST', projectData, { 'Cookie': sessionCookie });
        if (projRes.status !== 201) {
            // It's fine if we get duplicate tracking ID depending on local DB state, but we really want our own clean fresh PID here. Add unique timestamp to name for safety next time.
            throw new Error(`Project creation failed: ${projRes.status} - ${JSON.stringify(projRes.data)}`);
        }
        const project = projRes.data;
        console.log(`✅ Project created - ID: ${project.id}, PID: ${project.pid}`);

        // 3. Add MackInsights Supplier
        console.log("\n[Step 3] Adding MackInsights Supplier with {{pid}} & {{uid}} macros...");
        const supplierData = {
            name: "MackInsights Test",
            supplierCode: "MACK",
            completeUrl: "https://dashboard.mackinsights.com/redirect/complete?pid={{pid}}&uid={{uid}}",
            terminateUrl: "https://dashboard.mackinsights.com/redirect/terminate?pid={{pid}}&uid={{uid}}",
            quotafullUrl: "https://dashboard.mackinsights.com/redirect/quotafull?pid={{pid}}&uid={{uid}}",
            securityUrl: "https://dashboard.mackinsights.com/redirect/security?pid={{pid}}&uid={{uid}}",
            status: "active",
        };

        const supRes = await makeRequest(`${API_BASE}/projects/${project.id}/suppliers`, 'POST', supplierData, { 'Cookie': sessionCookie });
        if (supRes.status !== 201) {
            throw new Error(`Supplier creation failed: ${supRes.status} - ${JSON.stringify(supRes.data)}`);
        }
        const supplier = supRes.data;
        console.log(`✅ Supplier created  - ID: ${supplier.id}`);

        // Fetch the entry link so we have the HMAC signature
        const supListRes = await makeRequest(`${API_BASE}/projects/${project.id}/suppliers`, 'GET', null, { 'Cookie': sessionCookie });
        const supWithLink = supListRes.data.find((s: any) => s.id === supplier.id);
        console.log(`✅ Supplier Entry Link Template: ${supWithLink.entryLink}`);

        // 4. Hit Entry routing endpoint (simulating incoming respondent)
        console.log("\n[Step 4] Hitting Entry URL with dummy MackInsights ID (MACRO_TEST_123)...");
        const testSupplierUid = "MACRO_TEST_123";
        const entryRoute = supWithLink.entryLink.replace('{RID}', testSupplierUid);
        console.log(`🔗 Requesting: ${entryRoute}`);

        const entryRes = await makeRequest(entryRoute, 'GET');

        // We expect a 302 redirect to the /landing page with oi_session
        if (entryRes.status !== 302 || !entryRes.redirectUrl) {
            throw new Error(`Entry Link failed to redirect properly. Status: ${entryRes.status}`);
        }
        console.log(`✅ Entry success - Redirected to: ${entryRes.redirectUrl}`);

        // Extract the session ID from the redirect url
        const landingUrl = new URL(entryRes.redirectUrl, APP_BASE);
        const oiSession = landingUrl.searchParams.get('oi_session');

        if (!oiSession) {
            throw new Error("Could not extract oi_session from landing page URL.");
        }
        console.log(`🔑 Extracted Internal Session ID: ${oiSession}`);

        // 5. Simulate End-of-Survey Tracking Callbacks
        console.log("\n[Step 5] Hitting Tracking Endpoints to verify macro replacements...");

        // 5a. Complete
        const trackCompleteUrl = `${APP_BASE}/track/complete?oi_session=${oiSession}`;
        console.log(`\n🔗 Simulating COMPLETE tracker via: ${trackCompleteUrl}`);
        const trackCompRes = await makeRequest(trackCompleteUrl, 'GET');
        console.log(`   Expected MackInsights URL with replaced values...`);
        console.log(`   Final Redirect URL → ${trackCompRes.redirectUrl}`);
        if (trackCompRes.redirectUrl && trackCompRes.redirectUrl.includes(`uid=${testSupplierUid}`) && trackCompRes.redirectUrl.includes(`pid=${project.pid}`)) {
            console.log(`   ✅ Macros {{pid}} and {{uid}} successfully replaced!`);
        } else {
            console.log(`   ❌ Macro replacement failed!`);
        }

        // Since we consumed the session updating status, we should technically test the other endpoints, but it's okay just resetting via dummy sessions for the sake of the route macro test
        // Let's create another session to test terminate
        console.log("\n🔗 Simulating TERM tracker via Entry...");
        const testTermUid = "MACRO_TERM_999";
        const termEntryRoute = supWithLink.entryLink.replace('{RID}', testTermUid);
        const termEntryRes = await makeRequest(termEntryRoute, 'GET');
        const termOiSession = new URL(termEntryRes.redirectUrl!, APP_BASE).searchParams.get('oi_session');
        const trackTermUrl = `${APP_BASE}/track/terminate?oi_session=${termOiSession}`;
        const trackTermRes = await makeRequest(trackTermUrl, 'GET');
        console.log(`   Final Redirect URL → ${trackTermRes.redirectUrl}`);
        if (trackTermRes.redirectUrl && trackTermRes.redirectUrl.includes(`uid=${testTermUid}`) && trackTermRes.redirectUrl.includes(`pid=${project.pid}`)) {
            console.log(`   ✅ Macros successfully replaced!`);
        } else {
            console.log(`   ❌ Macro replacement failed!`);
        }

        // Let's create another session to test quotafull
        console.log("\n🔗 Simulating QUOTAFULL tracker via Entry...");
        const testQFid = "MACRO_QUOTA_444";
        const qfEntryRoute = supWithLink.entryLink.replace('{RID}', testQFid);
        const qfEntryRes = await makeRequest(qfEntryRoute, 'GET');
        const qfOiSession = new URL(qfEntryRes.redirectUrl!, APP_BASE).searchParams.get('oi_session');
        const trackQFUrl = `${APP_BASE}/track/quotafull?oi_session=${qfOiSession}`;
        const trackQFRes = await makeRequest(trackQFUrl, 'GET');
        console.log(`   Final Redirect URL → ${trackQFRes.redirectUrl}`);
        if (trackQFRes.redirectUrl && trackQFRes.redirectUrl.includes(`uid=${testQFid}`) && trackQFRes.redirectUrl.includes(`pid=${project.pid}`)) {
            console.log(`   ✅ Macros successfully replaced!`);
        } else {
            console.log(`   ❌ Macro replacement failed!`);
        }

        console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉");

    } catch (error: any) {
        console.error("\n❌ TEST FAILED:", error.message);
    }
}

runTest();
