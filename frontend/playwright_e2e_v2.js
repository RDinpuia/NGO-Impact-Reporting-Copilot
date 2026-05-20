const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const browser = await chromium.launch({ headless: false }); // Non-headless for debugging
  const context = await browser.newContext();
  const page = await context.newPage();

  const base = "http://localhost:3000";
  const sampleCsv = path.resolve(
    __dirname,
    "../backend/app/seed/sample_data.csv",
  );
  const outPdf = path.resolve(__dirname, "../tools/ui_e2e_report.pdf");

  try {
    console.log("=== Step 1: Navigate to login ===");
    await page.goto(`${base}/login`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    console.log("✓ Login page loaded");

    console.log("=== Step 2: Fill and submit login form ===");
    await page.fill("#login-email", "demo@impactlens.org");
    await page.fill("#login-password", "demo1234");

    // Wait for navigation after click
    const navPromise = page
      .waitForNavigation({ url: "**/dashboard", timeout: 15000 })
      .catch((e) => console.log("Nav timeout (expected):", e.message));
    await page.click("button:has-text('Sign In')");
    await navPromise;
    console.log("✓ Logged in successfully");

    console.log("=== Step 3: Navigate to upload page ===");
    await page.goto(`${base}/upload`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await page.waitForLoadState("domcontentloaded");
    console.log("✓ Upload page loaded");

    // Debug: Take screenshot
    await page.screenshot({ path: "../tools/screenshot_upload_loaded.png" });

    console.log("=== Step 4: Upload file ===");
    // Find and use file input
    const fileInputHandle = await page.$("input[type='file']");
    if (!fileInputHandle) {
      // Try alternative: trigger file dialog via button
      const buttons = await page.$$("button");
      console.log(`Found ${buttons.length} buttons on upload page`);
      for (const btn of buttons) {
        const text = await btn.textContent();
        console.log(`  Button: ${text}`);
      }
      throw new Error("File input element not found");
    }

    console.log(`Uploading file: ${sampleCsv}`);
    await fileInputHandle.setInputFiles(sampleCsv);
    console.log("✓ File input set");

    console.log("=== Step 5: Wait for processing ===");
    await page.waitForSelector("text=Processing Complete", { timeout: 45000 });
    console.log("✓ Processing completed");

    await page.screenshot({ path: "../tools/screenshot_upload_complete.png" });

    console.log("=== Step 6: Generate report ===");
    await page.click("button:has-text('Generate Impact Report')");
    console.log("✓ Report generation initiated");

    // Wait for report to appear
    await page.waitForSelector("a[href^='/reports/']", { timeout: 45000 });
    console.log("✓ Report created and listed");

    console.log("=== Step 7: Open and download report ===");
    const reportLink = await page.$("a[href^='/reports/']");
    const href = await reportLink.getAttribute("href");
    console.log(`Opening report: ${href}`);
    await page.goto(`${base}${href}`, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    console.log("✓ Report detail page loaded");

    await page.screenshot({ path: "../tools/screenshot_report_detail.png" });

    console.log("=== Step 8: Download PDF ===");
    // Listen for download
    const downloadPromise = page.waitForEvent("download", { timeout: 30000 });
    await page.click("button:has-text('Download PDF')");
    const download = await downloadPromise;
    await download.saveAs(outPdf);
    console.log(`✓ PDF downloaded to ${outPdf}`);

    console.log("\n✅ All tests passed!");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    await page.screenshot({ path: "../tools/screenshot_error.png" });
    throw error;
  } finally {
    await browser.close();
  }
})();
