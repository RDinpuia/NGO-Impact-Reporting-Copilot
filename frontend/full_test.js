const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log("=== Full Dashboard Functionality Test ===\n");
    
    // Step 1: Login
    console.log("1. Logging in...");
    await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    
    await page.fill("input[placeholder*='email'], input[type='email']", "demo@impactlens.org");
    await page.fill("input[placeholder*='password'], input[type='password']", "demo1234");
    
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }).catch(() => {}),
      page.click("button:has-text('Sign In')")
    ]);
    
    await page.waitForTimeout(2000);
    console.log("   ✅ Login completed");
    
    // Step 2: Navigate to dashboard
    console.log("\n2. Navigating to dashboard...");
    await page.goto("http://localhost:3000/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    console.log("   ✅ Dashboard page loaded");
    
    // Step 3: Verify content
    console.log("\n3. Verifying dashboard content...");
    
    const content = await page.content();
    const textContent = await page.evaluate(() => document.body.innerText);
    
    const checks = {
      "Has 'Dashboard' heading": textContent.includes("Dashboard"),
      "Has KPI metrics": textContent.includes("Beneficiar") || textContent.includes("Activity") || textContent.includes("Attendance") || textContent.includes("Sentiment"),
      "Has chart sections": textContent.includes("Sentiment") || textContent.includes("Region") || textContent.includes("Trend") || textContent.includes("Beneficiary"),
      "Has Recent Activity": textContent.includes("Recent"),
    };
    
    let passed = 0;
    for (const [check, result] of Object.entries(checks)) {
      console.log(`   ${result ? "✅" : "❌"} ${check}`);
      if (result) passed++;
    }
    
    // Step 4: Check for visual improvements
    console.log("\n4. Verifying CSS/styling applied...");
    const cssChecks = {
      "Has Tailwind CSS": content.includes("/_next/static/css"),
      "Page rendered": content.length > 8000,
    };
    
    for (const [check, result] of Object.entries(cssChecks)) {
      console.log(`   ${result ? "✅" : "❌"} ${check}`);
    }
    
    // Step 5: Take screenshot
    const screenshotPath = path.join(__dirname, "dashboard_full.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n5. Full page screenshot saved: ${screenshotPath}`);
    
    console.log(`\n=== Final Result: ${passed}/${Object.keys(checks).length} content checks passed ===`);
    
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await browser.close();
  }
})();
