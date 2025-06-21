#!/bin/bash

# 🚀 AWS Deploy Script per Wash The World Platform
# Prerequisiti: AWS CLI configurato, Docker installato

echo "🚀 Iniziando deploy su AWS..."

# Configurazione
PROJECT_NAME="wash-the-world"
REGION="eu-west-1"
ECR_REPO_FRONTEND="$PROJECT_NAME-frontend"
ECR_REPO_BACKEND="$PROJECT_NAME-backend"

# 1. Build delle immagini Docker
echo "📦 Building Docker images..."

# Frontend
cd frontend
docker build -t $ECR_REPO_FRONTEND .
cd ..

# Backend
cd backend
docker build -t $ECR_REPO_BACKEND .
cd ..

# 2. Login a ECR
echo "🔐 Login a ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com

# 3. Creare repository ECR se non esistono
echo "🏗️ Creando repository ECR..."
aws ecr create-repository --repository-name $ECR_REPO_FRONTEND --region $REGION 2>/dev/null || true
aws ecr create-repository --repository-name $ECR_REPO_BACKEND --region $REGION 2>/dev/null || true

# 4. Tag e push delle immagini
echo "📤 Push delle immagini..."

# Frontend
docker tag $ECR_REPO_FRONTEND:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com/$ECR_REPO_FRONTEND:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com/$ECR_REPO_FRONTEND:latest

# Backend
docker tag $ECR_REPO_BACKEND:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com/$ECR_REPO_BACKEND:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.$REGION.amazonaws.com/$ECR_REPO_BACKEND:latest

# 5. Deploy su ECS
echo "🚀 Deploy su ECS..."

# Creare cluster ECS
aws ecs create-cluster --cluster-name $PROJECT_NAME --region $REGION 2>/dev/null || true

# Deploy backend
aws ecs register-task-definition --cli-input-json file://backend/task-definition.json --region $REGION
aws ecs create-service --cluster $PROJECT_NAME --service-name backend --task-definition backend --desired-count 1 --region $REGION 2>/dev/null || aws ecs update-service --cluster $PROJECT_NAME --service backend --task-definition backend --region $REGION

# Deploy frontend
aws ecs register-task-definition --cli-input-json file://frontend/task-definition.json --region $REGION
aws ecs create-service --cluster $PROJECT_NAME --service-name frontend --task-definition frontend --desired-count 1 --region $REGION 2>/dev/null || aws ecs update-service --cluster $PROJECT_NAME --service frontend --task-definition frontend --region $REGION

echo "✅ Deploy completato!"
echo "🌐 Frontend: http://your-frontend-domain.com"
echo "🔗 Backend: http://your-backend-domain.com" 