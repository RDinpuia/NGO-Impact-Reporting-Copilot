const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log("=== Step 1: Navigate to Dashboard ===");
    await page.goto("http://localhost:3000/dashboard", {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    
    // Check for login redirect
    const url = page.url();
    console.log(`Current URL: ${url}`);
    
    if (url.includes("/login")) {
      console.log("✅ Dashboard redirects to login (as expected for unauth) - PASS");
      
      // Try logging in
      console.log("\n=== Step 2: Login ===");
      await page.fill("input[id*='email'], input[placeholder*='email']", "demo@impactlens.org");
      await page.fill("input[id*='password'], input[placeholder*='password']", "demo1234");
      await page.click("button:has-text('Sign In')");
      
      // Wait for navigation
      await page.waitForNavigation({ timeout: 15000 }).catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      
      const newUrl = page.url();
      console.log(`After login URL: ${newUrl}`);
      
      if (newUrl.includes("/dashboard")) {
        console.log("✅ Logged in and navigated to dashboard - PASS");
        
        // Check for dashboard content
        const title = await page.locator("h1").first().textContent();
        const kpis = await page.locator("[class*='card']").count();
        
        console.log(`\nDashboard Title: ${title}`);
        console.log(`KPI Cards found: ${kpis}`);
        
        if (title && title.includes("Dashboard")) {
          console.log("✅ Dashboard title renders - PASS");
        }
        if (kpis > 0) {
          console.log("✅ KPI cards render - PASS");
        }
      }
    } else if (url.includes("/dashboard")) {
      console.log("✅ Dashboard loads directly - PASS");
      const title = await page.locator("h1").first().textContent();
      console.log(`Dashboard Title: ${title}`);
    }
    
  } catch (e) {
    console.error("❌ Test Error:", e.message);
  } finally {
    await browser.close();
  }
})();
