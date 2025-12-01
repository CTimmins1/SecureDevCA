// Login test for the SECURE branch.
// This test makes sure:
// - Page loads
// - Credentials are submitted
// - Redirect happens to /tasks
// - The secure banner appears

const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

async function testLoginSecure() {
  const options = new chrome.Options();
  options.addArguments("--headless=new");
  options.addArguments("--disable-gpu");
  options.addArguments("--window-size=1920,1080");

  let driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    // Load secure login
    await driver.get("http://localhost:5000/login");

    // Fill fields
    await driver.findElement(By.name("email")).sendKeys("conor@test.com");
    await driver.findElement(By.name("password")).sendKeys("Pass123");

    // Submit
    await driver.findElement(By.css("button[type='submit']")).click();

    // Wait for redirect
    await driver.wait(until.urlContains("/tasks"), 3000);

    // Check banner
    const banner = await driver
      .findElement(By.xpath("//p[contains(., 'Secure')]"))
      .getText();

    if (banner) {
      console.log("LOGIN TEST (SECURE) → PASS");
    } else {
      console.log("LOGIN TEST (SECURE) → FAILED (banner missing)");
    }

  } catch (err) {
    console.error("LOGIN TEST (SECURE) FAILED:", err);
  } finally {
    await driver.quit();
  }
}

testLoginSecure();
