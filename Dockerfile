# ═════════════════════════════════════════════════════════════════════════
# Dockerfile — G1 Suplementos Backend
# Otimizado para Railway
# ═════════════════════════════════════════════════════════════════════════

# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Runtime
FROM node:18-alpine
WORKDIR /app

# Instalar dumb-init para melhor gerenciamento de processos
RUN apk add --no-cache dumb-init

# Copiar node_modules do stage anterior
COPY --from=builder /app/node_modules ./node_modules

# Copiar código-fonte
COPY package*.json ./
COPY files/backend-mp/server.js ./
COPY files/backend-mp/.env.example ./

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expor porta (documentação, Railway injeta via process.env.PORT)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Usar dumb-init para manter o processo ativo
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
