#!/bin/bash

echo "🚀 AVVIO SISTEMA PENTASHOP WORLD"
echo "=================================="

# Kill tutti i processi esistenti
echo "🧹 Pulizia processi esistenti..."
pkill -f "node" 2>/dev/null
pkill -f "npm" 2>/dev/null
sleep 3

# Verifica che le porte siano libere
echo "🔍 Verifica porte..."
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Porta 3001 occupata"
    lsof -ti:3001 | xargs kill -9
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Porta 5173 occupata"
    lsof -ti:5173 | xargs kill -9
fi

sleep 2

# Avvia backend
echo "🔧 Avvio backend..."
cd backend
node src/index.js &
BACKEND_PID=$!
cd ..

sleep 5

# Test backend
echo "🧪 Test backend..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend OK"
else
    echo "❌ Backend FAIL"
    exit 1
fi

# Avvia frontend
echo "🎨 Avvio frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

sleep 8

# Test frontend
echo "🧪 Test frontend..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend OK"
else
    echo "❌ Frontend FAIL"
    exit 1
fi

# Test login
echo "🔐 Test login admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "✅ Login OK"
else
    echo "❌ Login FAIL"
    echo "Response: $LOGIN_RESPONSE"
fi

echo ""
echo "🎉 SISTEMA AVVIATO CON SUCCESSO!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3001"
echo "🔐 Admin: admin / password"
echo ""
echo "Per fermare: pkill -f 'node'" 