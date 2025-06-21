#!/bin/bash

# 🚀 DigitalOcean App Platform Deploy Script
# Prerequisiti: doctl CLI configurato

echo "🚀 Iniziando deploy su DigitalOcean App Platform..."

# Configurazione
APP_NAME="wash-the-world-platform"
REGION="fra1"

# 1. Crea app specification
echo "📋 Creando app specification..."
cat > app.yaml << EOF
name: $APP_NAME
region: $REGION
services:
  - name: frontend
    source_dir: /frontend
    github:
      repo: your-username/my.pentashop.world
      branch: main
    build_command: npm run build
    run_command: npm run preview
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    routes:
      - path: /
    envs:
      - key: VITE_API_URL
        value: \${backend_url}

  - name: backend
    source_dir: /backend
    github:
      repo: your-username/my.pentashop.world
      branch: main
    build_command: npm install
    run_command: node src/index-simple.js
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    routes:
      - path: /api
    envs:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000
      - key: CORS_ORIGIN
        value: \${frontend_url}

databases:
  - name: wash-the-world-db
    engine: PG
    version: "12"
    size: db-s-1vcpu-1gb
EOF

# 2. Deploy app
echo "🚀 Deploying app..."
doctl apps create --spec app.yaml

# 3. Ottieni URL dell'app
echo "🔗 Ottenendo URL..."
APP_ID=$(doctl apps list --format ID,Name --no-header | grep $APP_NAME | awk '{print $1}')
FRONTEND_URL=$(doctl apps get $APP_ID --format Spec.Services[0].Routes[0].URL --no-header)
BACKEND_URL=$(doctl apps get $APP_ID --format Spec.Services[1].Routes[0].URL --no-header)

echo "✅ Deploy completato!"
echo "🌐 Frontend: $FRONTEND_URL"
echo "🔗 Backend: $BACKEND_URL"

# 4. Configura custom domain (opzionale)
echo "🌐 Per configurare un dominio personalizzato:"
echo "doctl apps create-domain $APP_ID your-domain.com" 