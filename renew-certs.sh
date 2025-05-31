#!/bin/bash

# Останавливаем контейнерный Nginx и ui
docker compose stop nginx ui

# Запускаем системный Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Обновляем сертификаты
sudo certbot renew --nginx --quiet

# Останавливаем системный Nginx
sudo systemctl stop nginx
sudo systemctl disable nginx

# Запускаем контейнерный Nginx обратно
npm run compose:up:d
