# --- Backend: Node + Prisma ---
FROM node:20-alpine

# Prisma needs openssl and libc6-compat to run on Alpine
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the code
COPY . .

EXPOSE 4000

# Run migrations, seed, and start in one go
CMD npx prisma db push && node prisma/seed.js && node src/index.js
