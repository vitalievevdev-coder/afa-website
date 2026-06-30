// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  // Director cu fisierele de teste
  testDir: './tests/frontend',

  // Timeout per test (30 secunde — include si fetch-ul JSON)
  timeout: 30_000,

  // Timeout de asteptare pentru expect()
  expect: {
    timeout: 10_000,
  },

  // Ruleaza testele in paralel
  fullyParallel: true,

  // Opreste la primul esec in CI
  forbidOnly: !!process.env.CI,

  // Numarul de reincercari la esec
  retries: process.env.CI ? 2 : 0,

  // Un singur worker in CI, auto local
  workers: process.env.CI ? 1 : undefined,

  // Reporter HTML generat in playwright-report/
  reporter: 'html',

  use: {
    // URL de baza — servit pe portul 8080
    baseURL: 'http://localhost:8080',

    // Salveaza screenshot/trace doar la esec
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  // Testeaza doar pe Chromium conform cerintei
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Server static local — porneste automat inainte de teste
  // Necesita: npm install -g http-server  SAU  npx http-server (inclus cu npm)
  webServer: {
    command: 'npx http-server . -p 8080 --cors -c-1 --silent',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
});
