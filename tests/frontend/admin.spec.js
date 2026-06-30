// tests/frontend/admin.spec.js
// Teste pentru pagina de administrare admin.html
// Admin panel cu login, formular de stiri, edit/delete

const { test, expect } = require('@playwright/test');

const URL = 'http://localhost:8080/admin.html';

// Credentiale admin valide (din codul sursa admin.html)
const ADMIN_USER = 'admin';
const ADMIN_PAROLA = 'afa2026';

// Helper: logheaza-te in admin panel
async function logheaza(page) {
  await page.goto(URL);
  await page.fill('#inp-user', ADMIN_USER);
  await page.fill('#inp-parola', ADMIN_PAROLA);
  await page.click('.btn-login');

  // Asteptam ca panoul de admin sa devina vizibil
  await page.waitForFunction(
    () => {
      const admin = document.getElementById('ecran-admin');
      return admin && admin.style.display !== 'none';
    },
    { timeout: 5_000 }
  );
}

test.describe('admin.html — Ecran de login', () => {

  test('Pagina admin se incarca si afiseaza formularul de login', async ({ page }) => {
    await page.goto(URL);

    const ecranLogin = page.locator('#ecran-login');
    await expect(ecranLogin).toBeVisible();
  });

  test('Titlul paginii contine "Admin"', async ({ page }) => {
    await page.goto(URL);
    await expect(page).toHaveTitle(/Admin.*Anti-Fraud/i);
  });

  test('Formularul de login are campul pentru utilizator', async ({ page }) => {
    await page.goto(URL);

    const inputUser = page.locator('#inp-user');
    await expect(inputUser).toBeVisible();
    await expect(inputUser).toBeEnabled();
  });

  test('Formularul de login are campul pentru parola', async ({ page }) => {
    await page.goto(URL);

    const inputParola = page.locator('#inp-parola');
    await expect(inputParola).toBeVisible();
    await expect(inputParola).toHaveAttribute('type', 'password');
  });

  test('Butonul de login "Intra in panou" este prezent si clickabil', async ({ page }) => {
    await page.goto(URL);

    const btnLogin = page.locator('.btn-login');
    await expect(btnLogin).toBeVisible();
    await expect(btnLogin).toBeEnabled();
    await expect(btnLogin).toContainText(/Intră în panou/i);
  });

  test('Logo-ul AFA din ecranul de login este afisat', async ({ page }) => {
    await page.goto(URL);

    const loginLogo = page.locator('.login-logo');
    await expect(loginLogo).toBeVisible();
    await expect(loginLogo).toHaveText('AFA');
  });

  test('Mesajul de eroare este ascuns initial', async ({ page }) => {
    await page.goto(URL);

    const eroare = page.locator('#eroare-login');
    await expect(eroare).not.toBeVisible();
  });

  test('Credentiale gresite afiseaza mesajul de eroare', async ({ page }) => {
    await page.goto(URL);

    await page.fill('#inp-user', 'user_gresit');
    await page.fill('#inp-parola', 'parola_gresita');
    await page.click('.btn-login');

    const eroare = page.locator('#eroare-login');
    await expect(eroare).toBeVisible();
    await expect(eroare).toContainText(/incorect/i);
  });

  test('Panoul admin este ascuns inainte de login', async ({ page }) => {
    await page.goto(URL);

    const ecranAdmin = page.locator('#ecran-admin');
    // display: none initial
    const display = await ecranAdmin.evaluate(el => getComputedStyle(el).display);
    expect(display).toBe('none');
  });

  test('Enter pe campul parola triggereaza login-ul', async ({ page }) => {
    await page.goto(URL);

    await page.fill('#inp-user', ADMIN_USER);
    await page.fill('#inp-parola', ADMIN_PAROLA);
    await page.press('#inp-parola', 'Enter');

    // Dupa Enter cu credentiale corecte, panoul admin trebuie sa apara
    await page.waitForFunction(
      () => document.getElementById('ecran-admin')?.style.display !== 'none',
      { timeout: 3_000 }
    );

    const ecranAdmin = page.locator('#ecran-admin');
    const display = await ecranAdmin.evaluate(el => getComputedStyle(el).display);
    expect(display).not.toBe('none');
  });

});

test.describe('admin.html — Panoul de administrare (dupa login)', () => {

  test('Dupa login, ecranul de login dispare', async ({ page }) => {
    await logheaza(page);

    const ecranLogin = page.locator('#ecran-login');
    const display = await ecranLogin.evaluate(el => getComputedStyle(el).display);
    expect(display).toBe('none');
  });

  test('Dupa login, panoul admin este vizibil', async ({ page }) => {
    await logheaza(page);

    const ecranAdmin = page.locator('#ecran-admin');
    await expect(ecranAdmin).toBeVisible();
  });

  test('Header-ul adminului contine brandul AFA', async ({ page }) => {
    await logheaza(page);

    const adminHeader = page.locator('.admin-header');
    await expect(adminHeader).toBeVisible();
    await expect(adminHeader).toContainText('AFA');
  });

  test('Header-ul admin are butonul "Delogheaza-te"', async ({ page }) => {
    await logheaza(page);

    const btnLogout = page.locator('.btn-logout');
    await expect(btnLogout).toBeVisible();
  });

  test('Header-ul admin are butonul "Vezi site-ul"', async ({ page }) => {
    await logheaza(page);

    const btnSite = page.locator('.btn-site');
    await expect(btnSite).toBeVisible();
  });

  // ── DASHBOARD ────────────────────────────────────────────────────────────────
  test('Dashboard-ul afiseaza statistici (nr. publicate)', async ({ page }) => {
    await logheaza(page);

    // Dashboard este ecranul activ implicit
    const nrPublicate = page.locator('#s-publicate');
    await expect(nrPublicate).toBeVisible();
  });

  // ── NAVIGAREA INTRE ECRANE ────────────────────────────────────────────────────
  test('Sectiunea de stiri este accesibila din navigare', async ({ page }) => {
    await logheaza(page);

    // Click pe tab-ul "Stiri"
    const navStiri = page.locator('nav a, .nav-item, button').filter({ hasText: /știri/i });
    const count = await navStiri.count();
    if (count > 0) {
      await navStiri.first().click();
      await page.waitForTimeout(500);
    }

    // Ecranul stiri trebuie sa fie activ
    const ecranStiri = page.locator('#ecran-stiri');
    await expect(ecranStiri).toBeAttached();
  });

  // ── FORMULARUL DE ADAUGARE STIRE ─────────────────────────────────────────────
  test('Formularul de adaugare stire exista in DOM', async ({ page }) => {
    await logheaza(page);

    // Formularul #ecran-form exista in DOM (chiar daca nu e vizibil)
    const ecranForm = page.locator('#ecran-form');
    await expect(ecranForm).toBeAttached();
  });

  test('Formularul are campul pentru titlul stirii', async ({ page }) => {
    await logheaza(page);

    const inputTitlu = page.locator('#s-titlu');
    await expect(inputTitlu).toBeAttached();
  });

  test('Formularul are selectul pentru categorie', async ({ page }) => {
    await logheaza(page);

    const selectCategorie = page.locator('#s-categorie');
    await expect(selectCategorie).toBeAttached();
  });

  test('Formularul are campul pentru autor', async ({ page }) => {
    await logheaza(page);

    const inputAutor = page.locator('#s-autor');
    await expect(inputAutor).toBeAttached();
    // Valoarea default este "Echipa AFA"
    const valoare = await inputAutor.inputValue();
    expect(valoare).toBe('Echipa AFA');
  });

  test('Formularul are campul pentru data si ora', async ({ page }) => {
    await logheaza(page);

    const inputData = page.locator('#s-data');
    await expect(inputData).toBeAttached();
    await expect(inputData).toHaveAttribute('type', 'datetime-local');
  });

  test('Formularul are butonul de salvare/publicare', async ({ page }) => {
    await logheaza(page);

    const btnPublica = page.locator('.btn-publica');
    await expect(btnPublica).toBeAttached();
  });

  test('Formularul are upload pentru foto', async ({ page }) => {
    await logheaza(page);

    const inputFoto = page.locator('#inp-foto');
    await expect(inputFoto).toBeAttached();
    await expect(inputFoto).toHaveAttribute('accept', 'image/*');
  });

  test('Formularul are campul pentru URL YouTube', async ({ page }) => {
    await logheaza(page);

    const inputYoutube = page.locator('#s-youtube');
    await expect(inputYoutube).toBeAttached();
  });

  test('Formularul are checkbox-ul "Principala"', async ({ page }) => {
    await logheaza(page);

    const checkPrincipal = page.locator('#s-principal');
    await expect(checkPrincipal).toBeAttached();
    await expect(checkPrincipal).toHaveAttribute('type', 'checkbox');
  });

  // ── LISTA DE STIRI CU EDIT/DELETE ────────────────────────────────────────────
  test('Lista de stiri contine butoane de Edit', async ({ page }) => {
    await logheaza(page);

    // Navigam la ecranul de stiri
    await page.evaluate(() => {
      if (typeof schimbaEcran === 'function') schimbaEcran('stiri');
    });
    await page.waitForTimeout(500);

    const btnEdit = page.locator('.btn-edit');
    const count = await btnEdit.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Lista de stiri contine butoane de Sterge', async ({ page }) => {
    await logheaza(page);

    await page.evaluate(() => {
      if (typeof schimbaEcran === 'function') schimbaEcran('stiri');
    });
    await page.waitForTimeout(500);

    const btnDel = page.locator('.btn-del');
    const count = await btnDel.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Lista de stiri contine butoane de Publica/Depublica', async ({ page }) => {
    await logheaza(page);

    await page.evaluate(() => {
      if (typeof schimbaEcran === 'function') schimbaEcran('stiri');
    });
    await page.waitForTimeout(500);

    const btnPub = page.locator('.btn-pub, .btn-depub');
    const count = await btnPub.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Click pe Edit deschide formularul de editare', async ({ page }) => {
    await logheaza(page);

    await page.evaluate(() => {
      if (typeof schimbaEcran === 'function') schimbaEcran('stiri');
    });
    await page.waitForTimeout(500);

    // Click pe primul buton Edit
    const btnEdit = page.locator('.btn-edit').first();
    await btnEdit.click();
    await page.waitForTimeout(500);

    // Ecranul de form trebuie sa fie activ
    const ecranForm = page.locator('#ecran-form');
    await expect(ecranForm).toHaveClass(/activ/);
  });

  test('Formularul de editare are titlul pre-completat', async ({ page }) => {
    await logheaza(page);

    await page.evaluate(() => {
      if (typeof schimbaEcran === 'function') schimbaEcran('stiri');
    });
    await page.waitForTimeout(500);

    await page.locator('.btn-edit').first().click();
    await page.waitForTimeout(500);

    const titlu = await page.locator('#s-titlu').inputValue();
    expect(titlu.trim().length).toBeGreaterThan(0);
  });

  // ── LOGOUT ───────────────────────────────────────────────────────────────────
  test('Butonul Logout revine la ecranul de login', async ({ page }) => {
    await logheaza(page);

    await page.locator('.btn-logout').click();

    // Dupa logout, ecranul de login trebuie sa reapara
    await page.waitForFunction(
      () => {
        const login = document.getElementById('ecran-login');
        return login && getComputedStyle(login).display !== 'none';
      },
      { timeout: 3_000 }
    );

    const ecranLogin = page.locator('#ecran-login');
    await expect(ecranLogin).toBeVisible();
  });

  // ── SETARI (ECRAN OPTIONALE) ─────────────────────────────────────────────────
  test('Ecranul de setari contine campul pentru GitHub Token', async ({ page }) => {
    await logheaza(page);

    const tokenInput = page.locator('#set-token');
    await expect(tokenInput).toBeAttached();
    await expect(tokenInput).toHaveAttribute('type', 'password');
  });

});
