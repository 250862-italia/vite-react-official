#!/bin/bash

# 🚀 Microsoft Azure Deploy Script
# Prerequisiti: Azure CLI configurato

echo "🚀 Iniziando deploy su Microsoft Azure..."

# Configurazione
RESOURCE_GROUP="wash-the-world-rg"
LOCATION="westeurope"
APP_SERVICE_PLAN="wash-the-world-plan"
FRONTEND_APP="wash-the-world-frontend"
BACKEND_APP="wash-the-world-backend"

# 1. Crea resource group
echo "🏗️ Creando resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# 2. Crea app service plan
echo "📋 Creando app service plan..."
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux

# 3. Deploy frontend
echo "📦 Deploying frontend..."
cd frontend
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $FRONTEND_APP \
  --runtime "NODE|18-lts"

# Build e deploy
npm run build
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $FRONTEND_APP \
  --src dist.zip

# Configura variabili d'ambiente
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $FRONTEND_APP \
  --settings NODE_ENV=production
cd ..

# 4. Deploy backend
echo "🔧 Deploying backend..."
cd backend
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $BACKEND_APP \
  --runtime "NODE|18-lts"

# Deploy codice
az webapp deployment source config-local-git \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP

# Configura variabili d'ambiente
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $BACKEND_APP \
  --settings NODE_ENV=production PORT=5000
cd ..

# 5. Configura custom domain (opzionale)
echo "🌐 Configurando dominio..."
# az webapp config hostname add \
#   --webapp-name $FRONTEND_APP \
#   --resource-group $RESOURCE_GROUP \
#   --hostname your-domain.com

echo "✅ Deploy completato!"
echo "🌐 Frontend: https://$FRONTEND_APP.azurewebsites.net"
echo "🔗 Backend: https://$BACKEND_APP.azurewebsites.net" 