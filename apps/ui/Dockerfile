# Stage 1: Build Angular app using Node 22
FROM node:22 AS builder

WORKDIR /app

# Копируем только package.json и lock-файл сначала для кеша зависимостей
COPY package*.json ./

# Устанавливаем зависимости (заменили npm ci на install из-за ошибки bus error)
RUN npm ci

# Копируем весь исходник в контейнер
COPY . .

# Сборка Angular-приложения
RUN npx nx build ui --configuration=production

# Stage 2: Nginx для сервинга
FROM nginx:alpine

# Удаляем дефолтный nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Копируем свой конфиг с прокси на API
COPY apps/ui/nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранное Angular-приложение
COPY --from=builder /app/dist/apps/ui/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
