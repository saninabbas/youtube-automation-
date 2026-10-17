import { Builder, By } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

async function testSelenium() {
  console.log('Testing Selenium with Google Chrome...');
  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-gpu');
  options.setChromeBinaryPath('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    await driver.get('http://localhost:3000/');
    const title = await driver.getTitle();
    console.log('Selenium Page Title:', title);
    const body = await driver.findElement(By.tagName('body'));
    const isDisplayed = await body.isDisplayed();
    console.log('Selenium Body Displayed:', isDisplayed);
    console.log('Selenium test successful!');
  } finally {
    await driver.quit();
  }
}

testSelenium().catch((err) => {
  console.error('Selenium test failed:', err);
  process.exit(1);
});
