# ── Etapa 1: dependencias y build ─────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npx prisma generate && npm run build

# ── Etapa 2: imagen de ejecución ──────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/src/loyalty/loyalty.rules.ts ./src/loyalty/loyalty.rules.ts
EXPOSE 3000
CMD ["node", "dist/main"]
