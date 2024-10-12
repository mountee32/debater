const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true, // Ensure headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Bypass missing libraries
    });
    const page = await browser.newPage();
    const reportPath = path.resolve(__dirname, 'test-report.html');
    
    // Open the test report
    await page.goto(`file://${reportPath}`);
    
    // Capture a screenshot
    await page.screenshot({ path: 'test-report-screenshot.png', fullPage: true });
    
    await browser.close();
    console.log('Screenshot captured: test-report-screenshot.png');
  } catch (error) {
    console.error('Error capturing screenshot:', error);
  }
})();
