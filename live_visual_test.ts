import puppeteer from 'puppeteer';

function delay(time: number) {
    return new Promise(resolve => setTimeout(resolve, time));
}

async function runFullUITest() {
    console.log("==================================================");
    console.log("🎬 Initiating Full UI Live Simulation!");
    console.log("==================================================");

    // Launch visible browser with slowMo so the user can see what's happening
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        slowMo: 30, // Slows down Puppeteer operations
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    try {
        const typeHelper = async (selector: string, text: string) => {
            await page.waitForSelector(selector, { visible: true });
            await page.type(selector, text, { delay: 50 });
        };
        const clickHelper = async (selector: string) => {
            await page.waitForSelector(selector, { visible: true });
            await page.click(selector);
        };

        // 1. Login
        console.log("➤ Navigating to Login...");
        await page.goto("http://localhost:3001/login", { waitUntil: 'networkidle2' });

        console.log("➤ Logging in as admin...");
        await typeHelper('[data-testid="input-username"]', 'admin');
        await typeHelper('[data-testid="input-password"]', 'admin123');

        await delay(1000);
        await clickHelper('[data-testid="button-login"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });

        console.log("✅ Logged in successfully.");
        await delay(1000);

        // 2. Create Project
        console.log("➤ Navigating to Create Project...");
        await page.goto("http://localhost:3001/admin/projects/new", { waitUntil: 'networkidle2' });
        await delay(1000);

        const timestamp = Date.now();
        console.log("➤ Filling out Project Form...");
        await typeHelper('[data-testid="input-project-name"]', `Live UI Test ${timestamp}`);

        // Use quick-add for client instead of combobox to be bulletproof
        await clickHelper('[data-testid="button-quick-add-client"]');
        await delay(1000);
        await typeHelper('[data-testid="input-quick-client-name"]', 'Acme UI');
        await typeHelper('[data-testid="input-quick-client-email"]', 'acme@ui.test');
        await typeHelper('[data-testid="input-quick-client-company"]', 'Acme UI Test');
        await clickHelper('[data-testid="button-quick-client-save"]');
        await delay(1000);

        await typeHelper('[data-testid="input-survey-url"]', 'https://example.com/survey?uid=');
        await typeHelper('[data-testid="input-expected-completes"]', '100');

        // Fill custom RID settings
        await clickHelper('[data-testid="input-client-rid-prefix"]');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await typeHelper('[data-testid="input-client-rid-prefix"]', 'UITEST');

        console.log("➤ Saving Project...");
        await delay(1000);
        await clickHelper('[data-testid="button-save-project"]'); await page.waitForNavigation({ waitUntil: 'networkidle2' });

        console.log("✅ Project created.");
        await delay(1000);

        // 3. Edit Project to Add Supplier
        console.log("➤ Navigating to newly created project to add Supplier...");
        // Click the first "Edit" button we find on the projects page
        await page.waitForSelector('[data-testid^="button-edit-project-"]');
        const editLinks = await page.$$('[data-testid^="button-edit-project-"]');
        if (editLinks.length > 0) {
            await editLinks[0].click();
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
        } else {
            throw new Error("Could not find project edit link.");
        }
        await delay(1000);

        console.log("➤ Scrolling down to Suppliers section...");
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await delay(1000);

        console.log("➤ Entering MackInsights Supplier details...");
        await typeHelper('[data-testid="input-supplier-name"]', 'Mack Live UI');
        await typeHelper('[data-testid="input-supplier-code"]', 'ML01');
        await typeHelper('[data-testid="input-supplier-complete-url"]', 'https://dashboard.mackinsights.com/redirect/complete?pid={{pid}}&uid={{uid}}');

        await delay(1000);
        console.log("➤ Clicking Add Supplier...");
        await clickHelper('[data-testid="button-add-supplier"]');

        await delay(2000); // Wait for supplier to be saved and link generated
        console.log("✅ Supplier added.");

        // Grab the Entry Link generated
        const codeElements = await page.$$('code');
        let entryLink = "";
        for (let code of codeElements) {
            const text = await (await code.getProperty('textContent')).jsonValue();
            if (text && text.includes('/entry?pid=')) {
                entryLink = text;
                break; // get first one
            }
        }

        if (!entryLink) {
            throw new Error("Could not find Entry Link in UI.");
        }

        console.log("✅ Found Entry Link: " + entryLink);

        // 4. Simulate Respondent
        const testUid = "LIVETEST_MACK_123";
        const finalEntryLink = entryLink.replace('{RID}', testUid);

        console.log(`\n➤ Opening new tab to simulate respondent clicking the ENTRY link...`);
        const respondentPage = await browser.newPage();
        await respondentPage.goto(finalEntryLink, { waitUntil: 'networkidle2' });

        console.log("➤ Respondent has hit the router and landed on Survey Page.");
        await delay(2000);

        const landingUrl = respondentPage.url();
        const urlObj = new URL(landingUrl);
        const oiSession = urlObj.searchParams.get("oi_session");
        console.log(`➤ Assigned Internal OI Session: ${oiSession}`);

        // 5. Simulate Complete Redirect
        console.log("\n➤ Respondent finishes survey. Simulating COMPLETE redirect...");
        await delay(2000);
        const trackCompleteUrl = `http://localhost:3001/track/complete?oi_session=${oiSession}`;
        await respondentPage.goto(trackCompleteUrl);

        console.log("➤ Router is processing tracking logic...");
        await delay(4000); // Give enough time for the MackInsights URL to load

        const finalUrl = respondentPage.url();
        console.log(`🔗 Final Redirect URL seen by Respondent: ${finalUrl}`);

        if (finalUrl.includes('mackinsights.com') && finalUrl.includes(`uid=${testUid}`)) {
            console.log("\n✅ MACRO REPLACEMENT VERIFIED SUCCESSFULLY IN URL BAR!");
        } else {
            console.log("\n❌ MACRO REPLACEMENT FAILED.");
        }

        await delay(2000);
        await respondentPage.close();

        // 6. Verify Database in Admin UI
        console.log("\n➤ Returning to Admin Panel...");
        await page.bringToFront();
        await page.evaluate(() => window.scrollTo(0, 0)); // Scroll back to top
        await delay(1000);

        console.log("➤ Navigating to Responses Table to verify recording...");
        await page.goto("http://localhost:3001/admin/responses", { waitUntil: 'networkidle2' });
        await delay(2000);

        console.log("✅ The top row should now show our 'complete' status response.");

        console.log("\nLeaving browser open for 15 seconds so you can examine the screen...");
        await delay(15000);

        await browser.close();
        console.log("\n🎬 Live Visual Test Completed Successfully.");

    } catch (error: any) {
        console.error("\n❌ Visual Test Error:", error.message);
        await browser.close();
    }
}

runFullUITest();
