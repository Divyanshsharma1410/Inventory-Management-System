# --- Backend: Node + Prisma ---
FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Prisma needs the schema at install/generate time.
COPY prisma ./prisma
RUN npx prisma generate

COPY . .

# Entrypoint syncs the DB schema, seeds, then starts the server.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/index.js"]
