# Frontend Dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# Copia package files
COPY package*.json ./

# Installa dipendenze
RUN npm ci --only=production

# Copia source code
COPY . .

# Build dell'applicazione
RUN npm run build

# Production stage
FROM nginx:alpine

# Copia i file buildati
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia configurazione nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Esponi porta 80
EXPOSE 80

# Avvia nginx
CMD ["nginx", "-g", "daemon off;"] 