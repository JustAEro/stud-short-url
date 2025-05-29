# Используем тот же базовый builder для node_modules и исходников
FROM node:22 AS base-builder

WORKDIR /app

COPY package*.json ./
RUN npm cache clean --force && npm ci

COPY . .

# Билдим api
FROM node:22 AS api-builder

WORKDIR /app

COPY --from=base-builder /app/node_modules ./node_modules
COPY --from=base-builder /app .

RUN npx nx build api
RUN npx prisma generate

# Финальный образ для запуска api
FROM node:22

WORKDIR /app

COPY --from=api-builder /app/node_modules ./node_modules
COPY --from=api-builder /app/dist ./dist
COPY --from=api-builder /app/prisma ./prisma
COPY --from=api-builder /app/package.json ./package.json

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/apps/api/main.js"]
