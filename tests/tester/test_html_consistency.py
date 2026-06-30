"""
Teste de consistenta HTML pentru site-ul static AFA (Anti-Fraud Alliance).

Parsare directa a fisierelor HTML fara browser, folosind `re` si operatii
pe siruri de caractere (fallback, fara dependente grele).

Daca doresti sa folosesti BeautifulSoup4 in loc de re:
    pip3 install beautifulsoup4
Momentan testele ruleaza cu re/string operations — nu e nevoie de pip.

Rulare:
    python3 tests/tester/test_html_consistency.py
"""

import os
import re
import unittest

# ---------------------------------------------------------------------------
# Cale radacina proiect (2 niveluri deasupra acestui fisier: tests/tester/)
# ---------------------------------------------------------------------------
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def _path(*parts):
    """Construieste o cale absoluta relativa la radacina proiectului."""
    return os.path.join(ROOT, *parts)


def _read(rel_path):
    """Citeste un fisier HTML si returneaza continutul ca string."""
    full = _path(rel_path)
    with open(full, "r", encoding="utf-8") as fh:
        return fh.read()


# Toate paginile HTML din proiect
ALL_PAGES = [
    "index.html",
    "stiri.html",
    "stire.html",
    "despre-noi.html",
    "contact.html",
    "activitati.html",
    "resurse.html",
    "admin.html",
]

# Paginile publice (fara admin):
#   - au header/footer comun cu logo si navigare
#   - includ css/style-apple.css
# admin.html este un panou intern cu propriul CSS (Quill) si fara footer public
PUBLIC_PAGES = [
    "index.html",
    "stiri.html",
    "stire.html",
    "despre-noi.html",
    "contact.html",
    "activitati.html",
    "resurse.html",
]


class TestHtmlConsistency(unittest.TestCase):

    # ------------------------------------------------------------------
    # 1. Paginile publice includ style-apple.css
    # ------------------------------------------------------------------
    def test_apple_css_on_all_pages(self):
        """
        Fiecare pagina publica trebuie sa includa css/style-apple.css.
        admin.html este exclus — este un panou intern cu CSS propriu (Quill).
        """
        pattern = re.compile(
            r'<link[^>]+rel=["\']stylesheet["\'][^>]+href=["\']css/style-apple\.css["\']',
            re.IGNORECASE,
        )
        # Acceptam si ordinea inversa a atributelor (href inainte de rel)
        pattern_alt = re.compile(
            r'<link[^>]+href=["\']css/style-apple\.css["\'][^>]+rel=["\']stylesheet["\']',
            re.IGNORECASE,
        )
        for page in PUBLIC_PAGES:
            with self.subTest(page=page):
                content = _read(page)
                found = pattern.search(content) or pattern_alt.search(content)
                # Acceptam si forma simpla (fara toate atributele)
                if not found:
                    found = re.search(
                        r'href=["\']css/style-apple\.css["\']', content, re.IGNORECASE
                    )
                self.assertTrue(
                    found,
                    f"{page}: lipseste <link rel='stylesheet' href='css/style-apple.css'>",
                )

    # ------------------------------------------------------------------
    # 2. Logo SVG alb in footer pe paginile publice
    # ------------------------------------------------------------------
    def test_logo_svg_in_footer_all_pages(self):
        """
        Footer-ul fiecarei pagini publice trebuie sa contina logo-afa-alb.svg.
        admin.html este exclus — nu are footer public.
        """
        pattern = re.compile(
            r'<img[^>]+src=["\']images/logo-afa-alb\.svg["\']', re.IGNORECASE
        )
        for page in PUBLIC_PAGES:
            with self.subTest(page=page):
                content = _read(page)
                self.assertTrue(
                    pattern.search(content),
                    f"{page}: lipseste <img src='images/logo-afa-alb.svg'> in footer",
                )

    # ------------------------------------------------------------------
    # 3. Nicio pagina nu contine blocul hotline (0800 / Linie Antifraudă)
    # ------------------------------------------------------------------
    def test_no_hotline_block_any_page(self):
        """Nicio pagina nu trebuie sa contina '0800' sau 'Linie Antifraud'."""
        for page in ALL_PAGES:
            with self.subTest(page=page):
                content = _read(page)
                self.assertNotIn(
                    "0800",
                    content,
                    f"{page}: contine '0800' (bloc hotline nesuprimat)",
                )
                # Verificam si variante cu diacritice / fara
                self.assertFalse(
                    re.search(r"Linie\s+Antifraud", content, re.IGNORECASE),
                    f"{page}: contine 'Linie Antifraudă' (bloc hotline nesuprimat)",
                )

    # ------------------------------------------------------------------
    # 4. Linkurile de navigare sunt consistente pe toate paginile publice
    # ------------------------------------------------------------------
    def test_nav_links_consistent(self):
        """Paginile publice trebuie sa contina cele 6 linkuri de navigare."""
        required_links = [
            "index.html",
            "despre-noi.html",
            "activitati.html",
            "resurse.html",
            "stiri.html",
            "contact.html",
        ]
        # admin.html este exclus — nu are meniu de navigare public
        for page in PUBLIC_PAGES:
            with self.subTest(page=page):
                content = _read(page)
                for link in required_links:
                    self.assertIn(
                        f'href="{link}"',
                        content,
                        f"{page}: lipseste linkul de navigare href='{link}'",
                    )

    # ------------------------------------------------------------------
    # 5. Meta charset UTF-8 pe toate paginile
    # ------------------------------------------------------------------
    def test_meta_charset_utf8(self):
        """Fiecare pagina trebuie sa declare <meta charset='UTF-8'>."""
        pattern = re.compile(r'<meta\s+charset=["\']UTF-8["\']', re.IGNORECASE)
        for page in ALL_PAGES:
            with self.subTest(page=page):
                content = _read(page)
                self.assertTrue(
                    pattern.search(content),
                    f"{page}: lipseste <meta charset='UTF-8'>",
                )

    # ------------------------------------------------------------------
    # 6. Tag <title> completat (nu gol) pe toate paginile
    # ------------------------------------------------------------------
    def test_page_titles_not_empty(self):
        """Fiecare pagina trebuie sa aiba un <title> nevid."""
        pattern = re.compile(r"<title>\s*(.+?)\s*</title>", re.IGNORECASE | re.DOTALL)
        for page in ALL_PAGES:
            with self.subTest(page=page):
                content = _read(page)
                match = pattern.search(content)
                self.assertIsNotNone(match, f"{page}: lipseste tag-ul <title>")
                title_text = match.group(1).strip()
                self.assertTrue(
                    len(title_text) > 0,
                    f"{page}: <title> este gol",
                )

    # ------------------------------------------------------------------
    # 7. stire.html contine clasa btn-inapoi cu href="stiri.html"
    # ------------------------------------------------------------------
    def test_btn_inapoi_exists_in_stire(self):
        """stire.html trebuie sa contina clasa btn-inapoi cu href='stiri.html'."""
        content = _read("stire.html")
        # Verificam ca exista un element cu clasa btn-inapoi
        self.assertIn(
            "btn-inapoi",
            content,
            "stire.html: lipseste clasa 'btn-inapoi'",
        )
        # Verificam ca href-ul asociat trimite spre stiri.html
        pattern = re.compile(
            r'class=["\'][^"\']*btn-inapoi[^"\']*["\'][^>]*href=["\']stiri\.html["\']'
            r'|href=["\']stiri\.html["\'][^>]*class=["\'][^"\']*btn-inapoi',
            re.IGNORECASE,
        )
        # Cautam elementul: <a class="btn-inapoi" href="stiri.html">
        simple = re.search(
            r'<a\s[^>]*class=["\'][^"\']*btn-inapoi[^"\']*["\'][^>]*href=["\']stiri\.html["\']'
            r'|<a\s[^>]*href=["\']stiri\.html["\'][^>]*class=["\'][^"\']*btn-inapoi',
            content,
            re.IGNORECASE,
        )
        self.assertIsNotNone(
            simple,
            "stire.html: nu exista <a class='btn-inapoi' href='stiri.html'>",
        )

    # ------------------------------------------------------------------
    # 8. contact.html contine .contact-info-card cu background: #fff
    # ------------------------------------------------------------------
    def test_contact_info_card_white_bg(self):
        """contact.html trebuie sa defineasca .contact-info-card cu background: #fff."""
        content = _read("contact.html")
        self.assertIn(
            "contact-info-card",
            content,
            "contact.html: lipseste clasa 'contact-info-card'",
        )
        # Cautam declaratia CSS background: #fff in blocul <style> sau inline
        pattern_css = re.compile(
            r'\.contact-info-card\s*\{[^}]*background\s*:\s*#fff', re.IGNORECASE | re.DOTALL
        )
        pattern_inline = re.compile(
            r'contact-info-card[^>]*background\s*:\s*#fff', re.IGNORECASE
        )
        found_css = pattern_css.search(content)
        found_inline = pattern_inline.search(content)
        self.assertTrue(
            found_css or found_inline,
            "contact.html: .contact-info-card nu are 'background: #fff' in <style> sau inline",
        )

    # ------------------------------------------------------------------
    # 9. stiri.html si stire.html fac fetch la data/stiri.json
    # ------------------------------------------------------------------
    def test_json_linked_correctly(self):
        """stiri.html si stire.html trebuie sa referentieze 'data/stiri.json'."""
        pages_to_check = ["stiri.html", "stire.html"]
        # Acceptam atat 'data/stiri.json' cat si '../data/stiri.json'
        pattern = re.compile(r'["\']\.{0,2}/?data/stiri\.json', re.IGNORECASE)
        for page in pages_to_check:
            with self.subTest(page=page):
                content = _read(page)
                self.assertTrue(
                    pattern.search(content),
                    f"{page}: nu contine referinta la 'data/stiri.json'",
                )

    # ------------------------------------------------------------------
    # 10. Directorul images/ exista si contine SVG-urile logotipului
    # ------------------------------------------------------------------
    def test_images_dir_exists(self):
        """Directorul images/ trebuie sa existe si sa contina ambele logo-uri SVG."""
        images_dir = _path("images")
        self.assertTrue(
            os.path.isdir(images_dir),
            f"Directorul images/ nu exista la: {images_dir}",
        )
        for svg_file in ["logo-afa-alb.svg", "logo-afa.svg"]:
            with self.subTest(file=svg_file):
                self.assertTrue(
                    os.path.isfile(os.path.join(images_dir, svg_file)),
                    f"images/{svg_file} nu exista pe disk",
                )

    # ------------------------------------------------------------------
    # 11. Fisierele CSS referentiate exista pe disk
    # ------------------------------------------------------------------
    def test_no_broken_local_css_links(self):
        """
        Fiecare pagina HTML care referenctiaza css/style.css sau
        css/style-apple.css trebuie sa aiba fisierele respective pe disk.
        """
        css_pattern = re.compile(
            r'href=["\'](?P<href>css/[^"\']+\.css)["\']', re.IGNORECASE
        )
        for page in ALL_PAGES:
            content = _read(page)
            matches = css_pattern.findall(content)
            for css_rel in matches:
                with self.subTest(page=page, css=css_rel):
                    css_full = _path(css_rel)
                    self.assertTrue(
                        os.path.isfile(css_full),
                        f"{page}: referentiaza '{css_rel}' dar fisierul nu exista ({css_full})",
                    )

    # ------------------------------------------------------------------
    # 12. admin.html contine campuri de formular pentru titlu, continut, categorie
    # ------------------------------------------------------------------
    def test_admin_has_form(self):
        """
        admin.html trebuie sa contina campuri pentru titlu, continut si categorie.

        Nota: admin.html foloseste o structura div-based (nu un tag <form> clasic),
        cu elementele: id='s-titlu', id='s-categorie', id='s-continut' /
        id='editor-continut'. Testul verifica prezenta acestor campuri functionale.
        """
        content = _read("admin.html")

        # Camp titlu
        self.assertTrue(
            re.search(r'id=["\']s-titlu["\']', content, re.IGNORECASE),
            "admin.html: lipseste campul pentru titlu (id='s-titlu')",
        )

        # Camp categorie
        self.assertTrue(
            re.search(r'id=["\']s-categorie["\']', content, re.IGNORECASE),
            "admin.html: lipseste campul pentru categorie (id='s-categorie')",
        )

        # Camp continut — fie textarea#s-continut fie div#editor-continut (Quill)
        has_continut = re.search(
            r'id=["\']s-continut["\']', content, re.IGNORECASE
        ) or re.search(
            r'id=["\']editor-continut["\']', content, re.IGNORECASE
        )
        self.assertTrue(
            has_continut,
            "admin.html: lipseste campul pentru continut (id='s-continut' sau id='editor-continut')",
        )


# ---------------------------------------------------------------------------
# Entry-point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    unittest.main(verbosity=2)
