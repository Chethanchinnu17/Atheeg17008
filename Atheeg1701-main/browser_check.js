const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];

  page.on('pageerror', (e) => errors.push('PAGEERROR:' + e.message));
  page.on('console', (msg) => {
    if (['error', 'warning'].includes(msg.type())) {
      errors.push('CONSOLE:' + msg.type() + ':' + msg.text());
    }
  });
  page.on('requestfailed', (r) => {
    errors.push('REQUESTFAILED:' + r.url() + ':' + (r.failure() ? r.failure().errorText : 'unknown'));
  });

  await page.goto('http://localhost:3000/atheeg-test.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  await page.click('button:has-text("Candidate Portal")');
  await page.waitForTimeout(300);
  await page.fill('#cand-login-email', 'test@atheeg.com');
  await page.fill('#cand-login-pass', 'test123');
  await page.click('button:has-text("Sign In as Candidate")');
  await page.waitForTimeout(500);

  console.log('ERRORS=' + JSON.stringify(errors));
  console.log('URL=' + page.url());
  await browser.close();
})();
