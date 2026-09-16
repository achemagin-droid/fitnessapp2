# CheckLis Booking

Система онлайн-записи, абонементов и уведомлений для фитнес-студии LIFE.

## 🚀 Возможности

- 📅 Онлайн-запись на тренировки
- 💳 Управление абонементами с FIFO-списанием
- 🔔 Автоматические уведомления (Telegram/Email)
- 👥 Админ-панель для управления расписанием
- 📊 Статистика посещений

## 🛠 Технологический стек

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- Vite

### Backend
- Python 3.12 + FastAPI
- PostgreSQL 16
- Redis 7
- Celery (фоновые задачи)

### Infrastructure
- Docker + Docker Compose
- Nginx (reverse proxy)

## 📋 Требования

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 20+ (для локальной разработки)

## 🚀 Быстрый старт

### 1. Клонировать репозиторий

```bash
git clone <repository-url>
cd checklis-booking
```

### 2. Настроить переменные окружения

```bash
cp .env.example .env
nano .env
```

**Обязательные переменные:**
- `POSTGRES_PASSWORD` - пароль для PostgreSQL (обязательно!)
- `SECRET_KEY` - секретный ключ для JWT (генерируется командой `openssl rand -hex 32`)

**Пример .env:**
```bash
POSTGRES_DB=checklis
POSTGRES_USER=checklis_user
POSTGRES_PASSWORD=your_secure_password_here
SECRET_KEY=your_random_secret_key_here
```

### 3. Запустить приложение

```bash
docker compose up -d
```

Приложение будет доступно:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Nginx: http://localhost:80

### 4. Остановить приложение

```bash
docker compose down
```

## 📁 Структура проекта

```
checklis-booking/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py      # FastAPI application
│   │   ├── core/        # Configuration
│   │   └── tasks.py     # Celery tasks
│   ├── init.sql         # Database initialization
│   ├── requirements.txt # Python dependencies
│   └── Dockerfile
├── src/                  # React frontend
│   ├── App.tsx
│   ├── components/
│   └── ...
├── nginx/                # Nginx configuration
│   └── nginx.conf
├── docker-compose.yml    # Docker services
├── Dockerfile           # Frontend Dockerfile
└── README.md
```

## 🔧 Разработка

### Локальная разработка (без Docker)

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # или venv\Scripts\activate на Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
npm install
npm run dev
```

### Запуск тестов

```bash
# Backend
cd backend
pytest

# Frontend
npm test
```

## 📡 API Endpoints

### Публичные (виджет)
- `GET /api/sessions` - Список занятий
- `POST /api/bookings` - Создать запись
- `GET /api/clients/lookup?phone=...` - Поиск клиента

### Админские
- `GET /api/admin/sessions/week` - Расписание на неделю
- `PUT /api/admin/bookings/{id}/checkin` - Отметить посещение
- `POST /api/admin/passes` - Выпустить абонемент

Полная документация: http://localhost:8000/docs

## 🔔 Уведомления

### Telegram
1. Создайте бота через @BotFather
2. Получите токен
3. Укажите токен в `.env`: `TELEGRAM_BOT_TOKEN`

### Email
Настройте SMTP в `.env`:
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASSWORD=your_password
```

## 💾 База данных

### Подключение к PostgreSQL

```bash
docker compose exec postgres psql -U checklis_user -d checklis
```

### Сброс базы данных

```bash
docker compose down -v
docker compose up -d
```

## 🐛 Troubleshooting

### Ошибка: "could not find expected ':'" в docker-compose.yml
Убедитесь, что файл не содержит синтаксических ошибок YAML. Проверьте отступы (используйте пробелы, не табы).

### Backend не запускается
```bash
# Проверьте логи
docker compose logs backend

# Перезапустите
docker compose restart backend
```

### Порт уже занят
Измените порты в `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # вместо 80:80
```

## 📝 Лицензия

MIT

## 👥 Контакты

- Email: your-email@example.com
- Telegram: @your_handle
