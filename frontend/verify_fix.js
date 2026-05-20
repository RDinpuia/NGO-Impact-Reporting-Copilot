const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console errors
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.text().includes("hydration")) {
      errors.push(msg.text());
    }
  });
  
  try {
    console.log("=== Checking for Hydration Errors ===\n");
    
    await page.goto("http://localhost:3000/dashboard", {
      waitUntil: "domcontentloaded",
    });
    
    await page.waitForTimeout(2000);
    
    if (errors.length === 0) {
      console.log("✅ No hydration errors found!");
    } else {
      console.log("❌ Hydration errors detected:");
      errors.forEach(e => console.log(`   - ${e}`));
    }
    
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await browser.close();
  }
})();
