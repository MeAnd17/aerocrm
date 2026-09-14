FROM node:20-alpine
WORKDIR /app

# Install dependencies needed for Prisma binary
RUN apk add --no-cache openssl libc6-compat

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Generate Prisma client for linux-musl (Alpine)
RUN npx prisma generate

# Build TypeScript
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]
