#!/bin/bash

echo "🔧 Risoluzione problemi di dipendenze..."
echo ""

# Ferma tutti i processi
echo "🛑 Fermando processi esistenti..."
pkill -f "node" 2>/dev/null
pkill -f "vite" 2>/dev/null
pkill -f "nodemon" 2>/dev/null
sleep 2

# Pulisci cache npm
echo "🧹 Pulizia cache npm..."
npm cache clean --force 2>/dev/null

# Reinstalla dipendenze principali
echo "📦 Reinstallazione dipendenze principali..."
rm -rf node_modules package-lock.json 2>/dev/null
npm install

# Reinstalla dipendenze frontend
echo "🎨 Reinstallazione dipendenze frontend..."
cd frontend
rm -rf node_modules package-lock.json 2>/dev/null
npm install
npm install @remix-run/router
npm install react-router-dom@latest

# Reinstalla dipendenze backend
echo "🔧 Reinstallazione dipendenze backend..."
cd ../backend
rm -rf node_modules package-lock.json 2>/dev/null
npm install

# Torna alla directory principale
cd ..

echo ""
echo "✅ Problemi di dipendenze risolti!"
echo ""
echo "🚀 Per avviare l'applicazione, usa:"
echo "   ./start-app.sh"
echo ""
echo "🧪 Per testare le credenziali, usa:"
echo "   node test-login.js" 