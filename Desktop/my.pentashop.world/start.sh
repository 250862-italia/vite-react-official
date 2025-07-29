#!/bin/bash

echo "🚀 Avvio Wash The World Platform..."

# Ferma eventuali processi esistenti
echo "🛑 Fermando processi esistenti..."
pkill -f "node.*src/index.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
pkill -f "nodemon" 2>/dev/null

# Aspetta che i processi si fermino
sleep 2

# Avvia il backend
echo "🔧 Avvio backend..."
cd backend && npm run dev &
BACKEND_PID=$!

# Aspetta che il backend si avvii
sleep 5

# Testa il backend
echo "🧪 Test backend..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Backend avviato correttamente su http://localhost:3000"
else
    echo "❌ Errore nell'avvio del backend"
    exit 1
fi

# Avvia il frontend
echo "🎨 Avvio frontend..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

# Aspetta che il frontend si avvii
sleep 5

# Testa il frontend
echo "🧪 Test frontend..."
if curl -s http://localhost:5173/ > /dev/null; then
    echo "✅ Frontend avviato correttamente su http://localhost:5173"
else
    echo "❌ Errore nell'avvio del frontend"
    exit 1
fi

echo ""
echo "🎉 Wash The World Platform è ora online!"
echo ""
echo "📊 Backend:  http://localhost:3000"
echo "🎨 Frontend: http://localhost:5173"
echo "🔐 Login:    testuser / password"
echo ""
echo "Per fermare l'applicazione, premi Ctrl+C"

# Mantieni lo script in esecuzione
wait 