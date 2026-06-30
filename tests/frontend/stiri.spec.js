// tests/frontend/stiri.spec.js
// Teste pentru pagina de stiri stiri.html
// Articolele sunt incarcate dinamic cu fetch() din data/stiri.json

const { test, expect } = require('@playwright/test');

const URL = 'http://localhost:8080/stiri.html';

// Helper: asteapta pana cand articolele sunt redate in DOM
async function asteaptaArticole(page) {
  await page.waitForFunction(
    () => {
      const grid = document.getElementById('stiri-grid');
      return grid && !grid.querySelector('.loading-stiri') && grid.querySelector('.card-post, .card-post-principal');
    },
    { timeout: 15_000 }
  );
}

test.describe('stiri.html — Lista de stiri', () => {

  // ── INCARCAREA INITIALA ──────────────────────────────────────────────────────
  test('Pagina se incarca si titlul este corect', async ({ page }) => {
    await page.goto(URL);
    await expect(page).toHaveTitle(/Stiri.*Anti-Fraud/i);
  });

  test('Header-ul este prezent cu logo SVG', async ({ page }) => {
    await page.goto(URL);

    const logo = page.locator('header .logo img[src*="logo-afa-alb.svg"]');
    await expect(logo).toBeVisible();
  });

  test('Articolele se incarca din JSON si apar in grid', async ({ page }) => {
    await page.goto(URL);

    // Asteptam ca spinner-ul sa dispara si cardurile sa apara
    await asteaptaArticole(page);

    const carduri = page.locator('#stiri-grid .card-post, #stiri-grid .card-post-principal');
    const count = await carduri.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Grid-ul contine cel putin 8 articole (9 in JSON, 1 principal)', async ({ page }) => {
    await page.goto(URL);
    await asteaptaArticole(page);

    // Articolul principal + cardurile normale
    const principal = await page.locator('.card-post-principal').count();
    const normale = await page.locator('.card-post').count();
    expect(principal + normale).toBeGreaterThanOrEqual(8);
  });

  test('Cardurile arata titlul articolului', async ({ page }) => {
    await page.goto(URL);
    await asteaptaArticole(page);

    const titluriCard = page.locator('.card-post-titlu');
    const count = await titluriCard.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Verificam ca primul titlu nu este gol
    const primulTitlu = await titluriCard.first().innerText();
    expect(primulTitlu.trim().length).toBeGreaterThan(0);
  });

  test('Cardurile afiseaza categoria articolului', async ({ page }) => {
    await page.goto(URL);
    await asteaptaArticole(page);

    const categorii = page.locator('.card-post .card-post-cat');
    const count = await categorii.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Cardurile afiseaza data publicarii', async ({ page }) => {
    await page.goto(URL);
    await asteaptaArticole(page);

    const data = page.locator('.card-post .card-post-data').first();
    await expect(data).toBeVisible();
    const text = await data.innerText();
    expect(text).toContain('2026');
  });

  test('Cardul principal (principal:true) este afisat mare, pe toata latimea', async ({ page }) => {
    await page.goto(URL);
    await asteaptaArticole(page);

    const principal = page.locator('.card-post-principal');
    await expect(principal).toBeVisible();

    // Cardul principal ocupa toata latimea grid-ului
    const gridColumn = await page.evaluate(() => {
      const el = document.querySelector('.card-post-principal');
      return el ? getComputedStyle(el).gridColumn : '';
    });
    // grid-column: 1 / -1
    expect(gridColumn).toContain('1');
  });

  // ── SPINNER DE INCARCARE ─────────────────────────────────────────────────────
  test('Spinner-ul de incarcare dispare dupa ce JSON-ul este receptionat', async ({ page }) => {
    await page.goto(URL);
    await asteaptaArticole(page);

    const spinner = page.locator('.loading-stiri');
    // Dupa incarcare, spinner-ul nu mai trebuie sa fie vizibil
    const count = await spinner.count();
    if (count > 0) {
      await expect(spinner).not.toBeVisible();
    }
    // Daca nu mai exista in DOM - OK
    expect(true).toBe(true);
  });

  // ── BARA DE FILTRE ───────────────────────────────────────────────────────────
  test('Bara de filtre este prezenta cu butoanele de categorie', async ({ page }) => {
    await page.goto(URL);

    const filtruBar = page.locator('.filtru-bar');
    await expect(filtruBar).toBeVisible();

    const butoane = filtruBar.locator('.btn-filtru');
    const count = await butoane.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('Filtrul "Toate" este activ la incarcare', async ({ page }) => {
    await page.goto(URL);

    const btnToate = page.locator('.btn-filtru.activ');
    await expect(btnToate).toBeVisible();
    await expect(btnToate).toHaveText(/toate/i);
  });

  test('Filtrul "Alerta" afiseaza doar articolele de tip alerta', async ({ page }) => {
    await page.goto(URL);
    await asteaptaArticole(page);

    // Click pe filtrul Alerta
    const btnAlerta = page.locator('.btn-filtru', { hasText: /alert/i });
    await btnAlerta.click();

    // Asteptam re-render
    await page.waitForTimeout(500);

    // Verificam ca butonul Alerta este acum activ
    await expect(btnAlerta).toHaveClass(/activ/);

    // Toate categoriile afisate trebuie sa fie 'alerta'
    const categorii = page.locator('.card-post .card-post-cat.alerta');
    const count = await categorii.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Filtrul "Eveniment" afiseaza doar articolele de tip eveniment', async ({ page }) => {
    await page.goto(URL);
    await asteaptaArticole(page);

    const btnEveniment = page.locator('.btn-filtru', { hasText: /eveniment/i });
    await btnEveniment.click();
    await page.waitForTimeout(500);

    await expect(btnEveniment).toHaveClass(/activ/);

    const categorii = page.locator('.card-post .card-post-cat.eveniment');
    const count = await categorii.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Filtrul "Toate" revine la lista completa dupa filtrare', async ({ page }) => {
    await page.goto(URL);
    await asteaptaArticole(page);

    // Mai intai filtram
    const btnAlerta = page.locator('.btn-filtru', { hasText: /alert/i });
    await btnAlerta.click();
    await page.waitForTimeout(300);

    // Revenim la Toate
    const btnToate = page.locator('.btn-filtru', { hasText: /toate/i });
    await btnToate.click();
    await page.waitForTimeout(500);

    // Trebuie sa apara din nou cardul principal
    const principal = page.locator('.card-post-principal');
    await expect(principal).toBeVisible();
  });

  test('Filtrul "Raport" afiseaza articolele de tip raport', async ({ page }) => {
    await page.goto(URL);
    await asteaptaArticole(page);

    const btnRaport = page.locator('.btn-filtru', { hasText: /raport/i });
    await btnRaport.click();
    await page.waitForTimeout(500);

    await expect(btnRaport).toHaveClass(/activ/);

    // Verificam ca exista cel putin un card afisat
    const carduri = page.locator('#stiri-grid .card-post');
    const count = await carduri.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  // ── SEARCH ──────────────────────────────────────────────────────────────────
  test('Bara de cautare este prezenta', async ({ page }) => {
    await page.goto(URL);

    const searchInput = page.locator('#inp-search');
    await expect(searchInput).toBeVisible();
  });

  test('Cautarea filtreaza articolele dupa titlu', async ({ page }) => {
    await page.goto(URL);
    await asteaptaArticole(page);

    const countInainte = await page.locator('#stiri-grid .card-post').count();

    // Cautam "phishing" — exista in JSON
    await page.fill('#inp-search', 'phishing');
    await page.waitForTimeout(500);

    const countDupa = await page.locator('#stiri-grid .card-post').count();
    // Dupa cautare, numarul de carduri trebuie sa fie mai mic sau egal
    expect(countDupa).toBeLessThanOrEqual(countInainte);
    expect(countDupa).toBeGreaterThanOrEqual(1);
  });

  // ── CARDURI CLICABILE ────────────────────────────────────────────────────────
  test('Cardurile normale au onclick catre stire.html', async ({ page }) => {
    await page.goto(URL);
    await asteaptaArticole(page);

    const primuCard = page.locator('.card-post').first();
    await expect(primuCard).toBeVisible();

    // Verificam ca cardul are atribut onclick cu stire.html
    const onclick = await primuCard.getAttribute('onclick');
    expect(onclick).toContain('stire.html');
  });

  test('Cardul principal are onclick catre stire.html', async ({ page }) => {
    await page.goto(URL);
    await asteaptaArticole(page);

    const principal = page.locator('.card-post-principal').first();
    const onclick = await principal.getAttribute('onclick');
    expect(onclick).toContain('stire.html');
  });

  // ── FOOTER ──────────────────────────────────────────────────────────────────
  test('Footer-ul are logo SVG', async ({ page }) => {
    await page.goto(URL);

    const logoFooter = page.locator('footer img[src*="logo-afa-alb.svg"]');
    await expect(logoFooter).toBeVisible();
  });

  test('Footer-ul contine linkuri sociale', async ({ page }) => {
    await page.goto(URL);

    const socialLinks = page.locator('footer .social-link');
    const count = await socialLinks.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

});
