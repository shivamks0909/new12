const http = require('http');

function postJson(urlStr, data, cookieStr = '') {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const body = JSON.stringify(data);
        const options = {
            hostname: url.hostname, port: url.port, path: url.pathname + url.search, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'Cookie': cookieStr }
        };

        const req = http.request(options, (res) => {
            let result = '';
            res.on('data', d => result += d);
            res.on('end', () => resolve({ statusCode: res.statusCode, data: JSON.parse(result || '{}'), headers: res.headers }));
        });
        req.on('error', reject); req.write(body); req.end();
    });
}

async function debug() {
    const loginRes = await postJson(`http://localhost:3001/api/auth/login`, { username: 'admin', password: 'admin123' });
    const cookie = loginRes.headers['set-cookie'][0].split(';')[0];

    const projectRes = await postJson(`http://localhost:3001/api/projects`, {
        pid: 'TEST-100', name: 'Test 100', status: 'active', clientRidPrefix: 'VMOEXR', clientRidCountryCode: 'US', clientRidPadding: 3
    }, cookie);
    const p = projectRes.data;
    console.log("Proj:", p);

    const supRes = await postJson(`http://localhost:3001/api/projects/${p.id}/suppliers`, { name: 'Sup', supplierCode: 'S1' }, cookie);
    console.log("Sup:", supRes.data);

    const link = supRes.data.entryLink.replace('{RID}', 'MYUID123');
    console.log("Link:", link);

    http.get(link, (res) => {
        console.log("Entry HTTP Status:", res.statusCode, res.headers.location);
        http.get(`http://localhost:3001/api/responses?projectId=${p.id}`, { headers: { Cookie: cookie } }, (res2) => {
            let b = ''; res2.on('data', d => b += d); res2.on('end', () => console.log("Responses:", b));
        });
    });
}
debug();
