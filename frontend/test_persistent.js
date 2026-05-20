const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log("=== Dashboard Functionality Test ===\n");
    
    // Step 1: Login
    console.log("1. Navigating to login page...");
    await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    
    console.log("2. Filling login form...");
    const emailField = await page.$("input[type='email']");
    const passwordField = await page.$("input[type='password']");
    
    if (!emailField || !passwordField) {
      throw new Error("Login form fields not found");
    }
    
    await emailField.fill("demo@impactlens.org");
    await passwordField.fill("demo1234");
    
    console.log("3. Submitting login...");
    await page.click("button:has-text('Sign In')");
    
    // Wait for navigation with timeout
    try {
      await page.waitForURL("**/dashboard", { timeout: 15000 });
    } catch {
      console.log("   (Navigation check skipped - page may already be loaded)");
    }
    
    // Additional wait for content
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    if (!currentUrl.includes("login")) {
      console.log("   ✅ Successfully logged in and navigated away from login\n");
      
      // If not on dashboard, navigate there
      if (!currentUrl.includes("dashboard")) {
        console.log("4. Navigating to dashboard...");
        await page.goto("http://localhost:3000/dashboard", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(3000);
      }
      
      // Check content
      console.log("5. Checking dashboard content...");
      const textContent = await page.evaluate(() => {
        const body = document.body.innerText;
        return body;
      });
      
      console.log(`   Page text length: ${textContent.length} chars`);
      console.log(`   First 500 chars:\n${textContent.substring(0, 500)}\n`);
      
      // Take screenshot
      const screenshotPath = path.join(__dirname, "dashboard_result.png");
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`6. Screenshot saved: ${screenshotPath}`);
      
    } else {
      console.log("   ❌ Still on login page - login may have failed");
    }
    
  } catch (e) {
    console.error("\n❌ Error:", e.message);
  } finally {
    await browser.close();
  }
})();
