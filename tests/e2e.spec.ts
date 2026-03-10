import { test, expect } from '@playwright/test';

test.describe('Opinion Insights - DOM Regression Test', () => {

    // Test 1: Admin Login Flow
    test('Admin can log in and view dashboard', async ({ page }) => {
        await page.goto('/login');

        // Fill credentials
        // Note: The inputs don't have name attributes, relying on placeholders or test IDs
        await page.getByPlaceholder('username').fill('admin');
        await page.getByPlaceholder('••••••••').fill('admin123');

        // Submit
        await page.getByRole('button', { name: /Initialize Login/i }).click();

        // Verify successful redirect to dashboard
        await expect(page).toHaveURL('/admin/dashboard');

        // Verify dashboard elements loaded
        await expect(page.locator('text=Command Center')).toBeVisible();
        await expect(page.locator('text=Total Volume')).toBeVisible();
    });

    // Test 2: Supplier Creation Flow
    test('Admin can create a new supplier', async ({ page }) => {
        await page.goto('/login');
        await page.getByPlaceholder('username').fill('admin');
        await page.getByPlaceholder('••••••••').fill('admin123');
        await page.getByRole('button', { name: /Initialize Login/i }).click();

        await page.goto('/admin/suppliers');

        // Open Dialog
        await page.getByRole('button', { name: /Register Source/i }).click();

        // Fill Form
        await page.getByPlaceholder('e.g. Dynata Global').fill('Automated Test Supplier');
        await page.getByPlaceholder('DYN01').fill('AUTO01');
        await page.getByRole('button', { name: /Synchronize Supplier/i }).click();

        // Verify supplier card exists
        await expect(page.locator('text=Automated Test Supplier')).toBeVisible();
        await expect(page.locator('text=AUTO01')).toBeVisible();
    });

    // Test 3: Project Creation Flow
    test('Admin can initialize a new project', async ({ page }) => {
        await page.goto('/login');
        await page.getByPlaceholder('username').fill('admin');
        await page.getByPlaceholder('••••••••').fill('admin123');
        await page.getByRole('button', { name: /Initialize Login/i }).click();

        await page.goto('/admin/projects/new');

        // Step 1: Core Details
        await page.getByPlaceholder('e.g. Q4 Consumer Pulse').fill('DOM E2E Test Project');
        await page.getByPlaceholder('PROJECT_X_2024').fill('DOME2E');
        await page.getByPlaceholder('Internal or Agency Name').fill('DOM Tester Ltd');
        await page.getByRole('button', { name: /Next Phase/i }).click();

        // Step 2: Country Setup
        await page.getByRole('button', { name: /Append Locale/i }).click();

        // The inputs are inside a table, we can target them generically since it's the first row
        const inputs = page.locator('table tbody tr').first().locator('input');
        await inputs.nth(0).fill('US');
        await inputs.nth(1).fill('https://example.com/survey?uid={RID}');
        await page.getByRole('button', { name: /Next Phase/i }).click();

        // Step 3: Supplier Config (Skip for now, keep default)
        await page.getByRole('button', { name: /Next Phase/i }).click();

        // Step 4: Finalize
        await page.getByRole('button', { name: /Initialize Project/i }).click();

        // Verify Redirect to Projects list
        await expect(page).toHaveURL('/admin/projects');
        await expect(page.locator('text=DOM E2E Test Project')).toBeVisible();
    });

    // Test 4: Respondent Traversal Backend Simulation
    test('Respondent tracking system functions', async ({ page, request }) => {
        // We expect the router to redirect or respond with something when hitting a live survey link.
        // Instead of doing UI traversal we simulate a respondent hitting a URL

        // 1. Visit tracking link for the project we just created 
        // Format: /track?code=DOME2E&country=US&sup=AUTO01&uid=TESTUID123
        const response = await page.goto('/track?code=DOME2E&country=US&sup=AUTO01&uid=TESTUID123');

        // This should route to the landing page or prescreener
        expect(page.url()).toContain('/landing');

        // Ensure the landing page loaded
        await expect(page.locator('text=Welcome')).toBeVisible();
    });
});
