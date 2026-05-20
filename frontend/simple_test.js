const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log("=== Testing Dashboard Functionality ===\n");
    
    console.log("1. Navigating to dashboard...");
    await page.goto("http://localhost:3000/dashboard", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    console.log("   ✅ Dashboard page loaded");
    
    // Wait a bit for content to render
    await page.waitForTimeout(2000);
    
    // Get page content
    const content = await page.content();
    
    // Check for key elements
    const checks = {
      "Dashboard heading": content.includes("Dashboard"),
      "Page is authenticated": !content.includes("/login"),
      "Has content rendered": content.length > 5000,
      "Has Tailwind CSS": content.includes("/_next/static/css"),
    };
    
    console.log("\n2. Content checks:");
    let passed = 0;
    for (const [check, result] of Object.entries(checks)) {
      console.log(`   ${result ? "✅" : "❌"} ${check}`);
      if (result) passed++;
    }
    
    // Take screenshot
    const screenshotPath = path.join(__dirname, "dashboard_test.png");
    await page.screenshot({ path: screenshotPath });
    console.log(`\n3. Screenshot saved: ${screenshotPath}`);
    
    console.log(`\n=== Results: ${passed}/${Object.keys(checks).length} checks passed ===`);
    
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await browser.close();
  }
})();
