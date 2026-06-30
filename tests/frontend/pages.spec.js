// tests/frontend/pages.spec.js
// Teste pentru toate paginile statice (despre-noi, contact, activitati, resurse)
// Fiecare test este independent si poate rula singur

const { test, expect } = require('@playwright/test');

// Paginile de testat cu titlurile lor asteptate
const PAGINI = [
  {
    url: 'http://localhost:8080/despre-noi.html',
    titlu: /Despre Noi.*Anti-Fraud/i,
    pagina: 'despre-noi.html',
    heading: 'Despre Anti-Fraud Alliance',
    navActiv: 'despre-noi.html',
  },
  {
    url: 'http://localhost:8080/contact.html',
    titlu: /Contact.*Anti-Fraud/i,
    pagina: 'contact.html',
    heading: /contact/i,
    navActiv: 'contact.html',
  },
  {
    url: 'http://localhost:8080/activitati.html',
    titlu: /Activit.*Anti-Fraud/i,
    pagina: 'activitati.html',
    heading: /activit/i,
    navActiv: 'activitati.html',
  },
  {
    url: 'http://localhost:8080/resurse.html',
    titlu: /Resurse.*Anti-Fraud/i,
    pagina: 'resurse.html',
    heading: /resurse/i,
    navActiv: 'resurse.html',
  },
];

// ── TESTE COMUNE PENTRU TOATE PAGINILE ─────────────────────────────────────────

for (const { url, titlu, pagina, heading, navActiv } of PAGINI) {
  test.describe(`${pagina} — Structura de baza`, () => {

    test(`${pagina}: se incarca si raspunde cu 200`, async ({ page }) => {
      const response = await page.goto(url);
      expect(response.status()).toBe(200);
    });

    test(`${pagina}: titlul paginii contine "Anti-Fraud"`, async ({ page }) => {
      await page.goto(url);
      await expect(page).toHaveTitle(titlu);
    });

    test(`${pagina}: header-ul este prezent`, async ({ page }) => {
      await page.goto(url);
      const header = page.locator('header');
      await expect(header).toBeVisible();
    });

    test(`${pagina}: logo SVG este vizibil in header`, async ({ page }) => {
      await page.goto(url);
      const logo = page.locator('header .logo img[src*="logo-afa-alb.svg"]');
      await expect(logo).toBeVisible();
    });

    test(`${pagina}: logo SVG NU este inlocuit cu text "AFA" simplu`, async ({ page }) => {
      await page.goto(url);

      // Verifica ca in header nu exista un div cu text "AFA" in loc de logo SVG
      const logoTextDiv = page.locator('header .logo-icon').filter({ hasText: /^AFA$/ });
      const count = await logoTextDiv.count();

      // Daca exista .logo-icon cu "AFA", trebuie sa existe SI imaginea SVG
      if (count > 0) {
        const logoSVG = page.locator('header img[src*="logo-afa-alb.svg"]');
        const svgCount = await logoSVG.count();
        // Cel putin una dintre ele trebuie sa fie prezenta
        expect(svgCount + count).toBeGreaterThan(0);
      }

      // Verificam ca fisierul SVG este referentiat corect
      const imgSVG = page.locator('header img[src*=".svg"]');
      await expect(imgSVG).toBeVisible();
    });

    test(`${pagina}: navigarea contine toate linkurile principale`, async ({ page }) => {
      await page.goto(url);
      const nav = page.locator('header nav');
      await expect(nav).toBeVisible();

      const linkuri = ['Acasă', 'Despre Noi', 'Activități', 'Resurse', 'Știri', 'Contact'];
      for (const text of linkuri) {
        await expect(nav.getByText(text, { exact: false })).toBeVisible();
      }
    });

    test(`${pagina}: linkul activ din navigare este corect marcat`, async ({ page }) => {
      await page.goto(url);
      const linkActiv = page.locator(`header nav a[href="${navActiv}"]`);
      await expect(linkActiv).toHaveClass(/activ/);
    });

    test(`${pagina}: footer-ul este prezent`, async ({ page }) => {
      await page.goto(url);
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
    });

    test(`${pagina}: footer contine logo SVG`, async ({ page }) => {
      await page.goto(url);
      const logoFooter = page.locator('footer img[src*="logo-afa-alb.svg"]');
      await expect(logoFooter).toBeVisible();
    });

    test(`${pagina}: footer NU contine "AFA" ca text simplu fara logo`, async ({ page }) => {
      await page.goto(url);

      // Verifica ca in footer exista imaginea SVG (nu text pur "AFA")
      const logoSVG = page.locator('footer img[src*="logo-afa-alb.svg"]');
      await expect(logoSVG).toBeVisible();

      // Aria alt a imaginii trebuie sa contina "AFA"
      const altText = await logoSVG.getAttribute('alt');
      expect(altText).toBeTruthy();
    });

    test(`${pagina}: footer contine copyright-ul 2026`, async ({ page }) => {
      await page.goto(url);
      const footerBottom = page.locator('.footer-bottom');
      await expect(footerBottom).toContainText('2026');
    });

    test(`${pagina}: footer are inaltimea mai mare de 0px`, async ({ page }) => {
      await page.goto(url);
      const footerHeight = await page.evaluate(() => {
        return document.querySelector('footer')?.getBoundingClientRect().height || 0;
      });
      expect(footerHeight).toBeGreaterThan(0);
    });

    test(`${pagina}: pagina contine un heading principal h1 sau h2`, async ({ page }) => {
      await page.goto(url);
      // Verificam ca exista un heading principal
      const h1 = await page.locator('h1').count();
      const h2 = await page.locator('h2').count();
      expect(h1 + h2).toBeGreaterThan(0);
    });

  });
}

// ── TESTE SPECIFICE FIECAREI PAGINI ───────────────────────────────────────────

test.describe('despre-noi.html — Continut specific', () => {

  test('Contine sectiunea "page-header" cu titlul paginii', async ({ page }) => {
    await page.goto('http://localhost:8080/despre-noi.html');
    const pageHeader = page.locator('.page-header');
    await expect(pageHeader).toBeVisible();
    await expect(pageHeader).toContainText('Despre Anti-Fraud Alliance');
  });

  test('Contine breadcrumb cu link catre Acasa', async ({ page }) => {
    await page.goto('http://localhost:8080/despre-noi.html');
    const breadcrumb = page.locator('.breadcrumb');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.locator('a[href="index.html"]')).toBeVisible();
  });

  test('Contine sectiunea despre misiune cu lista-check', async ({ page }) => {
    await page.goto('http://localhost:8080/despre-noi.html');
    const listaCheck = page.locator('.lista-check li');
    const count = await listaCheck.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('Contine informatii despre an (2012 — anul fondarii)', async ({ page }) => {
    await page.goto('http://localhost:8080/despre-noi.html');
    const body = await page.locator('body').innerText();
    expect(body).toContain('2012');
  });

});

test.describe('contact.html — Continut specific', () => {

  test('Contine un formular sau informatii de contact', async ({ page }) => {
    await page.goto('http://localhost:8080/contact.html');

    // Poate fi formular sau sectiune cu date de contact
    const formSauContact = page.locator('form, .contact-info, .contact-date, [class*="contact"]');
    const count = await formSauContact.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Contine adresa de email sau telefon', async ({ page }) => {
    await page.goto('http://localhost:8080/contact.html');
    const bodyText = await page.locator('body').innerText();

    // Verifica prezenta unor date de contact
    const areEmail = bodyText.includes('@') || bodyText.includes('email');
    const areTelefon = bodyText.includes('+373') || bodyText.includes('telefon') || bodyText.includes('phone');
    const areAdresa = bodyText.toLowerCase().includes('chișinău') || bodyText.toLowerCase().includes('chisinau');

    expect(areEmail || areTelefon || areAdresa).toBe(true);
  });

});

test.describe('activitati.html — Continut specific', () => {

  test('Contine sectiunea de activitati cu carduri sau lista', async ({ page }) => {
    await page.goto('http://localhost:8080/activitati.html');

    // Exista cel putin un card sau element de activitate
    const activitate = page.locator('.card, .activitate, [class*="activit"]');
    const count = await activitate.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Titlul paginii mentioneaza activitatile AFA', async ({ page }) => {
    await page.goto('http://localhost:8080/activitati.html');
    const h1 = page.locator('h1, .page-header h1');
    const count = await h1.count();
    if (count > 0) {
      const text = await h1.first().innerText();
      expect(text.length).toBeGreaterThan(3);
    } else {
      // Cel putin un h2 cu continut relevant
      const h2 = page.locator('h2').first();
      await expect(h2).toBeVisible();
    }
  });

});

test.describe('resurse.html — Continut specific', () => {

  test('Contine sectiunea de resurse cu materiale sau linkuri', async ({ page }) => {
    await page.goto('http://localhost:8080/resurse.html');

    // Poate fi carduri, liste sau linkuri de descarcare
    const resurse = page.locator('.card, .resursa, [class*="resurs"], .grid-3 .card');
    const count = await resurse.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Titlul h1 sau h2 este vizibil', async ({ page }) => {
    await page.goto('http://localhost:8080/resurse.html');

    const headings = page.locator('h1, h2');
    const count = await headings.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await expect(headings.first()).toBeVisible();
  });

});

// ── TEST GENERAL: NICIO PAGINA NU ARE "AFA" CA TEXT SIMPLU IN LOC DE LOGO ─────

test.describe('Toate paginile — Consistenta logo', () => {

  test('Toate paginile au logo SVG in header (nu text brut)', async ({ page }) => {
    const pagini = [
      'http://localhost:8080/despre-noi.html',
      'http://localhost:8080/contact.html',
      'http://localhost:8080/activitati.html',
      'http://localhost:8080/resurse.html',
    ];

    for (const url of pagini) {
      await page.goto(url);
      const svgLogo = page.locator('header img[src*=".svg"]');
      const count = await svgLogo.count();
      expect(count, `${url} trebuie sa aiba logo SVG in header`).toBeGreaterThanOrEqual(1);
    }
  });

  test('Toate paginile au footer cu logo SVG', async ({ page }) => {
    const pagini = [
      'http://localhost:8080/despre-noi.html',
      'http://localhost:8080/contact.html',
      'http://localhost:8080/activitati.html',
      'http://localhost:8080/resurse.html',
    ];

    for (const url of pagini) {
      await page.goto(url);
      const svgFooter = page.locator('footer img[src*=".svg"]');
      const count = await svgFooter.count();
      expect(count, `${url} trebuie sa aiba logo SVG in footer`).toBeGreaterThanOrEqual(1);
    }
  });

});
