import { chromium } from "playwright";
import { createHmac } from "crypto";
import axios from "axios";

async function runLifecycleTest() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log("🚀 Starting Survey Routing Lifecycle Test...");

    const BASE_URL = "http://localhost:3000";
    const API_URL = "http://localhost:3001"; // Assuming backend on 3001
    const PID = "TEST_PROJ_001";
    const SUP = "TEST_SUP_001";
    const RID = `RESP_${Date.now()}`;
    const TS = Math.floor(Date.now() / 1000).toString();
    const SECRET = "router_secret";

    // 1. Generate HMAC Link
    const message = `${PID}${SUP}${RID}${TS}`;
    const h = createHmac("sha256", SECRET).update(message).digest("hex");
    const entryUrl = `${API_URL}/r/${PID}?sup=${SUP}&rid=${RID}`;

    console.log(`🔗 Entry URL: ${entryUrl}`);

    try {
        // 2. Open Entry Link
        console.log("📥 Stage 1: Entry...");
        await page.goto(entryUrl);

        // 3. Observe Landing
        console.log("⏳ Stage 2: Landing...");
        await page.waitForURL("**/landing**");
        console.log("✅ Landed successfully");

        // 4. Observe Survey
        console.log("📋 Stage 3: Survey...");
        await page.waitForURL("**/survey**", { timeout: 10000 });
        console.log("✅ Survey started");

        // Take screenshot of mock survey
        await page.screenshot({ path: "survey_start.png" });

        // Click Submit
        await page.click("button:has-text('Submit Answer')");
        console.log("🖱️  Clicked submit");

        // 5. Observe Tracking & Redirect
        console.log("🔍 Stage 4: Tracking & Redirect...");
        await page.waitForURL("**/track/**", { timeout: 10000 });
        console.log("✅ Tracking reached");

        const finalUrl = page.url();
        console.log(`🏁 Final Destination: ${finalUrl}`);

        // 6. Verify Debugger
        const session = new URL(finalUrl).searchParams.get("oi_session");
        if (session) {
            console.log(`🛠️ Checking Debugger for session: ${session}`);
            await page.goto(`${BASE_URL}/debug/redirect-chain?oi_session=${session}`);
            await page.waitForSelector("text=Lifecycle Timeline");
            await page.screenshot({ path: "debugger_view.png" });
            console.log("✅ Debugger verified");
        }

    } catch (error) {
        console.error("❌ Test Failed:", error);
        await page.screenshot({ path: "test_failure.png" });
    } finally {
        await browser.close();
        console.log("🏁 Test completed");
    }
}

runLifecycleTest();
