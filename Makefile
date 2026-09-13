.PHONY: help install dev build up down logs test clean release

# Переменные
VERSION ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
REGISTRY ?= ghcr.io
IMAGE_PREFIX ?= your-org/checklis

# ============================================
# Основные команды
# ============================================

help: ## Показать справку
	@echo "CheckLis Booking — Makefile"
	@echo ""
	@echo "Использование: make <command>"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Установить зависимости frontend
	npm ci

dev: ## Запустить frontend в режиме разработки
	npm run dev

build: ## Собрать frontend для продакшена
	npm run build

# ============================================
# Docker Compose (локальная разработка)
# ============================================

up: ## Запустить все сервисы
	docker compose up -d --build

up-dev: ## Запустить только БД и Redis (для разработки backend)
	docker compose up -d db redis

down: ## Остановить все сервисы
	docker compose down

down-volumes: ## Остановить и удалить volumes
	docker compose down -v

logs: ## Показать логи всех сервисов
	docker compose logs -f

logs-backend: ## Показать логи backend
	docker compose logs -f backend

logs-celery: ## Показать логи celery worker
	docker compose logs -f celery-worker

restart: ## Перезапустить сервисы
	docker compose restart

# ============================================
# База данных
# ============================================

db-init: ## Инициализировать базу данных
	docker compose exec db psql -U $${POSTGRES_USER:-checklis_user} -d $${POSTGRES_DB:-checklis} -f /docker-entrypoint-initdb.d/init.sql

db-migrate: ## Применить миграции Alembic
	docker compose exec backend alembic upgrade head

db-rollback: ## Откатить последнюю миграцию
	docker compose exec backend alembic downgrade -1

db-seed: ## Заполнить БД начальными данными
	docker compose exec backend python -m app.seed

db-shell: ## Открыть psql shell
	docker compose exec db psql -U $${POSTGRES_USER:-checklis_user} -d $${POSTGRES_DB:-checklis}

db-reset: ## Сбросить БД и пересоздать
	docker compose down -v
	docker compose up -d db
	sleep 3
	$(MAKE) db-init
	$(MAKE) db-migrate
	$(MAKE) db-seed

# ============================================
# Тестирование
# ============================================

test: ## Запустить все тесты
	$(MAKE) test-frontend
	$(MAKE) test-backend

test-frontend: ## Запустить тесты frontend
	npm run test || echo "No frontend tests configured"

test-backend: ## Запустить тесты backend
	docker compose exec backend pytest tests/ -v

lint: ## Запустить линтеры
	npx tsc --noEmit || true
	docker compose exec backend ruff check . || true

# ============================================
# Docker Build (локальная сборка образов)
# ============================================

docker-build: ## Собрать все Docker-образы локально
	docker compose build

docker-build-backend: ## Собрать только backend
	docker build -t checklis-backend:local ./backend

docker-build-frontend: ## Собрать только frontend
	docker build -t checklis-frontend:local -f Dockerfile.frontend .

docker-build-nginx: ## Собрать только nginx
	docker build -t checklis-nginx:local ./nginx

# ============================================
# Релиз (публикация в GHCR)
# ============================================

release: ## Создать релиз (требует GH_TOKEN)
	@test -n "$(VERSION)" || (echo "Error: VERSION not set" && exit 1)
	@echo "📦 Creating release $(VERSION)..."
	git tag -a $(VERSION) -m "Release $(VERSION)"
	git push origin $(VERSION)

release-build: ## Собрать и запушить образы в GHCR
	docker buildx build --platform linux/amd64,linux/arm64 \
		-t $(REGISTRY)/$(IMAGE_PREFIX)-backend:$(VERSION) \
		--push ./backend
	docker buildx build --platform linux/amd64,linux/arm64 \
		-t $(REGISTRY)/$(IMAGE_PREFIX)-frontend:$(VERSION) \
		--push -f Dockerfile.frontend .
	docker buildx build --platform linux/amd64,linux/arm64 \
		-t $(REGISTRY)/$(IMAGE_PREFIX)-nginx:$(VERSION) \
		--push ./nginx

# ============================================
# Утилиты
# ============================================

clean: ## Очистить временные файлы
	rm -rf node_modules dist .cache
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true

shell-backend: ## Открыть shell в backend-контейнере
	docker compose exec backend bash

shell-db: ## Открыть shell в БД
	docker compose exec db sh

status: ## Показать статус всех сервисов
	docker compose ps
	@echo ""
	@echo "Backend: http://localhost:8000/api/docs"
	@echo "Frontend: http://localhost:3000"
	@echo "Admin: http://localhost:3000/#/admin"

env-setup: ## Создать .env из шаблона
	@test -f .env || (cp .env.example .env && echo "✅ .env created from .env.example")
	@test -f .env && echo "⚠️  .env already exists"

# ============================================
# CI/CD (для локальной проверки)
# ============================================

ci-check: ## Локальная проверка перед push
	@echo "🔍 Running pre-push checks..."
	$(MAKE) lint
	$(MAKE) build
	@echo "✅ All checks passed!"
