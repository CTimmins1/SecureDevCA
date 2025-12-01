// Stored XSS test for the INSECURE branch.
// In insecure mode, the XSS alert fires IMMEDIATELY on page load,
// so we grab the alert right after loading the page.

const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

async function testStoredXSSInsecure() {
  const options = new chrome.Options();
  options.addArguments("--headless=new");
  options.addArguments("--disable-gpu");
  options.addArguments("--window-size=1920,1080");

  let driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    // Load page to trigger the stored XSS
    await driver.get("http://localhost:5000/task/1");

    // Try to catch the alert IMMEDIATELY, when i tried the first couple of times, selenium picked up
    // an alert but wasent ready for it.
    try {
      await driver.wait(until.alertIsPresent(), 3000);
      const alert = await driver.switchTo().alert();
      console.log("XSS TEST (INSECURE) → ALERT TRIGGERED (expected)");
      await alert.accept();
      return; // stop here, this is a PASS
    } catch {
      // No alert found immediately (should NEVER happen in insecure mode)
      console.log("XSS TEST (INSECURE) → FAILED (alert did not fire)");
    }

  } catch (err) {
    console.error("XSS TEST (INSECURE) FAILED:", err);
  } finally {
    await driver.quit();
  }
}

testStoredXSSInsecure();
