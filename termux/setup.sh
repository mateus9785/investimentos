#!/data/data/com.termux/files/usr/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== [1/6] Atualizando pacotes ==="
pkg update -y && pkg upgrade -y

echo "=== [2/6] Instalando Node.js e MariaDB ==="
pkg install -y nodejs mariadb

echo "=== [3/6] Inicializando MariaDB ==="
if [ ! -d "$PREFIX/var/lib/mysql/mysql" ]; then
  mysql_install_db
else
  echo "  MariaDB ja inicializado, pulando."
fi

echo "Verificando MariaDB..."
mysqladmin -u root status > /dev/null 2>&1 || {
  echo "Iniciando MariaDB..."
  mysqld_safe --datadir="$PREFIX/var/lib/mysql" &
  sleep 5
}

echo "=== [4/6] Recriando banco de dados do zero ==="
mysql -u root <<'SQL'
DROP DATABASE IF EXISTS investimentos;
CREATE DATABASE investimentos;
CREATE USER IF NOT EXISTS 'investimentos'@'localhost' IDENTIFIED BY '171010231';
GRANT ALL PRIVILEGES ON investimentos.* TO 'investimentos'@'localhost';
FLUSH PRIVILEGES;
SQL

echo "=== [5/6] Executando migrations ==="
for migration in "$SCRIPT_DIR"/backend/database/migrations/*.sql; do
  echo "  Aplicando: $(basename "$migration")"
  mysql -u investimentos -p171010231 investimentos < "$migration"
done

echo "=== [6/6] Instalando dependências e buildando frontend ==="
cd "$SCRIPT_DIR/backend" && npm install
cd "$SCRIPT_DIR/frontend" && npm install && npm run build

echo ""
echo "Setup concluido com sucesso!"
echo "Para iniciar o sistema, rode:"
echo "  bash termux/start.sh"
echo "Depois abra no navegador: http://localhost:3001"
