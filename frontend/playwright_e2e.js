const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const base = "http://localhost:3000";
  const sampleCsv = path.resolve(
    __dirname,
    "../backend/app/seed/sample_data.csv",
  );
  const outPdf = path.resolve(__dirname, "../tools/ui_e2e_report.pdf");

  console.log("Navigating to login...");
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.waitForLoadState("domcontentloaded");

  // debug: take screenshot before login
  await page.screenshot({ path: "../tools/screenshot_before_login.png" });

  await page.fill("#login-email", "demo@impactlens.org");
  await page.fill("#login-password", "demo1234");
  await Promise.all([
    page
      .waitForNavigation({ url: "**/dashboard", timeout: 10000 })
      .catch(() => {}),
    page.click("text=Sign In"),
  ]);

  console.log("Opening upload page...");
  await page.goto(`${base}/upload`, { waitUntil: "networkidle" });
  await page.waitForLoadState("domcontentloaded");

  // upload file via hidden input with retry
  let input = await page.$("input[type=file]");
  let retries = 3;
  while (!input && retries > 0) {
    console.log(`File input not found, retrying... (${retries} attempts left)`);
    await page.waitForTimeout(500);
    input = await page.$("input[type=file]");
    retries--;
  }
  if (!input) throw new Error("File input not found after retries");

  console.log("Uploading sample CSV:", sampleCsv);
  await input.setInputFiles(sampleCsv);

  // wait for processing result card
  console.log("Waiting for processing to complete...");
  try {
    await page.waitForSelector("text=Processing Complete", { timeout: 30000 });
  } catch (e) {
    console.log(
      "Processing complete selector not found, checking for result card...",
    );
    await page.waitForSelector("text=Complete", { timeout: 10000 });
  }

  // click Generate Impact Report
  console.log("Clicking Generate Impact Report...");
  await Promise.all([
    page
      .waitForResponse(
        (r) => r.url().includes("/reports") && r.status() === 200,
        { timeout: 20000 },
      )
      .catch(() => {}),
    page.click("text=Generate Impact Report"),
  ]);

  // Wait for a reports link to appear
  console.log("Waiting for report entry...");
  await page.waitForSelector('a[href^="/reports/"]', { timeout: 30000 });

  // Open first report
  const reportLink = await page.$('a[href^="/reports/"]');
  const href = await reportLink.getAttribute("href");
  console.log("Opening report:", href);
  await page.goto(`${base}${href}`);

  // Intercept the PDF download request triggered by clicking the Download button
  const [pdfResponse] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.headers()["content-type"] &&
        r.headers()["content-type"].includes("application/pdf"),
      { timeout: 20000 },
    ),
    page.click("text=Download PDF"),
  ]);

  const buffer = await pdfResponse.body();
  fs.writeFileSync(outPdf, buffer);
  console.log("PDF saved to", outPdf);

  await browser.close();
  console.log("Playwright E2E completed successfully");
})();
