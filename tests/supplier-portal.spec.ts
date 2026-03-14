import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";

test.describe("Supplier Flow End-to-End", () => {
  const supplierUsername = `supplier_${nanoid(5)}`;
  const supplierPassword = "Password123!";
  const supplierName = "Test Supplier " + nanoid(5);
  const supplierCode = "TSUP_" + nanoid(3);

  test("Phase 1: Admin Creates Supplier and Assigns Project", async ({ page }) => {
    // 1. Login as Admin
    await page.goto("/auth");
    await page.fill('input[name="username"]', "admin");
    await page.fill('input[name="password"]', "admin123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/admin/dashboard");

    // 2. Go to Suppliers Management
    await page.goto("/admin/suppliers");
    
    // 3. Create Supplier User
    await page.click('button:has-text("Portal Access")');
    await page.click('button:has-text("Add Supplier User")');
    await page.fill('input[placeholder="Unique username..."]', supplierUsername);
    await page.fill('input[placeholder="Secure password..."]', supplierPassword);
    
    // Select supplier association (assume at least one exists or create one if needed)
    // For now, assume "OpinionInsights Hub" exists or select the first one
    await page.click('button:has-text("Select association")');
    await page.click('div[role="option"]:first-child'); 
    
    await page.click('button:has-text("Create User Account")');
    await expect(page.locator("text=Account created successfully")).toBeVisible();

    // 4. Assign Project in Access Matrix
    await page.click('button:has-text("Project Access Matrix")');
    // Select the user we just created
    await page.click(`text=${supplierUsername}`);
    // Assign a project (assume OP-123 exists or select first)
    await page.click('button:has-text("Grant Project Access")');
    await page.click('div[role="option"]:first-child');
    await page.click('button:has-text("Save Access Rules")');
    await expect(page.locator("text=Rules synchronized")).toBeVisible();
  });

  test("Phase 2: Supplier Logs In and Views Dashboard", async ({ page }) => {
    // 1. Go to Supplier Login
    await page.goto("/supplier/login");
    await page.fill('input[name="username"]', supplierUsername);
    await page.fill('input[name="password"]', supplierPassword);
    await page.click('button[type="submit"]');
    
    // 2. Verify Dashboard
    await expect(page).toHaveURL("/supplier/dashboard");
    await expect(page.locator("text=Supplier Dashboard")).toBeVisible();
    await expect(page.locator("text=Assigned Projects")).toBeVisible();
  });

  test("Phase 3: Direct User Flow Redirect Verification", async ({ page }) => {
    // 1. Start a survey as a respondent (Direct flow)
    // We need a project code. Let's use OP-123 if it exists.
    const projectCode = "OP-123";
    const oiSession = `test_session_${nanoid(8)}`;
    
    // Navigate to the entry point
    await page.goto(`/entry/${projectCode}?uid=${oiSession}`);
    
    // 2. Assume it redirects to the survey or a landing page
    // For testing redirect logic, we can manually trigger a callback if we know the URL
    // Actually, let's verify the /api/callback redirect
    await page.goto(`/api/callback?oi_session=${oiSession}&status=complete`);
    
    // 3. Should redirect to the landing results page /pages/complete
    await expect(page).toHaveURL(/\/pages\/complete/);
    await expect(page.locator("text=Success")).toBeVisible();
  });
});
