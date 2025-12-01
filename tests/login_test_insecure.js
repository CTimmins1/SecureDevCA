// Automated login test for the INSECURE branch.
// What this does:
// - Loads the insecure login page
// - Uses weak creds (or the seeded ones)
// - Confirms the insecure branch just lets us in

const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

async function testLoginInsecure() {
  // Headless Chrome setup (new Selenium)
  const options = new chrome.Options();
  options.addArguments("--headless=new");
  options.addArguments("--disable-gpu");
  options.addArguments("--window-size=1920,1080");

  let driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    // Go to insecure login page on port 5000
    await driver.get("http://localhost:5000/login");

    // Fill email
    await driver.findElement(By.name("email")).sendKeys("conor@test.com");

    // Fill password
    await driver.findElement(By.name("password")).sendKeys("Pass123");

    // Submit form
    await driver.findElement(By.css("button[type='submit']")).click();

    // Wait for redirect
    await driver.wait(until.urlContains("/tasks"), 3000);

    console.log("LOGIN TEST (INSECURE) → PASS");

  } catch (err) {
    console.error("LOGIN TEST (INSECURE) FAILED:", err);
  } finally {
    await driver.quit();
  }
}

testLoginInsecure();
