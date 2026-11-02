#!/usr/bin/env bash
# db-ready.sh — `apps/api` doğrulama kapısının DB ön kontrolü (DB-001 P6).
#
# Ne yapar:
#   1. `.env` varlığı + `DB_DIALECT` kontrolü (kapı Postgres bekler; sqlite yalnız
#      elle verilen geri dönüş yoludur).
#   2. Tünel/port kontrolü: `DB_HOST:DB_PORT` (varsayılan localhost:5433) TCP'ye açık mı.
#   3. `npm run migrate:status` ile bekleyen migration var mı (uygulanan sayısı == dosya sayısı).
#
# Çıkış: 0 = hazır, 1 = hazır değil (sebep açıkça yazılır — sessiz geçiş yok).
#
# Kullanım:
#   bash apps/api/scripts/db-ready.sh
#   DB_PORT=5999 bash apps/api/scripts/db-ready.sh   # tünel kapalı senaryosu
#
# Dış ortam değişkenleri `.env` değerlerini ezer (DB_HOST/DB_PORT/DB_DIALECT).
set -uo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)" || {
  echo "db-ready: ✖ apps/api dizini bulunamadı" >&2
  exit 1
}
cd "$APP_DIR" || {
  echo "db-ready: ✖ $APP_DIR içine girilemedi" >&2
  exit 1
}

fail() { echo "db-ready: ✖ $*" >&2; exit 1; }
ok() { echo "db-ready: ✔ $*"; }
warn() { echo "db-ready: ⚠ $*"; }

# Dosyadan tek anahtar okur (yorum/satır sonu/tırnak temizlenir).
env_val() {
  local key line file
  key="$1"
  file="${2:-.env}"
  line="$(grep -E "^[[:space:]]*${key}=" "$file" 2>/dev/null | tail -1)" || true
  [ -n "$line" ] || return 0
  printf '%s' "${line#*=}" | tr -d '\r' | sed -e "s/^[\"']//" -e "s/[\"']$//"
}

# --- 1. .env + DB_DIALECT ----------------------------------------------------
[ -f .env ] || fail ".env yok: $APP_DIR/.env (oluştur: cp .env.example .env ve DB_* değerlerini doldur)"

DB_DIALECT="${DB_DIALECT:-$(env_val DB_DIALECT)}"
DB_DIALECT="${DB_DIALECT:-postgres}"
case "$DB_DIALECT" in
  postgres|postgresql)
    ok ".env var · DB_DIALECT=$DB_DIALECT"
    ;;
  sqlite)
    fail "DB_DIALECT=sqlite — kapı Postgres bekliyor. Bu mod yalnız DB-001 §6 geri dönüş yoludur: \
testler Postgres zorunlu kılar (tests/setup.js) ve kapı bekleyen migration'ı doğrulayamaz. \
Geri dönüş denemesi için kapıyı bilinçli atla (SKIP_VERIFY=1), normal akışta .env'de DB_DIALECT=postgres kullan."
    ;;
  *)
    fail "Geçersiz DB_DIALECT: '$DB_DIALECT' (desteklenen: postgres | sqlite)"
    ;;
esac

DB_HOST="${DB_HOST:-$(env_val DB_HOST)}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-$(env_val DB_PORT)}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-$(env_val DB_NAME)}"
DB_NAME="${DB_NAME:-beauty_salon}"
# Test DB adı `.env.test`'ten gelir (`npm test` bu dosyayı yükler), yoksa varsayılan.
DB_NAME_TEST="${DB_NAME_TEST:-$(env_val DB_NAME_TEST .env.test)}"
DB_NAME_TEST="${DB_NAME_TEST:-$(env_val DB_NAME .env.test)}"
DB_NAME_TEST="${DB_NAME_TEST:-beauty_salon_test}"

# --- 2. Tünel / port ---------------------------------------------------------
PORT_ERR="$(node -e '
const net = require("net");
const host = process.argv[1];
const port = Number(process.argv[2]);
const socket = net.connect({ host, port });
socket.setTimeout(3000, () => {
  console.error("zaman aşımı (3s)");
  socket.destroy();
  process.exit(2);
});
socket.on("connect", () => { socket.end(); process.exit(0); });
socket.on("error", (err) => { console.error(err.code || err.message); process.exit(1); });
' "$DB_HOST" "$DB_PORT" 2>&1)" || PORT_RC=$?
PORT_RC="${PORT_RC:-0}"

if [ "$PORT_RC" -ne 0 ]; then
  fail "TCP $DB_HOST:$DB_PORT kapalı ($PORT_ERR). Postgres docker'da (Mint düğümü) koşar ve \
localhost:$DB_PORT tüneli üzerinden erişilir: tüneli aç (mint-tunnel.ps1) veya docker'ın ayakta olduğunu doğrula. \
Farklı port deneyeceksen: DB_PORT=<port> bash apps/api/scripts/db-ready.sh"
fi
ok "TCP $DB_HOST:$DB_PORT açık"

# --- 3. Bekleyen migration ---------------------------------------------------
MIG_DIR="src/database/migrations"
MIG_FILES=$(ls "$MIG_DIR"/*.js 2>/dev/null | wc -l | tr -d ' ')
[ "$MIG_FILES" -gt 0 ] || fail "$MIG_DIR içinde migration dosyası yok"

STATUS_RAW="$(npm run --silent migrate:status 2>&1)"
STATUS_RC=$?
if [ "$STATUS_RC" -ne 0 ]; then
  DETAIL="$(printf '%s\n' "$STATUS_RAW" | grep -iE 'error|hata|ECONNREFUSED|does not exist|password' | head -3)"
  [ -n "$DETAIL" ] || DETAIL="$(printf '%s\n' "$STATUS_RAW" | tail -3)"
  fail "npm run migrate:status başarısız (rc=$STATUS_RC): $DETAIL"
fi

UP_COUNT=$(printf '%s\n' "$STATUS_RAW" | grep -cE '^up ')
PENDING=$(printf '%s\n' "$STATUS_RAW" | grep -E '^down ' || true)

if [ -n "$PENDING" ]; then
  fail "bekleyen migration var (uygulanan $UP_COUNT/$MIG_FILES):
$(printf '%s\n' "$PENDING" | sed 's/^/    /')
  Düzeltme: cd apps/api && npm run migrate"
fi

if [ "$UP_COUNT" -ne "$MIG_FILES" ]; then
  fail "migration sayısı tutmuyor: uygulanan $UP_COUNT, dosya $MIG_FILES. \
  Düzeltme: cd apps/api && npm run migrate (veya DB_NAME/DB_NAME_TEST doğru mu kontrol et)"
fi

ok "migration $UP_COUNT/$MIG_FILES uygulanmış, bekleyen yok"

# --- Özet --------------------------------------------------------------------
if [ -f .env.test ]; then
  ok ".env.test var (test DB: $DB_NAME_TEST)"
else
  warn ".env.test yok — \`npm test\` çalışmaz (oluştur: cp .env.example .env.test, DB_DIALECT=postgres, DB_NAME=$DB_NAME_TEST)"
fi

echo "db-ready: TAMAM — Postgres hazır (dev: $DB_NAME · test: $DB_NAME_TEST · $DB_HOST:$DB_PORT)"
exit 0
