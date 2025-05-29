# Базовый этап: установка зависимостей и копирование исходников
FROM node:22 AS base-builder

WORKDIR /app

COPY package*.json ./
RUN npm cache clean --force && npm ci

COPY . .

# UI билд (используем node_modules из base-builder)
FROM node:22 AS ui-builder

WORKDIR /app

COPY --from=base-builder /app/node_modules ./node_modules
COPY --from=base-builder /app .

RUN npx nx build ui --configuration=production

# Финальный образ с nginx для сервинга ui
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY apps/ui/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=ui-builder /app/dist/apps/ui/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
