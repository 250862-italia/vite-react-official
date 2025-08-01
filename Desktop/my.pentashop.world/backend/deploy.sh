#!/bin/bash

# Script di deploy per Railway
echo "🚀 Deploying Backend to Railway..."

# Verifica che siamo nella directory corretta
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the backend directory."
    exit 1
fi

# Verifica che il file principale esista
if [ ! -f "src/index.js" ]; then
    echo "❌ Error: src/index.js not found."
    exit 1
fi

# Installa le dipendenze
echo "📦 Installing dependencies..."
npm install

# Verifica che il comando start funzioni
echo "🔧 Testing start command..."
npm start &
PID=$!
sleep 5

# Test health check
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend is working correctly!"
    kill $PID
else
    echo "❌ Backend health check failed!"
    kill $PID
    exit 1
fi

echo "✅ Backend ready for Railway deployment!"
echo "📋 Next steps:"
echo "1. Go to Railway Dashboard"
echo "2. Create new service or update existing"
echo "3. Set root directory to 'backend'"
echo "4. Deploy!" 