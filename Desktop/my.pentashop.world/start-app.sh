#!/bin/bash

echo "🚀 Avvio Wash The World Platform..."
echo ""

# Ferma eventuali processi esistenti
echo "🛑 Fermando processi esistenti..."
pkill -f "node.*src/index.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
pkill -f "nodemon" 2>/dev/null

# Aspetta che i processi si fermino
sleep 2

# Verifica e risolve problemi di dipendenze
echo "🔧 Verifica dipendenze..."
cd frontend && npm install @remix-run/router 2>/dev/null
cd ../backend && npm install 2>/dev/null
cd ..

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
echo "🎉 Applicazione avviata con successo!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3000"
echo ""
echo "🔐 Credenziali di test:"
echo "   • testuser / password (Utente normale)"
echo "   • admin / admin123 (Amministratore)"
echo "   • ambassador1 / ambassador123 (Ambassador MLM)"
echo "   • Gianni 62 / password123 (Gianni Rossi)"
echo "   • testuser2 / password123 (Giuseppe Verdi)"
echo "   • nuovo / password123 (Nuovo utente)"
echo ""
echo "💡 Per fermare l'applicazione, premi Ctrl+C"
echo ""

# Funzione per pulire i processi quando si interrompe lo script
cleanup() {
    echo ""
    echo "🛑 Fermando applicazione..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    pkill -f "node.*src/index.js" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    echo "✅ Applicazione fermata"
    exit 0
}

# Intercetta il segnale di interruzione
trap cleanup SIGINT SIGTERM

# Mantieni lo script in esecuzione
wait 