# CheckLis Booking — LIFE Fitness Studio

> Система онлайн-записи, абонементов и уведомлений для фитнес-студии.  
> Заменяет платный сервис Booktime и Excel-таблицы.

![Stack](https://img.shields.io/badge/FastAPI-Python-blue) ![Stack](https://img.shields.io/badge/React-18-61DAFB) ![Stack](https://img.shields.io/badge/Tailwind-4-06B6D4) ![Stack](https://img.shields.io/badge/PostgreSQL-16-336791) ![Stack](https://img.shields.io/badge/Docker-Ready-2496ED)

<!-- Замените <owner>/<repo> на ваш GitHub-репозиторий -->
[![CI](https://github.com/<owner>/<repo>/actions/workflows/ci.yml/badge.svg)](https://github.com/<owner>/<repo>/actions/workflows/ci.yml)
[![Release](https://github.com/<owner>/<repo>/actions/workflows/release.yml/badge.svg)](https://github.com/<owner>/<repo>/actions/workflows/release.yml)
[![Docker](https://img.shields.io/badge/ghcr.io-images-2496ED)](https://github.com/<owner>/<repo>/pkgs)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

---

## 📋 Содержание

- [Обзор](#-обзор)
- [Архитектура](#-архитектура)
- [Быстрый старт (Frontend MVP)](#-быстрый-старт-frontend-mvp)
- [Полный деплой (Backend + Frontend)](#-полный-деплой-backend--frontend)
- [Структура проекта](#-структура-проекта)
- [API Reference](#-api-reference)
- [База данных](#-база-данных)
- [Уведомления](#-уведомления)
- [iFrame-виджет](#-iframe-виджет)
- [Переменные окружения](#-переменные-окружения)
- [CI/CD (GitHub Actions)](#-cicd-github-actions)
- [Makefile](#-makefile)
- [Troubleshooting](#-troubleshooting)

---

## 🔍 Обзор

### Пользователи

| Роль | Интерфейс | Описание |
|------|-----------|----------|
| **Клиент** | Публичный виджет | Выбор занятия, запись, управление абонементом |
| **Администратор** | Админ-панель | Расписание, чек-ин, CRM, абонементы, уведомления |

### Ключевые возможности

- 📅 **Расписание** — вид на неделю с заполненностью в реальном времени
- 📝 **Онлайн-запись** — mobile-first виджет с автозаполнением по телефону
- 💳 **Абонементы** — FIFO-списание посещений, контроль сроков
- 🔔 **Уведомления** — Telegram + Email за 2 часа до тренировки
- ✅ **Чек-ин** — отметка прихода, no-show, walk-in
- 👥 **Мини-CRM** — карточки клиентов, история посещений

---

## 🏗 Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                      Nginx (Reverse Proxy)               │
│                    Порт 80 / 443 (SSL)                   │
├──────────────────────┬──────────────────────────────────┤
│                      │                                  │
│   / (виджет)         │        /api/*                    │
│   /admin             │        /admin/*                  │
│   Static Frontend    │        FastAPI Backend           │
│   React + Tailwind   │        Python + SQLAlchemy       │
│                      │                                  │
├──────────────────────┴──────────────────────────────────┤
│                                                          │
│              PostgreSQL 16 (Данные)                      │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│    Telegram Bot API          SMTP (Email)                │
│    (Уведомления)             (Уведомления)               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Стек технологий

| Компонент | Технология | Назначение |
|-----------|-----------|------------|
| Frontend (виджет) | React + Tailwind CSS | Публичный виджет записи |
| Frontend (админ) | React + Tailwind CSS | Панель управления |
| Backend API | Python 3.12 + FastAPI | REST API |
| ORM | SQLAlchemy 2.0 + Alembic | Работа с БД, миграции |
| База данных | PostgreSQL 16 | Хранение данных |
| Кэш/очереди | Redis + Celery | Фоновые задачи (уведомления) |
| Контейнеризация | Docker + Docker Compose | Деплой |
| Reverse Proxy | Nginx | SSL, CORS, статика |

---

## 🚀 Быстрый старт (Frontend MVP)

> Текущая версия — фронтенд-MVP с localStorage. Подходит для демо и прототипирования.

### Требования

- **Node.js** 20+ ([установить](https://nodejs.org/))
- **npm** 9+

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/your-org/checklis-booking.git
cd checklis-booking

# Установить зависимости
npm install
```

### Запуск в режиме разработки

```bash
npm run dev
```

Откройте в браузере:
- **Клиентский интерфейс:** http://localhost:5173/
- **Админ-панель:** http://localhost:5173/admin/

### Сборка для продакшена

```bash
npm run build
```

Результат в папке `dist/`. Можно хостить на любом статическом сервере:

```bash
# Предпросмотр продакшен-сборки
npm run preview

# Или через npx serve
npx serve dist -l 3000
```

### Сброс данных

Данные хранятся в `localStorage` браузера. Для сброса:

1. Откройте DevTools → Application → Local Storage
2. Удалите ключ `checklis-booking-storage`
3. Обновите страницу

---

## 🐳 Полный деплой (Backend + Frontend)

### Требования

- **Docker** 24+ и **Docker Compose** v2+
- Домен (опционально, для SSL)
- VPS от 1 vCPU / 1 GB RAM

### 1. Клонирование и настройка

```bash
git clone https://github.com/your-org/checklis-booking.git
cd checklis-booking

# Для запуска задайте секреты администратора:
# SECRET_KEY — случайная строка, ADMIN_PASSWORD — пароль тренеров.
cp .env.example .env
```

### 2. Заполнить `.env`

```bash
# --- База данных ---
POSTGRES_HOST=db
POSTGRES_PORT=5432
POSTGRES_DB=checklis
POSTGRES_USER=checklis_user
POSTGRES_PASSWORD=<сгенерируйте_пароль>

# --- Backend ---
SECRET_KEY=<сгенерируйте_ключ>
CORS_ORIGINS=https://your-domain.com,http://localhost:5173
ADMIN_PASSWORD=<пароль_для_админки>

# --- Telegram Bot ---
TELEGRAM_BOT_TOKEN=<токен_от_BotFather>
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/webhook/telegram

# --- Email (SMTP) ---
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=noreply@your-domain.com
SMTP_PASSWORD=<пароль>
SMTP_FROM="LIFE Studio <noreply@your-domain.com>"

# --- Redis ---
REDIS_URL=redis://redis:6379/0
```

### 3. Запуск через Docker Compose

```bash
# Собрать и запустить все сервисы одной командой
docker compose up -d

# Проверить статус
docker compose ps

# Посмотреть логи
docker compose logs -f backend
```

> При первом запуске PostgreSQL автоматически выполняет `backend/init.sql`, поэтому отдельная инициализация для демо-режима не требуется.

### 4. Инициализация базы данных (опционально)

```bash
# Применить миграции
docker compose exec backend alembic upgrade head

# Создать начальные данные (тренеры, типы занятий)
docker compose exec backend python -m app.seed
```

### 5. Настройка Nginx (SSL)

Файл `nginx/nginx.conf` уже настроен. Для SSL с Let's Encrypt:

```bash
# Установить certbot
sudo apt install certbot python3-certbot-nginx

# Получить сертификат
sudo certbot --nginx -d your-domain.com

# Автообновление
sudo certbot renew --dry-run
```

### 6. Проверка

```bash
# API health check
curl https://your-domain.com/api/health

# Должно вернуть:
# {"status": "ok", "version": "1.0.0"}
```

---

## 📁 Структура проекта

```
checklis-booking/
├── backend/                    # FastAPI Backend (для полного деплоя)
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── sessions.py     # GET /api/sessions
│   │   │   │   ├── bookings.py     # POST /api/bookings
│   │   │   │   ├── clients.py      # GET /api/clients
│   │   │   │   ├── admin.py        # Админские эндпоинты
│   │   │   │   └── webhooks.py     # Telegram webhooks
│   │   │   └── deps.py             # Зависимости (auth, db)
│   │   ├── core/
│   │   │   ├── config.py           # Настройки из .env
│   │   │   ├── security.py         # JWT, хеширование
│   │   │   └── database.py         # SQLAlchemy engine
│   │   ├── models/
│   │   │   ├── trainer.py
│   │   │   ├── class_type.py
│   │   │   ├── session.py
│   │   │   ├── client.py
│   │   │   ├── booking.py
│   │   │   └── pass.py
│   │   ├── schemas/                # Pydantic-схемы
│   │   ├── services/
│   │   │   ├── booking_service.py  # Логика записи + race conditions
│   │   │   ├── pass_service.py     # FIFO-списание абонементов
│   │   │   └── notification_service.py
│   │   ├── tasks/
│   │   │   └── notifications.py    # Celery-задачи
│   │   └── main.py                 # Точка входа FastAPI
│   ├── alembic/                    # Миграции БД
│   ├── requirements.txt
│   └── Dockerfile
│
├── src/                        # Frontend (React + Tailwind)
│   ├── components/
│   │   ├── widget/             # Публичный виджет
│   │   │   ├── Widget.tsx      # Календарь + список занятий
│   │   │   └── BookingForm.tsx # Форма записи
│   │   └── admin/              # Админ-панель
│   │       ├── AdminPanel.tsx  # Обёртка с навигацией
│   │       ├── ScheduleBoard.tsx    # Экран 1: Расписание
│   │       ├── SessionDetail.tsx    # Экран 2: Чек-ин
│   │       ├── ClientCRM.tsx       # Экран 3: CRM
│   │       └── NotificationsPanel.tsx
│   ├── store/
│   │   └── useStore.ts        # Zustand (localStorage)
│   ├── data/
│   │   └── mockData.ts        # Демо-данные
│   ├── types.ts               # TypeScript-типы
│   ├── App.tsx                # Роутинг
│   └── main.tsx               # Точка входа
│
├── nginx/
│   └── nginx.conf             # Конфигурация Nginx
│
├── docker-compose.yml         # Оркестрация сервисов
├── .env.example               # Шаблон переменных
├── package.json               # Frontend-зависимости
├── vite.config.js             # Vite-конфиг
└── README.md                  # Этот файл
```

---

## 📡 API Reference

### Публичные эндпоинты (виджет)

| Метод | URL | Описание |
|-------|-----|----------|
| `GET` | `/api/sessions` | Список занятий (фильтр по дате) |
| `GET` | `/api/sessions/{id}` | Детали занятия + заполненность |
| `POST` | `/api/bookings` | Создать запись |
| `GET` | `/api/clients/lookup?phone=...` | Поиск клиента по телефону |
| `POST` | `/api/clients` | Регистрация нового клиента |

### Админские эндпоинты

| Метод | URL | Описание |
|-------|-----|----------|
| `GET` | `/api/admin/sessions/week` | Расписание на неделю |
| `GET` | `/api/admin/sessions/{id}/bookings` | Список записей на занятие |
| `PUT` | `/api/admin/bookings/{id}/checkin` | Отметить статус (пришёл/отменил/no-show) |
| `POST` | `/api/admin/walkin` | Добавить walk-in клиента |
| `GET` | `/api/admin/clients?phone=...` | Поиск клиента |
| `GET` | `/api/admin/clients/{id}` | Карточка клиента |
| `POST` | `/api/admin/passes` | Выпустить абонемент |
| `GET` | `/api/admin/passes?client_id=...` | Абонементы клиента |
| `POST` | `/api/admin/notifications/send` | Ручная отправка уведомления |

### Примеры запросов

#### Запись на занятие

```bash
curl -X POST https://your-domain.com/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "client_phone": "+79161234567",
    "client_first_name": "Анна",
    "session_id": "s1",
    "notification_preference": "telegram",
    "telegram_id": "@anna_p"
  }'
```

#### Ответ (200 OK)

```json
{
  "booking_id": "b123",
  "status": "confirmed",
  "session": {
    "class_name": "Йога",
    "trainer": "Марта",
    "start_time": "2025-01-20T10:00:00Z",
    "spots_left": 7
  },
  "pass": {
    "remaining": 8,
    "total": 12
  }
}
```

#### Check-in (отметить приход)

```bash
curl -X PUT https://your-domain.com/api/admin/bookings/b123/checkin \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

---

## 🗄 База данных

### Схема (PostgreSQL)

```sql
-- Тренеры
CREATE TABLE trainers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Типы занятий
CREATE TABLE class_types (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             VARCHAR(100) NOT NULL,
    description      TEXT,
    duration_minutes INT NOT NULL,
    max_capacity     INT NOT NULL,
    color_code       VARCHAR(7) DEFAULT '#E11D48'
);

-- Расписание (занятия)
CREATE TABLE class_sessions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_type_id UUID REFERENCES class_types(id),
    trainer_id    UUID REFERENCES trainers(id),
    start_time    TIMESTAMPTZ NOT NULL,
    end_time      TIMESTAMPTZ NOT NULL,
    is_active     BOOLEAN DEFAULT TRUE
);

-- Клиенты
CREATE TABLE clients (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name              VARCHAR(100) NOT NULL,
    last_name               VARCHAR(100),
    phone                   VARCHAR(20) UNIQUE NOT NULL,
    email                   VARCHAR(255),
    telegram_id             VARCHAR(100),
    notification_preference VARCHAR(20) DEFAULT 'none'
        CHECK (notification_preference IN ('telegram', 'email', 'none')),
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Статусы записи
CREATE TABLE booking_statuses (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL
    -- confirmed, waitlist, cancelled_client,
    -- cancelled_admin, completed, no_show
);

-- Записи (бронирования)
CREATE TABLE bookings (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id    UUID REFERENCES clients(id),
    session_id   UUID REFERENCES class_sessions(id),
    status_id    INT REFERENCES booking_statuses(id),
    booked_at    TIMESTAMPTZ DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    notes        TEXT,
    UNIQUE (client_id, session_id)  -- Один клиент = одна запись на занятие
);

-- Абонементы
CREATE TABLE passes (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id        UUID REFERENCES clients(id),
    total_visits     INT NOT NULL,
    remaining_visits INT NOT NULL,
    start_date       DATE NOT NULL,
    end_date         DATE NOT NULL,
    status           VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('active', 'expired', 'exhausted')),
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Уведомления
CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id  UUID REFERENCES clients(id),
    session_id UUID REFERENCES class_sessions(id),
    type       VARCHAR(30) NOT NULL,
    channel    VARCHAR(20) NOT NULL,
    message    TEXT,
    sent_at    TIMESTAMPTZ DEFAULT NOW(),
    status     VARCHAR(20) DEFAULT 'pending'
);

-- Индексы для производительности
CREATE INDEX idx_sessions_start ON class_sessions(start_time);
CREATE INDEX idx_bookings_session ON bookings(session_id);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_passes_client ON passes(client_id, status);
CREATE INDEX idx_clients_phone ON clients(phone);
```

### Логика FIFO-списания

При смене статуса записи на `completed` или `no_show`:

```python
def deduct_visit(client_id: UUID, db: Session):
    """Списать 1 посещение с самого старого активного абонемента (FIFO)."""
    pass_ = db.query(Pass).filter(
        Pass.client_id == client_id,
        Pass.status == 'active',
        Pass.remaining_visits > 0,
        Pass.end_date >= date.today()
    ).order_by(Pass.start_date.asc()).first()

    if pass_:
        pass_.remaining_visits -= 1
        if pass_.remaining_visits == 0:
            pass_.status = 'exhausted'
        db.commit()
        return True
    return False  # Нет активного абонемента → оплата на месте
```

### Защита от race conditions

```python
from sqlalchemy import select

def create_booking(session_id: UUID, client_id: UUID, db: Session):
    """Атомарная запись с блокировкой строки."""
    with db.begin():
        # Блокируем строку занятия
        session = db.execute(
            select(ClassSession)
            .where(ClassSession.id == session_id)
            .with_for_update()  # SELECT ... FOR UPDATE
        ).scalar_one()

        # Считаем текущую заполненность
        count = db.execute(
            select(func.count())
            .select_from(Booking)
            .where(
                Booking.session_id == session_id,
                Booking.status_id.in_([CONFIRMED, WAITLIST])
            )
        ).scalar()

        class_type = session.class_type
        if count >= class_type.max_capacity:
            raise HTTPException(409, "Мест нет")

        # Создаём запись
        booking = Booking(
            client_id=client_id,
            session_id=session_id,
            status_id=CONFIRMED
        )
        db.add(booking)
```

### Миграции (Alembic)

```bash
# Создать новую миграцию
docker compose exec backend alembic revision --autogenerate -m "description"

# Применить миграции
docker compose exec backend alembic upgrade head

# Откатить последнюю миграцию
docker compose exec backend alembic downgrade -1
```

---

## 🔔 Уведомления

### Триггеры

| Событие | Канал | Текст |
|---------|-------|-------|
| Запись на тренировку | Telegram / Email | «Вы записаны на {класс} {дата} в {время}» |
| За 2 часа до тренировки | Telegram / Email | «Напоминание: {класс} через 2 часа. Ждём вас!» |
| Активация абонемента | Telegram / Email | «Абонемент активирован: {N} посещений до {дата}» |
| Покупка абонемента | Telegram / Email | «Новый абонемент: {N} посещений, действует до {дата}» |

### Настройка Telegram Bot

1. Создать бота через [@BotFather](https://t.me/BotFather)
2. Получить токен: `123456:ABC-DEF...`
3. Указать токен в `.env`: `TELEGRAM_BOT_TOKEN`
4. Клиент должен написать боту `/start` для привязки

```python
# Отправка через Telegram Bot API
import httpx

async def send_telegram(telegram_id: str, message: str):
    async with httpx.AsyncClient() as client:
        await client.post(
            f"https://api.telegram.org/bot{TOKEN}/sendMessage",
            json={"chat_id": telegram_id, "text": message, "parse_mode": "HTML"}
        )
```

### Настройка SMTP (Email)

Поддерживаемые провайдеры:

| Провайдер | SMTP_HOST | SMTP_PORT |
|-----------|-----------|-----------|
| Яндекс | `smtp.yandex.ru` | 465 |
| Gmail | `smtp.gmail.com` | 587 |
| Mail.ru | `smtp.mail.ru` | 465 |
| SendGrid | `smtp.sendgrid.net` | 587 |

### Фоновые задачи (Celery + Redis)

```bash
# Запуск Celery worker
docker compose exec backend celery -A app.tasks worker -l info

# Запуск Celery Beat (планировщик)
docker compose exec backend celery -A app.tasks beat -l info
```

Расписание:
- Каждые 15 минут — проверка напоминаний за 2 часа
- Каждую ночь — деактивация просроченных абонементов

---

## 🖼 iFrame-виджет

### Встраивание на сайт

```html
<!-- На сайте фитнес-студии -->
<iframe
  src="https://your-domain.com/widget"
  width="100%"
  height="800"
  frameborder="0"
  style="border: none; border-radius: 16px;"
  title="Запись на тренировку"
></iframe>
```

### Настройка CORS (Nginx)

```nginx
# nginx/nginx.conf
location /widget {
    add_header X-Frame-Options "ALLOWALL";
    add_header Content-Security-Policy "frame-ancestors *;";

    # CORS для API
    add_header Access-Control-Allow-Origin $cors_origin;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization";
}
```

### Коммуникация виджет ↔ родительская страница

```javascript
// Виджет отправляет событие родителю
window.parent.postMessage({
  type: 'booking_success',
  data: { sessionId: 's1', clientName: 'Анна' }
}, '*');

// Родительская страница слушает
window.addEventListener('message', (event) => {
  if (event.data.type === 'booking_success') {
    console.log('Клиент записан:', event.data.data);
  }
});
```

---

## ⚙️ Переменные окружения

| Переменная | Обязательная | Описание | Пример |
|-----------|:---:|-----------|---------|
| `POSTGRES_HOST` | ✅ | Хост БД | `db` |
| `POSTGRES_PORT` | | Порт БД | `5432` |
| `POSTGRES_DB` | ✅ | Имя базы | `checklis` |
| `POSTGRES_USER` | ✅ | Пользователь БД | `checklis_user` |
| `POSTGRES_PASSWORD` | ✅ | Пароль БД | `***` |
| `SECRET_KEY` | ✅ | Секретный ключ JWT | `openssl rand -hex 32` |
| `CORS_ORIGINS` | ✅ | Разрешённые домены | `https://life.ru` |
| `ADMIN_PASSWORD` | ✅ | Пароль админки | `***` |
| `TELEGRAM_BOT_TOKEN` | | Токен Telegram-бота | `123456:ABC...` |
| `SMTP_HOST` | | SMTP-сервер | `smtp.yandex.ru` |
| `SMTP_PORT` | | Порт SMTP | `465` |
| `SMTP_USER` | | Логин SMTP | `noreply@life.ru` |
| `SMTP_PASSWORD` | | Пароль SMTP | `***` |
| `REDIS_URL` | | URL Redis | `redis://redis:6379/0` |

---

## 🤖 CI/CD (GitHub Actions)

### Обзор workflow

Проект использует два GitHub Actions workflow:

| Workflow | Файл | Триггер | Назначение |
|----------|------|---------|------------|
| **CI** | `.github/workflows/ci.yml` | `pull_request`, `push` в `main` | Линт, тесты, проверка сборки |
| **Release** | `.github/workflows/release.yml` | `push` тега `v*`, `release` | Сборка Docker, публикация артефактов |

### CI Workflow (`.github/workflows/ci.yml`)

Запускается при каждом PR и push в main:

```
┌─────────────────┐    ┌─────────────────┐
│  Frontend       │    │  Backend        │
│  (lint + build) │    │  (lint + tests) │
└────────┬────────┘    └────────┬────────┘
         │                      │
         └──────────┬───────────┘
                    │
         ┌──────────▼──────────┐
         │  Docker build check │  (только для PR)
         └─────────────────────┘
```

**Jobs:**
- `frontend` — `npm ci`, `tsc --noEmit`, `npm run build`, upload `dist/`
- `backend` — `pip install`, `ruff check`, `mypy`, `pytest` (с PostgreSQL)
- `docker` — проверка сборки образов (только в PR)

### Release Workflow (`.github/workflows/release.yml`)

Запускается при создании тега `v*` или публикации релиза:

```
┌──────────────┐
│  meta        │  Определение версии
└──────┬───────┘
       │
  ┌────┴────────────────────────┐
  │                             │
┌─▼──────────┐  ┌────────────┐  │
│ build-     │  │ build-     │  │
│ frontend   │  │ configs    │  │
└─────┬──────┘  └─────┬──────┘  │
      │               │         │
      │    ┌──────────▼─────────▼──────┐
      │    │  docker-backend           │
      │    │  docker-frontend          │
      │    │  docker-nginx             │
      │    └──────────┬────────────────┘
      │               │
      └───────┬───────┘
              │
       ┌──────▼──────┐
       │  release    │  GitHub Release + artifacts
       └──────┬──────┘
              │
       ┌──────▼──────┐
       │  summary    │  Итоговая сводка
       └─────────────┘
```

**Результат:**

1. **Docker-образы** публикуются в GitHub Container Registry:
   ```
   ghcr.io/<owner>/checklis-backend:<version>
   ghcr.io/<owner>/checklis-frontend:<version>
   ghcr.io/<owner>/checklis-nginx:<version>
   ```

2. **Артефакты** прикрепляются к GitHub Release:
   - `checklis-frontend-<version>.tar.gz` — собранный frontend
   - `checklis-deploy-<version>.tar.gz` — configs + docker-compose + SQL

3. **Теги образов:**
   - `latest` — для релизных тегов
   - `1.2.3`, `1.2`, `1` — semver
   - `sha-abc1234` — по commit SHA
   - `main` — для push в main

### Создание релиза

```bash
# 1. Обновить версию
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0

# 2. Или через GitHub UI:
# Releases → Draft a new release → Choose a tag → Publish
```

### Альтернатива: ручной запуск

В GitHub UI: **Actions → Release → Run workflow** → указать тег.

### Секреты (не требуются для базовой работы)

| Secret | Назначение |
|--------|-----------|
| `GITHUB_TOKEN` | Автоматически предоставляется GitHub |
| `DOCKERHUB_TOKEN` | Опционально, для публикации в Docker Hub |
| `DEPLOY_SSH_KEY` | Опционально, для автодеплоя на сервер |

### Локальная проверка workflow

```bash
# Установить act (https://github.com/nektos/act)
brew install act  # или curl https://raw.githubusercontent.com/nektos/act/master/install.sh | bash

# Запустить CI локально
act pull_request

# Запустить только frontend job
act -j frontend
```

---

## 🛠 Makefile

Для удобства работы с проектом создан `Makefile`. Основные команды:

### Разработка

```bash
make help          # Показать все доступные команды
make install       # Установить зависимости frontend
make dev           # Запустить frontend в dev-режиме
make build         # Собрать frontend
make env-setup     # Создать .env из шаблона
```

### Docker Compose

```bash
make up            # Запустить все сервисы
make up-dev        # Запустить только БД и Redis
make down          # Остановить все сервисы
make down-volumes  # Остановить и удалить volumes
make logs          # Показать логи
make logs-backend  # Логи backend
make restart       # Перезапустить сервисы
```

### База данных

```bash
make db-init       # Инициализировать БД (init.sql)
make db-migrate    # Применить миграции Alembic
make db-seed       # Заполнить начальными данными
make db-shell      # Открыть psql shell
make db-reset      # Полный сброс и пересоздание БД
```

### Тестирование

```bash
make test          # Запустить все тесты
make test-frontend # Тесты frontend
make test-backend  # Тесты backend
make lint          # Линтеры (tsc + ruff)
make ci-check      # Полная проверка перед push
```

### Docker Build

```bash
make docker-build          # Собрать все образы
make docker-build-backend  # Только backend
make docker-build-frontend # Только frontend
make docker-build-nginx    # Только nginx
```

### Релиз

```bash
make release VERSION=v1.0.0        # Создать тег и push
make release-build VERSION=v1.0.0  # Собрать и запушить образы в GHCR
```

### Утилиты

```bash
make clean          # Очистить временные файлы
make shell-backend  # Shell в backend-контейнере
make status         # Статус сервисов + URL
```

---

## 🔧 Troubleshooting

### Виджет не загружается в iFrame

**Проблема:** Браузер блокирует отображение.

**Решение:** Проверьте заголовки Nginx:
```bash
curl -I https://your-domain.com/widget
# Должно быть: X-Frame-Options: ALLOWALL
```

### Запись не проходит — «Мест нет»

**Проблема:** Race condition при одновременных записях.

**Решение:** Убедитесь, что используется `SELECT ... FOR UPDATE` в `booking_service.py`.

### Уведомления не приходят

**Проверка:**
```bash
# Логи Celery
docker compose logs celery-worker

# Проверка Redis
docker compose exec redis redis-cli ping
# Должно вернуть: PONG

# Проверка Telegram-бота
curl https://api.telegram.org/bot<TOKEN>/getMe
```

### Сброс всех данных

```bash
# Остановить сервисы
docker compose down

# Удалить volumes (БД, Redis)
docker compose down -v

# Перезапустить
docker compose up -d --build

# Переинициализировать БД
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.seed
```

### Миграции не применяются

```bash
# Проверить текущую версию
docker compose exec backend alembic current

# Принудительно обновить
docker compose exec backend alembic upgrade head

# Если ошибка — откатить и повторить
docker compose exec backend alembic downgrade base
docker compose exec backend alembic upgrade head
```

---

## 📄 Лицензия

MIT © 2025 CheckLis Booking

---

## 👥 Контакты

- **Разработка:** [your-email@example.com](mailto:your-email@example.com)
- **Telegram:** [@your_handle](https://t.me/your_handle)
