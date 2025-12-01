// Stored XSS test for the SECURE branch.
// What this test checks:
// - Log into the secure app
// - Load task page
// - Submit XSS payload in comment
// - Reload page
// - Secure version should NOT execute the payload

const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

async function testStoredXSSSecure() {
  const options = new chrome.Options();
  options.addArguments("--headless=new");
  options.addArguments("--disable-gpu");
  options.addArguments("--window-size=1920,1080");

  let driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    //
    // 1️⃣ FIRST LOGIN — secure branch requires it
    //
    await driver.get("http://localhost:5000/login");

    await driver.findElement(By.name("email")).sendKeys("conor@test.com");
    await driver.findElement(By.name("password")).sendKeys("Pass123");
    await driver.findElement(By.css("button[type='submit']")).click();

    await driver.wait(until.urlContains("/tasks"), 3000);

    //
    // 2️⃣ NOW WE CAN SAFELY ACCESS THE COMMENT FORM
    //
    await driver.get("http://localhost:5000/task/1");

    await driver.findElement(By.name("body"))
      .sendKeys(`<img src=x onerror="alert('Should not work')">`);

    await driver.findElement(By.css("button[type='submit']")).click();

    //
    // 3️⃣ Reload and check if XSS fires
    //
    await driver.get("http://localhost:5000/task/1");

    try {
      await driver.wait(until.alertIsPresent(), 3000);
      console.log("XSS TEST (SECURE) → FAILED (alert triggered!)");
      const alert = await driver.switchTo().alert();
      await alert.accept();
    } catch {
      console.log("XSS TEST (SECURE) → PASS (no alert — properly sanitized)");
    }

  } catch (err) {
    console.error("XSS TEST (SECURE) FAILED:", err);
  } finally {
    await driver.quit();
  }
}

testStoredXSSSecure();
