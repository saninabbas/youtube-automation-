import { chromium } from 'playwright';

async function testPlaywright() {
  console.log('Testing Playwright with Google Chrome...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  const title = await page.title();
  console.log('Page Title:', title);
  console.log('URL:', page.url());
  await browser.close();
  console.log('Playwright test successful!');
}

testPlaywright().catch((err) => {
  console.error('Playwright test failed:', err);
  process.exit(1);
});
