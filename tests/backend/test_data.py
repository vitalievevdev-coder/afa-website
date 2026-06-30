"""
Teste pentru fișierul data/stiri.json al proiectului AFA.

Rulare directă:
    python3 tests/backend/test_data.py

Sau cu runner:
    python3 -m unittest tests.backend.test_data -v
"""

import json
import os
import re
import unittest

# ---------------------------------------------------------------------------
# Căi absolute
# ---------------------------------------------------------------------------

# Directorul rădăcină al proiectului (două niveluri deasupra acestui fișier)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
JSON_PATH = os.path.join(PROJECT_ROOT, 'data', 'stiri.json')

# ---------------------------------------------------------------------------
# Constante de validare
# ---------------------------------------------------------------------------

REQUIRED_FIELDS = {'id', 'titlu', 'continut', 'categorie', 'data', 'autor', 'status'}

VALID_CATEGORIES = {'alerta', 'eveniment', 'raport', 'stire', 'international'}

VALID_STATUSES = {'publicat', 'draft'}

# Formatul datei folosit efectiv în fișier: YYYY-MM-DDTHH:MM
# Notă: specificația originală menționa DD.MM.YYYY, dar datele folosesc ISO 8601.
DATE_REGEX = re.compile(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$')

# Secvența mojibake: U+00E2 U+0080 U+0094 (rezultat din dubla-encodare UTF-8
# a liniei EM DASH — U+2014 — sau a altor caractere speciale).
# Bytes UTF-8 corespunzători: C3 A2  C2 80  C2 94
MOJIBAKE = 'â'

# ---------------------------------------------------------------------------
# Încărcare date la nivel de modul (o singură dată pentru toate testele)
# ---------------------------------------------------------------------------

_DATA = None
_LOAD_ERROR = None

try:
    with open(JSON_PATH, 'r', encoding='utf-8') as _f:
        _DATA = json.load(_f)
except FileNotFoundError as _e:
    _LOAD_ERROR = f"Fișier negăsit: {JSON_PATH}"
except json.JSONDecodeError as _e:
    _LOAD_ERROR = f"JSON invalid: {_e}"
except Exception as _e:
    _LOAD_ERROR = f"Eroare la citire: {_e}"


# ---------------------------------------------------------------------------
# Suite de teste
# ---------------------------------------------------------------------------

class TestStiriJSON(unittest.TestCase):
    """Validare structurală și de conținut pentru data/stiri.json."""

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _require_data(self):
        """Sare testul dacă JSON-ul nu a putut fi încărcat."""
        if _DATA is None:
            self.fail(_LOAD_ERROR)

    def _article_label(self, article):
        return f"articolul id={article.get('id', '?')!r}"

    # ------------------------------------------------------------------
    # 1. JSON valid
    # ------------------------------------------------------------------

    def test_json_valid(self):
        """Fișierul data/stiri.json se poate parsa ca JSON valid și e o listă."""
        if _LOAD_ERROR:
            self.fail(_LOAD_ERROR)
        self.assertIsInstance(_DATA, list,
            "Rădăcina JSON trebuie să fie un array (list)")
        self.assertGreater(len(_DATA), 0,
            "Array-ul de știri este gol")

    # ------------------------------------------------------------------
    # 2. Câmpuri obligatorii
    # ------------------------------------------------------------------

    def test_required_fields(self):
        """Fiecare articol conține toate câmpurile obligatorii."""
        self._require_data()
        for article in _DATA:
            label = self._article_label(article)
            for field in REQUIRED_FIELDS:
                self.assertIn(field, article,
                    f"{label} — câmpul obligatoriu '{field}' lipsește")

    # ------------------------------------------------------------------
    # 3. ID-uri unice
    # ------------------------------------------------------------------

    def test_unique_ids(self):
        """Nu există ID-uri duplicate în array."""
        self._require_data()
        ids = [a.get('id') for a in _DATA]
        duplicates = [i for i in set(ids) if ids.count(i) > 1]
        self.assertEqual(duplicates, [],
            f"ID-uri duplicate detectate: {duplicates}")

    # ------------------------------------------------------------------
    # 4. Categorii valide
    # ------------------------------------------------------------------

    def test_valid_categories(self):
        """Câmpul 'categorie' are una din valorile permise."""
        self._require_data()
        for article in _DATA:
            cat = article.get('categorie')
            self.assertIn(cat, VALID_CATEGORIES,
                f"{self._article_label(article)} — categorie invalidă: {cat!r}. "
                f"Valori permise: {sorted(VALID_CATEGORIES)}")

    # ------------------------------------------------------------------
    # 5. Status valid
    # ------------------------------------------------------------------

    def test_valid_status(self):
        """Câmpul 'status' este 'publicat' sau 'draft'."""
        self._require_data()
        for article in _DATA:
            status = article.get('status')
            self.assertIn(status, VALID_STATUSES,
                f"{self._article_label(article)} — status invalid: {status!r}. "
                f"Valori permise: {sorted(VALID_STATUSES)}")

    # ------------------------------------------------------------------
    # 6. Titluri nevide
    # ------------------------------------------------------------------

    def test_no_empty_titles(self):
        """Niciun titlu nu este gol sau format doar din spații."""
        self._require_data()
        for article in _DATA:
            titlu = article.get('titlu', '')
            self.assertTrue(isinstance(titlu, str) and titlu.strip(),
                f"{self._article_label(article)} — titlul este gol sau whitespace")

    # ------------------------------------------------------------------
    # 7. Fără mojibake
    # ------------------------------------------------------------------

    def test_no_encoding_issues(self):
        """Câmpurile text nu conțin secvența mojibake (U+00E2 U+0080 U+0094)."""
        self._require_data()
        text_fields = ['titlu', 'continut', 'autor']
        for article in _DATA:
            for field in text_fields:
                value = article.get(field) or ''
                self.assertNotIn(MOJIBAKE, value,
                    f"{self._article_label(article)} — mojibake detectat în câmpul '{field}'")

    # ------------------------------------------------------------------
    # 8. Format dată
    # ------------------------------------------------------------------

    def test_date_format(self):
        """Câmpul 'data' respectă formatul ISO YYYY-MM-DDTHH:MM."""
        # Notă: specificația inițială menționa DD.MM.YYYY; datele actuale
        # folosesc formatul ISO 8601 (YYYY-MM-DDTHH:MM).
        self._require_data()
        for article in _DATA:
            data_val = article.get('data', '')
            self.assertRegex(str(data_val), DATE_REGEX,
                f"{self._article_label(article)} — format dată invalid: {data_val!r}. "
                f"Format așteptat: YYYY-MM-DDTHH:MM")

    # ------------------------------------------------------------------
    # 9. Cel puțin un articol principal
    # ------------------------------------------------------------------

    def test_principal_count(self):
        """Există cel puțin un articol cu principal=True."""
        self._require_data()
        principale = [a for a in _DATA if a.get('principal') is True]
        self.assertGreater(len(principale), 0,
            "Nu există niciun articol cu câmpul principal=True")

    # ------------------------------------------------------------------
    # 10. Fișiere foto există pe disk (doar căi locale, nu URL-uri)
    # ------------------------------------------------------------------

    def test_foto_paths_exist(self):
        """Căile foto locale (non-URL) există pe disk relativ la rădăcina proiectului."""
        self._require_data()
        for article in _DATA:
            foto = article.get('foto')
            if foto is None:
                continue  # câmp null — acceptat
            if foto.startswith('http://') or foto.startswith('https://'):
                continue  # URL extern — nu verificăm pe disk
            # Cale locală: construim path absolut și verificăm existența
            local_path = os.path.join(PROJECT_ROOT, foto.lstrip('/'))
            self.assertTrue(os.path.isfile(local_path),
                f"{self._article_label(article)} — fișierul foto lipsește: {foto!r} "
                f"(cale completă: {local_path})")

    # ------------------------------------------------------------------
    # 11. Structura galeriei
    # ------------------------------------------------------------------

    def test_galerie_structure(self):
        """Câmpul 'galerie' este null, o listă goală sau o listă de stringuri."""
        self._require_data()
        for article in _DATA:
            galerie = article.get('galerie')
            if galerie is None:
                continue  # null este acceptat
            self.assertIsInstance(galerie, list,
                f"{self._article_label(article)} — 'galerie' trebuie să fie null sau listă, "
                f"nu {type(galerie).__name__!r}")
            for idx, item in enumerate(galerie):
                self.assertIsInstance(item, str,
                    f"{self._article_label(article)} — galerie[{idx}] nu este string: {item!r}")

    # ------------------------------------------------------------------
    # 12. Conținut nevid
    # ------------------------------------------------------------------

    def test_content_not_empty(self):
        """Câmpul 'continut' nu este gol (chiar dacă conține HTML)."""
        self._require_data()
        for article in _DATA:
            continut = article.get('continut', '')
            # Eliminăm tag-urile HTML pentru a verifica textul efectiv
            text_only = re.sub(r'<[^>]+>', '', continut)
            self.assertTrue(text_only.strip(),
                f"{self._article_label(article)} — câmpul 'continut' este gol sau conține "
                f"doar tag-uri HTML fără text")


# ---------------------------------------------------------------------------
# Punct de intrare direct
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    unittest.main(verbosity=2)
