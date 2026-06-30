#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# run_all.sh — Ruleaza toate testele proiectului AFA
# Utilizare: bash tests/run_all.sh
#            (din radacina proiectului)
# ---------------------------------------------------------------------------

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PASS=0
FAIL=0
SKIP=0

run_test() {
    local label="$1"
    local cmd="$2"
    echo ""
    echo "======================================================"
    echo "  $label"
    echo "======================================================"
    if eval "$cmd"; then
        echo "[OK] $label"
        PASS=$((PASS + 1))
    else
        echo "[FAIL] $label"
        FAIL=$((FAIL + 1))
    fi
}

# ------------------------------------------------------------------
# 1. Teste backend Python
# ------------------------------------------------------------------
if [ -f "tests/backend/test_data.py" ]; then
    run_test "Backend tests (test_data.py)" "python3 tests/backend/test_data.py"
else
    echo ""
    echo "[SKIP] tests/backend/test_data.py nu exista inca."
    SKIP=$((SKIP + 1))
fi

# ------------------------------------------------------------------
# 2. Teste HTML consistency (Tester)
# ------------------------------------------------------------------
run_test "HTML Consistency tests (test_html_consistency.py)" \
    "python3 tests/tester/test_html_consistency.py"

# ------------------------------------------------------------------
# 3. Playwright E2E (daca exista package.json)
# ------------------------------------------------------------------
if [ -f "package.json" ]; then
    if command -v npx &>/dev/null; then
        run_test "Playwright E2E tests" "npx playwright test"
    else
        echo ""
        echo "[SKIP] npx nu e disponibil — instaleaza Node.js pentru Playwright."
        SKIP=$((SKIP + 1))
    fi
else
    echo ""
    echo "[SKIP] package.json nu exista — testele Playwright sunt omise."
    SKIP=$((SKIP + 1))
fi

# ------------------------------------------------------------------
# Sumar final
# ------------------------------------------------------------------
echo ""
echo "======================================================"
echo "  SUMAR"
echo "======================================================"
echo "  Trecut  : $PASS"
echo "  Esuat   : $FAIL"
echo "  Omis    : $SKIP"
echo "======================================================"

if [ "$FAIL" -gt 0 ]; then
    exit 1
fi
exit 0
