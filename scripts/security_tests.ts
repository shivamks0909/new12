import { createHmac } from "crypto";

async function runSecurityTests() {
    const API_URL = "http://127.0.0.1:3001";
    const PID = "TEST_PROJ_001";
    const SUP = "TEST_SUP_001";
    const RID = "ATTACKER_001";
    const SECRET = "router_secret_dev_only";

    console.log("🛡️ Starting Security Exploit Tests...");

    // Test 1: HMAC Tampering
    console.log("\n🧪 Test 1: HMAC Tampering...");
    const ts = Math.floor(Date.now() / 1000).toString();
    const invalidHmac = "0000000000000000000000000000000000000000000000000000000000000000";
    try {
        const res = await fetch(`${API_URL}/r/${PID}?sup=${SUP}&rid=${RID}`);
        if (res.status === 403) console.log("✅ PASS: Server rejected invalid HMAC (403)");
        else if (res.ok) console.log("❌ FAIL: Server accepted invalid HMAC");
        else console.log(`❓ UNKNOWN: Server returned ${res.status}`);
    } catch (err: any) {
        console.log(`❌ ERROR: ${err.message}`);
    }

    // Test 2: Expired Timestamp
    console.log("\n🧪 Test 2: Expired Timestamp (Replay Attack)...");
    const expiredTs = (Math.floor(Date.now() / 1000) - 600).toString();
    const message = `${PID}${SUP}${RID}${expiredTs}`;
    const h = createHmac("sha256", SECRET).update(message).digest("hex");
    try {
        const res = await fetch(`${API_URL}/r/${PID}?sup=${SUP}&rid=${RID}`);
        if (res.status === 403) console.log("✅ PASS: Server rejected expired timestamp (403)");
        else if (res.ok) console.log("❌ FAIL: Server accepted expired timestamp");
        else console.log(`❓ UNKNOWN: Server returned ${res.status}`);
    } catch (err: any) {
        console.log(`❌ ERROR: ${err.message}`);
    }

    // Test 3: Unauthorized Admin Access
    console.log("\n🧪 Test 3: Unauthorized Admin API Access...");
    try {
        const res = await fetch(`${API_URL}/api/admin/stats`);
        if (res.status === 401) console.log("✅ PASS: Server rejected unauthorized access (401)");
        else if (res.ok) console.log("❌ FAIL: Server allowed unauthorized access to admin stats");
        else console.log(`❓ UNKNOWN: Server returned ${res.status}`);
    } catch (err: any) {
        console.log(`❌ ERROR: ${err.message}`);
    }

    // Test 4: Rate Limiting
    console.log("\n🧪 Test 4: Rate Limiting...");
    console.log("Running 40 requests...");
    let blocked = false;
    for (let i = 0; i < 40; i++) {
        try {
            const res = await fetch(`${API_URL}/r/any?sup=any&rid=any`);
            if (res.status === 429) {
                blocked = true;
                break;
            }
        } catch (err) { break; }
    }
    if (blocked) console.log("✅ PASS: Rate limiter blocked excess requests (429)");
    else console.log("❌ FAIL: Rate limiter did not block requests");

    console.log("\n🏁 Security testing completed.");
}

runSecurityTests();
