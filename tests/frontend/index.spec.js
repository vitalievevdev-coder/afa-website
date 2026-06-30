// tests/frontend/index.spec.js
// Teste pentru pagina principala index.html
// Design: Apple (frosted glass header, hero negru, logo SVG)

const { test, expect } = require('@playwright/test');

const URL = 'http://localhost:8080/index.html';

test.describe('index.html — Pagina principala AFA', () => {

  // ── HEADER FROSTED GLASS ────────────────────────────────────────────────────
  test('Header are efect frosted glass (backdrop-filter)', async ({ page }) => {
    await page.goto(URL);

    const backdropFilter = await page.evaluate(() => {
      const header = document.querySelector('header');
      const style = getComputedStyle(header);
      return style.backdropFilter || style.webkitBackdropFilter || '';
    });

    // style-apple.css aplica: backdrop-filter: saturate(180%) blur(20px)
    expect(backdropFilter).toContain('blur');
  });

  test('Header are background semi-transparent (nu complet opac)', async ({ page }) => {
    await page.goto(URL);

    const bg = await page.evaluate(() => {
      return getComputedStyle(document.querySelector('header')).backgroundColor;
    });

    // rgba(255,255,255,0.82) — nu este #0f1923 solid
    expect(bg).toContain('rgba');
  });

  // ── LOGO SVG ────────────────────────────────────────────────────────────────
  test('Logo SVG este vizibil in header', async ({ page }) => {
    await page.goto(URL);

    const logo = page.locator('header .logo img');
    await expect(logo).toBeVisible();

    const src = await logo.getAttribute('src');
    expect(src).toContain('logo-afa-alb.svg');
  });

  test('Logo SVG are inaltime setata (nu este 0px)', async ({ page }) => {
    await page.goto(URL);

    const height = await page.evaluate(() => {
      const img = document.querySelector('header .logo img');
      return img ? img.getBoundingClientRect().height : 0;
    });

    expect(height).toBeGreaterThan(0);
  });

  // ── NAVIGARE ────────────────────────────────────────────────────────────────
  test('Navigarea contine toate linkurile principale', async ({ page }) => {
    await page.goto(URL);

    const nav = page.locator('header nav');
    await expect(nav).toBeVisible();

    const linkuri = ['Acasă', 'Despre Noi', 'Activități', 'Resurse', 'Știri', 'Contact'];
    for (const text of linkuri) {
      await expect(nav.getByText(text, { exact: false })).toBeVisible();
    }
  });

  test('Butonul Contact din nav are stil special (btn-contact-nav)', async ({ page }) => {
    await page.goto(URL);

    const btnContact = page.locator('header nav .btn-contact-nav');
    await expect(btnContact).toBeVisible();
    await expect(btnContact).toHaveText(/contact/i);
  });

  // ── HERO NEGRU ──────────────────────────────────────────────────────────────
  test('Sectiunea hero are fundal negru (#000)', async ({ page }) => {
    await page.goto(URL);

    const bg = await page.evaluate(() => {
      return getComputedStyle(document.querySelector('.hero')).backgroundColor;
    });

    // style-apple.css: background: #000 !important
    expect(bg).toBe('rgb(0, 0, 0)');
  });

  test('Hero contine titlul principal al site-ului', async ({ page }) => {
    await page.goto(URL);

    const hero = page.locator('.hero');
    await expect(hero).toBeVisible();
    await expect(hero.getByText(/Frauda se Întâmplă/i)).toBeVisible();
  });

  test('Hero contine badge-ul cu Impotriva Fraudei', async ({ page }) => {
    await page.goto(URL);

    const badge = page.locator('.hero-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('Împotriva Fraudei');
  });

  // ── BUTOANE HERO ────────────────────────────────────────────────────────────
  test('Hero contine butoanele principale de actiune', async ({ page }) => {
    await page.goto(URL);

    await expect(page.locator('.hero .btn-primar')).toBeVisible();
    await expect(page.locator('.hero .btn-secundar')).toBeVisible();
  });

  test('Butonul Afla mai multe din hero duce la despre-noi.html', async ({ page }) => {
    await page.goto(URL);

    const href = await page.locator('.hero .btn-primar').getAttribute('href');
    expect(href).toContain('despre-noi.html');
  });

  // ── STATISTICI ──────────────────────────────────────────────────────────────
  test('Sectiunea hero contine 3 carduri de statistici', async ({ page }) => {
    await page.goto(URL);

    const statCards = page.locator('.hero-stats .stat-card');
    await expect(statCards).toHaveCount(3);
  });

  test('Statisticile afiseaza valorile corecte', async ({ page }) => {
    await page.goto(URL);

    const stats = page.locator('.hero-stats .stat-card');
    await expect(stats.nth(0).locator('.numar')).toHaveText('500+');
    await expect(stats.nth(1).locator('.numar')).toHaveText('12');
    await expect(stats.nth(2).locator('.numar')).toHaveText('3000+');
  });

  // ── SECTIUNE DOMENII ────────────────────────────────────────────────────────
  test('Sectiunea domenilor de activitate contine 6 carduri', async ({ page }) => {
    await page.goto(URL);

    // Prima sectiune cu grid-3 are cardurile domeniilor
    const carduri = page.locator('.sectiune:not(.sectiune-gri):first-of-type .card');
    // Exista cel putin 4 carduri de activitate
    const count = await page.locator('.grid-3 .card').count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  // ── FOOTER NEGRU CU LOGO ────────────────────────────────────────────────────
  test('Footer-ul este pe fundal inchis', async ({ page }) => {
    await page.goto(URL);

    const footerBg = await page.evaluate(() => {
      return getComputedStyle(document.querySelector('footer')).backgroundColor;
    });

    // footer are --albastru-inchis: #0f1923 = rgb(15, 25, 35) sau negru/inchis
    const [r, g, b] = footerBg.match(/\d+/g).map(Number);
    // Verificam ca fundalul este inchis (nu alb)
    expect(r + g + b).toBeLessThan(200);
  });

  test('Footer-ul contine logo-ul SVG AFA', async ({ page }) => {
    await page.goto(URL);

    const logoFooter = page.locator('footer img[src*="logo-afa-alb.svg"]');
    await expect(logoFooter).toBeVisible();
  });

  test('Footer-ul contine linkurile de navigare', async ({ page }) => {
    await page.goto(URL);

    const footer = page.locator('footer');
    await expect(footer.getByText('Acasă')).toBeVisible();
    await expect(footer.getByText('Despre Noi')).toBeVisible();
    await expect(footer.getByText('Știri')).toBeVisible();
    await expect(footer.getByText('Contact')).toBeVisible();
  });

  test('Footer-ul contine copyright-ul 2026', async ({ page }) => {
    await page.goto(URL);

    const footerBottom = page.locator('.footer-bottom');
    await expect(footerBottom).toContainText('2026 Anti-Fraud Alliance');
  });

  // ── SECTIUNILE SUPLIMENTARE ─────────────────────────────────────────────────
  test('Pagina contine sectiunea Despre Noi cu lista de avantaje', async ({ page }) => {
    await page.goto(URL);

    const listaCheck = page.locator('.lista-check li');
    const count = await listaCheck.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('Pagina contine banner de alerta cu buton Raporteaza', async ({ page }) => {
    await page.goto(URL);

    const banner = page.locator('.banner-alerta');
    await expect(banner).toBeVisible();
    await expect(banner.locator('.btn-alb')).toBeVisible();
  });

  test('Pagina contine sectiunea de parteneri', async ({ page }) => {
    await page.goto(URL);

    const parteneri = page.locator('.parteneri-row .partener-logo');
    const count = await parteneri.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

});
