#!/data/data/com.termux/files/usr/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Verificando MariaDB ==="
mysqladmin -u root status > /dev/null 2>&1 || {
  echo "Iniciando MariaDB..."
  mysqld_safe --datadir="$PREFIX/var/lib/mysql" &
  sleep 3
}

echo "=== Iniciando servidor ==="
echo ""
echo "  Acesse no navegador: http://localhost:3001"
echo "  Login: admin / 123456"
echo "  (Ctrl+C para parar)"
echo ""

cd "$SCRIPT_DIR/backend" && node src/app.js
