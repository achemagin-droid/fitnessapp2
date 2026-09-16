FROM nginx:1.27-alpine

# Удаляем стандартный конфиг
RUN rm /etc/nginx/conf.d/default.conf

# Копируем наш конфиг
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Директория для SSL-сертификатов (монтируется при запуске)
RUN mkdir -p /etc/nginx/ssl /var/www/certbot

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
