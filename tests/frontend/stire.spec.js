// tests/frontend/stire.spec.js
// Teste pentru pagina unui articol individual: stire.html?id=N
// Articolele se incarca cu fetch() din data/stiri.json

const { test, expect } = require('@playwright/test');

// Articolul id=2: fara galerie, cu youtube
const URL_ID2 = 'http://localhost:8080/stire.html?id=2';
// Articolul id=9: cu galerie de 3 poze, cu youtube
const URL_ID9 = 'http://localhost:8080/stire.html?id=9';
// Articolul id=1: principal, cu foto
const URL_ID1 = 'http://localhost:8080/stire.html?id=1';

// Helper: asteapta pana cand articolul este redat (loading-state dispare)
async function asteaptaArticol(page) {
  await page.waitForFunction(
    () => {
      const main = document.getElementById('articol-main');
      return main && !main.querySelector('.loading-state') && main.querySelector('.articol-titlu');
    },
    { timeout: 15_000 }
  );
}

test.describe('stire.html — Articol individual', () => {

  // ── ARTICOLUL ID=2 ───────────────────────────────────────────────────────────
  test('Articolul cu id=2 se incarca si titlul este afisat', async ({ page }) => {
    await page.goto(URL_ID2);
    await asteaptaArticol(page);

    const titlu = page.locator('.articol-titlu');
    await expect(titlu).toBeVisible();

    const text = await titlu.innerText();
    // Titlul articolului 2: "Phishing avansat: site-uri false ale ANAF si Politiei Nationale"
    expect(text.toLowerCase()).toContain('phishing');
  });

  test('Articolul id=2 afiseaza categoria "alerta"', async ({ page }) => {
    await page.goto(URL_ID2);
    await asteaptaArticol(page);

    const categorie = page.locator('.articol-categorie');
    await expect(categorie).toBeVisible();
    await expect(categorie).toHaveClass(/alerta/);
  });

  test('Articolul id=2 afiseaza meta-informatii (data, vizualizari, autor)', async ({ page }) => {
    await page.goto(URL_ID2);
    await asteaptaArticol(page);

    const meta = page.locator('.articol-meta');
    await expect(meta).toBeVisible();

    const text = await meta.innerText();
    expect(text).toContain('2026');
    expect(text).toContain('vizualizări');
  });

  test('Articolul id=2 afiseaza continutul', async ({ page }) => {
    await page.goto(URL_ID2);
    await asteaptaArticol(page);

    const continut = page.locator('.articol-continut');
    await expect(continut).toBeVisible();

    const text = await continut.innerText();
    expect(text.trim().length).toBeGreaterThan(10);
  });

  test('Titlul paginii se actualizeaza cu titlul articolului', async ({ page }) => {
    await page.goto(URL_ID2);
    await asteaptaArticol(page);

    const title = await page.title();
    expect(title.toLowerCase()).toContain('phishing');
    expect(title).toContain('Anti-Fraud Alliance');
  });

  // ── BUTONUL INAPOI LA STIRI ──────────────────────────────────────────────────
  test('Butonul "Inapoi la stiri" este prezent in articol', async ({ page }) => {
    await page.goto(URL_ID2);
    await asteaptaArticol(page);

    const btnInapoi = page.locator('.btn-inapoi').first();
    await expect(btnInapoi).toBeVisible();
    await expect(btnInapoi).toContainText('Înapoi la știri');
  });

  test('Butonul "Inapoi la stiri" are border-radius >= 20px (pill button)', async ({ page }) => {
    await page.goto(URL_ID2);
    await asteaptaArticol(page);

    const borderRadius = await page.evaluate(() => {
      const btn = document.querySelector('.btn-inapoi');
      if (!btn) return 0;
      const br = getComputedStyle(btn).borderRadius;
      // Extragem valoarea numerica (ex: "22px" => 22)
      return parseFloat(br);
    });

    // CSS defineste border-radius: 22px pe .btn-inapoi
    expect(borderRadius).toBeGreaterThanOrEqual(20);
  });

  test('Butonul "Inapoi la stiri" are culoare albastra conform design system-ului', async ({ page }) => {
    await page.goto(URL_ID2);
    await asteaptaArticol(page);

    const backgroundColor = await page.evaluate(() => {
      const btn = document.querySelector('.btn-inapoi');
      return btn ? getComputedStyle(btn).backgroundColor : '';
    });

    // Design spec: butonul trebuie sa fie albastru #0071e3 = rgb(0, 113, 227)
    // Nota: daca testul esueaza, verificati ca .btn-inapoi foloseste --ap-blue (#0071e3)
    // si nu --albastru-inchis (#0f1923)
    expect(backgroundColor).toBe('rgb(0, 113, 227)');
  });

  test('Butonul "Inapoi la stiri" are href catre stiri.html', async ({ page }) => {
    await page.goto(URL_ID2);
    await asteaptaArticol(page);

    const btn = page.locator('.btn-inapoi').first();
    const href = await btn.getAttribute('href');
    expect(href).toContain('stiri.html');
  });

  test('Pagina are doua butoane "Inapoi la stiri" (sus si jos)', async ({ page }) => {
    await page.goto(URL_ID2);
    await asteaptaArticol(page);

    const butoane = page.locator('.btn-inapoi');
    const count = await butoane.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  // ── MEDIA (YouTube embed pentru id=2) ────────────────────────────────────────
  test('Articolul id=2 afiseaza iframe YouTube (are youtube in JSON)', async ({ page }) => {
    await page.goto(URL_ID2);
    await asteaptaArticol(page);

    // id=2 are youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    const mediaBloc = page.locator('.media-bloc iframe');
    await expect(mediaBloc).toBeVisible();

    const src = await mediaBloc.getAttribute('src');
    expect(src).toContain('youtube.com/embed');
  });

  // ── GALERIE FOTO (id=9 are 3 poze) ──────────────────────────────────────────
  test('Articolul id=9 afiseaza galeria foto (galerie-strip)', async ({ page }) => {
    await page.goto(URL_ID9);
    await asteaptaArticol(page);

    // id=9 are galerie: [3 URL-uri de poze]
    const galerieStrip = page.locator('.galerie-strip');
    await expect(galerieStrip).toBeVisible();
  });

  test('Galeria articolului id=9 contine cel putin 3 miniaturi', async ({ page }) => {
    await page.goto(URL_ID9);
    await asteaptaArticol(page);

    const miniaturi = page.locator('.galerie-strip .gal-mic');
    const count = await miniaturi.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('Galeria articolului id=9 afiseaza badge-ul cu numarul de poze', async ({ page }) => {
    await page.goto(URL_ID9);
    await asteaptaArticol(page);

    const badge = page.locator('.galerie-count-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('foto');
  });

  test('Click pe o miniatura din galerie deschide lightbox-ul', async ({ page }) => {
    await page.goto(URL_ID9);
    await asteaptaArticol(page);

    // Click pe prima miniatura
    await page.locator('.galerie-strip .gal-mic').first().click();

    // Lightbox-ul trebuie sa devina activ
    const lightbox = page.locator('#lb-overlay');
    await expect(lightbox).toHaveClass(/activ/);
  });

  test('Lightbox-ul se inchide la click pe butonul X', async ({ page }) => {
    await page.goto(URL_ID9);
    await asteaptaArticol(page);

    // Deschidem lightbox-ul
    await page.locator('.galerie-strip .gal-mic').first().click();
    await expect(page.locator('#lb-overlay')).toHaveClass(/activ/);

    // Inchidem cu X
    await page.locator('.lb-close').click();
    await expect(page.locator('#lb-overlay')).not.toHaveClass(/activ/);
  });

  // ── ARTICOL FARA GALERIE (id=2) ──────────────────────────────────────────────
  test('Articolul id=2 (fara galerie) NU afiseaza galerie-strip', async ({ page }) => {
    await page.goto(URL_ID2);
    await asteaptaArticol(page);

    // id=2 are galerie: [] (gol)
    const count = await page.locator('.galerie-strip').count();
    expect(count).toBe(0);
  });

  // ── SIDEBAR ──────────────────────────────────────────────────────────────────
  test('Sidebar-ul contine sectiunea "Articole recente"', async ({ page }) => {
    await page.goto(URL_ID2);
    await asteaptaArticol(page);

    const sidebar = page.locator('.articol-sidebar');
    await expect(sidebar).toBeVisible();

    const recente = page.locator('#sidebar-recente .card-mini');
    const count = await recente.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Sidebar-ul contine sectiunea "Populare"', async ({ page }) => {
    await page.goto(URL_ID2);
    await asteaptaArticol(page);

    const populare = page.locator('#sidebar-populare .card-mini');
    const count = await populare.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  // ── ARTICOL INEXISTENT ───────────────────────────────────────────────────────
  test('Articolul cu id inexistent afiseaza mesaj de eroare', async ({ page }) => {
    await page.goto('http://localhost:8080/stire.html?id=9999');

    // Asteptam ca loading-state sa fie procesat
    await page.waitForFunction(
      () => {
        const main = document.getElementById('articol-main');
        return main && !main.querySelector('.loading-state');
      },
      { timeout: 10_000 }
    );

    const main = page.locator('#articol-main');
    const text = await main.innerText();
    expect(text.toLowerCase()).toContain('negăsit');
  });

  // ── HEADER SI FOOTER ─────────────────────────────────────────────────────────
  test('Header-ul este prezent cu logo SVG', async ({ page }) => {
    await page.goto(URL_ID2);

    const logo = page.locator('header .logo img[src*="logo-afa-alb.svg"]');
    await expect(logo).toBeVisible();
  });

  test('Footer-ul este prezent cu logo SVG', async ({ page }) => {
    await page.goto(URL_ID2);

    const logo = page.locator('footer img[src*="logo-afa-alb.svg"]');
    await expect(logo).toBeVisible();
  });

  // ── NAVIGARE ─────────────────────────────────────────────────────────────────
  test('Linkul "Stiri" din navigare este marcat ca activ', async ({ page }) => {
    await page.goto(URL_ID2);

    const linkStiri = page.locator('header nav a[href="stiri.html"]');
    await expect(linkStiri).toHaveClass(/activ/);
  });

  // ── ARTICOLUL ID=1 (principal, cu foto) ─────────────────────────────────────
  test('Articolul id=1 cu foto afiseaza imaginea principala', async ({ page }) => {
    await page.goto(URL_ID1);
    await asteaptaArticol(page);

    // id=1 are foto (URL GitHub)
    const mediaBloc = page.locator('.media-bloc img');
    await expect(mediaBloc).toBeVisible();
  });

});
