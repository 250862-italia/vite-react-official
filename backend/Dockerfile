# Backend Dockerfile
FROM node:18-alpine

# Crea directory app
WORKDIR /usr/src/app

# Copia package files
COPY package*.json ./

# Installa dipendenze
RUN npm ci --only=production

# Copia source code
COPY . .

# Crea utente non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Cambia ownership
RUN chown -R nodejs:nodejs /usr/src/app
USER nodejs

# Esponi porta
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Avvia applicazione
CMD ["node", "src/index-simple.js"] 