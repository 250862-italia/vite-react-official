#!/bin/bash

# 🚀 Google Cloud Platform Deploy Script
# Prerequisiti: gcloud CLI configurato

echo "🚀 Iniziando deploy su Google Cloud Platform..."

# Configurazione
PROJECT_ID="wash-the-world-platform"
REGION="europe-west1"
SERVICE_NAME="wash-the-world"

# 1. Imposta il progetto
echo "🔧 Configurando progetto..."
gcloud config set project $PROJECT_ID

# 2. Abilita le API necessarie
echo "🔌 Abilitando API..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# 3. Build e deploy frontend
echo "📦 Deploying frontend..."
cd frontend
gcloud builds submit --tag gcr.io/$PROJECT_ID/frontend
gcloud run deploy frontend \
  --image gcr.io/$PROJECT_ID/frontend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 80 \
  --set-env-vars NODE_ENV=production
cd ..

# 4. Build e deploy backend
echo "🔧 Deploying backend..."
cd backend
gcloud builds submit --tag gcr.io/$PROJECT_ID/backend
gcloud run deploy backend \
  --image gcr.io/$PROJECT_ID/backend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 5000 \
  --set-env-vars NODE_ENV=production,PORT=5000
cd ..

# 5. Configura custom domain (opzionale)
echo "🌐 Configurando dominio..."
# gcloud run domain-mappings create \
#   --service frontend \
#   --domain your-domain.com \
#   --region $REGION

echo "✅ Deploy completato!"
echo "🌐 Frontend: https://frontend-xxxxx-ew.a.run.app"
echo "🔗 Backend: https://backend-xxxxx-ew.a.run.app" 