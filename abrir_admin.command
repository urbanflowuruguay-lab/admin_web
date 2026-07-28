#!/bin/bash
echo "========================================"
echo "  UrbanFlow - Admin Web"
echo "========================================"
echo ""

cd "$(dirname "$0")"

lsof -ti:8080 | xargs kill -9 2>/dev/null
sleep 1

echo "Iniciando servidor Node.js en puerto 8080..."
echo "Para cerrar, presiona Ctrl+C."
echo ""

node server.js &
sleep 2
open http://localhost:8080/index.html
