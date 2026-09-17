-- ============================================
-- CheckLis Booking — Инициализация базы данных
-- Запуск: psql -U checklis_user -d checklis -f init.sql
-- ============================================

-- Расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- для поиска по телефону

-- ============================================
-- Таблица: Тренеры
-- ============================================
CREATE TABLE IF NOT EXISTS trainers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trainers_active ON trainers(is_active);

-- Учётные записи тренеров для админ-панели
CREATE TABLE IF NOT EXISTS trainer_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id UUID NOT NULL UNIQUE REFERENCES trainers(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Таблица: Типы занятий
-- ============================================
CREATE TABLE IF NOT EXISTS class_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL,
    max_capacity INT NOT NULL,
    color_code VARCHAR(7) DEFAULT '#E11D48'
);

-- ============================================
-- Таблица: Занятия (расписание)
-- ============================================
CREATE TABLE IF NOT EXISTS class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_type_id UUID NOT NULL REFERENCES class_types(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_sessions_start ON class_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON class_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_trainer ON class_sessions(trainer_id);

-- ============================================
-- Таблица: Клиенты
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    telegram_id VARCHAR(100),
    notification_preference VARCHAR(20) DEFAULT 'none'
        CHECK (notification_preference IN ('telegram', 'email', 'none')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_phone_trgm ON clients USING gin (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_telegram ON clients(telegram_id) WHERE telegram_id IS NOT NULL;

-- ============================================
-- Таблица: Статусы записей
-- ============================================
CREATE TABLE IF NOT EXISTS booking_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL
);

-- Заполняем статусы
INSERT INTO booking_statuses (id, name) VALUES
    (1, 'confirmed'),
    (2, 'waitlist'),
    (3, 'cancelled_client'),
    (4, 'cancelled_admin'),
    (5, 'completed'),
    (6, 'no_show')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Таблица: Записи (бронирования)
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
    status_id INT NOT NULL DEFAULT 1 REFERENCES booking_statuses(id),
    booked_at TIMESTAMPTZ DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    notes TEXT,
    UNIQUE (client_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_bookings_session ON bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status_id);
CREATE INDEX IF NOT EXISTS idx_bookings_session_active ON bookings(session_id, status_id)
    WHERE status_id IN (1, 2);  -- Для быстрого подсчёта заполненности

-- ============================================
-- Таблица: Абонементы
-- ============================================
CREATE TABLE IF NOT EXISTS passes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    total_visits INT NOT NULL,
    remaining_visits INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('active', 'expired', 'exhausted')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_passes_client ON passes(client_id);
CREATE INDEX IF NOT EXISTS idx_passes_active ON passes(client_id, status, remaining_visits)
    WHERE status = 'active' AND remaining_visits > 0;  -- Для FIFO-списания

-- ============================================
-- Таблица: Уведомления
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES class_sessions(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_notifications_client ON notifications(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notifications(sent_at);

-- ============================================
-- Начальные данные: Тренеры
-- ============================================
INSERT INTO trainers (name, description, is_active) VALUES
    ('Марта', 'Йога, Пилатес, Растяжка', TRUE),
    ('Алексей', 'Силовые тренировки, Кроссфит', TRUE),
    ('Елена', 'Танцы, Zumba, Stretching', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================
-- Начальные данные: Типы занятий
-- ============================================
INSERT INTO class_types (name, description, duration_minutes, max_capacity, color_code) VALUES
    ('Йога', 'Хатха-йога для всех уровней', 60, 12, '#10B981'),
    ('Пилатес', 'Укрепление мышечного корсета', 55, 10, '#8B5CF6'),
    ('Силовая', 'Тренировка с весом', 60, 8, '#F59E0B'),
    ('Растяжка', 'Гибкость и мобильность', 45, 15, '#EC4899'),
    ('Zumba', 'Танцевальный фитнес', 60, 20, '#3B82F6'),
    ('Кроссфит', 'Функциональный тренинг', 60, 8, '#EF4444')
ON CONFLICT DO NOTHING;

-- ============================================
-- Функция: списание абонемента (FIFO)
-- ============================================
CREATE OR REPLACE FUNCTION deduct_pass_visit(p_client_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_pass_id UUID;
    v_remaining INT;
BEGIN
    -- Находим самый старый активный абонемент
    SELECT id, remaining_visits
    INTO v_pass_id, v_remaining
    FROM passes
    WHERE client_id = p_client_id
      AND status = 'active'
      AND remaining_visits > 0
      AND end_date >= CURRENT_DATE
    ORDER BY start_date ASC
    LIMIT 1;

    IF v_pass_id IS NULL THEN
        RETURN FALSE;  -- Нет активного абонемента
    END IF;

    -- Списываем посещение
    UPDATE passes
    SET remaining_visits = remaining_visits - 1,
        status = CASE WHEN remaining_visits - 1 = 0 THEN 'exhausted' ELSE status END
    WHERE id = v_pass_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Функция: автообновление статуса записи
-- ============================================
CREATE OR REPLACE FUNCTION update_booking_status_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- При завершении или no-show — списываем абонемент
    IF NEW.status_id IN (5, 6) AND OLD.status_id NOT IN (5, 6) THEN
        PERFORM deduct_pass_visit(NEW.client_id);
    END IF;

    -- При отмене — обновляем cancelled_at
    IF NEW.status_id IN (3, 4) AND OLD.status_id NOT IN (3, 4) THEN
        NEW.cancelled_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер
DROP TRIGGER IF EXISTS trg_booking_status_update ON bookings;
CREATE TRIGGER trg_booking_status_update
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_booking_status_trigger();

-- ============================================
-- Функция: автодеактивация просроченных абонементов
-- ============================================
CREATE OR REPLACE FUNCTION deactivate_expired_passes()
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE passes
    SET status = 'expired'
    WHERE status = 'active'
      AND end_date < CURRENT_DATE;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Представление: статистика по занятиям
-- ============================================
CREATE OR REPLACE VIEW session_stats AS
SELECT
    s.id AS session_id,
    ct.name AS class_name,
    t.name AS trainer_name,
    s.start_time,
    s.end_time,
    COUNT(CASE WHEN b.status_id IN (1, 2) THEN 1 END) AS confirmed_count,
    COUNT(CASE WHEN b.status_id = 5 THEN 1 END) AS completed_count,
    COUNT(CASE WHEN b.status_id = 6 THEN 1 END) AS no_show_count,
    ct.max_capacity,
    ct.max_capacity - COUNT(CASE WHEN b.status_id IN (1, 2) THEN 1 END) AS spots_left
FROM class_sessions s
JOIN class_types ct ON s.class_type_id = ct.id
JOIN trainers t ON s.trainer_id = t.id
LEFT JOIN bookings b ON s.id = b.session_id
WHERE s.is_active = TRUE
GROUP BY s.id, ct.name, t.name, s.start_time, s.end_time, ct.max_capacity;

-- ============================================
-- Представление: карточка клиента
-- ============================================
CREATE OR REPLACE VIEW client_summary AS
SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.phone,
    c.email,
    c.telegram_id,
    c.notification_preference,
    COALESCE(SUM(p.total_visits), 0) AS total_purchased,
    COALESCE(SUM(p.remaining_visits), 0) AS total_remaining,
    COUNT(DISTINCT CASE WHEN b.status_id = 5 THEN b.id END) AS visits_completed,
    COUNT(DISTINCT CASE WHEN b.status_id = 6 THEN b.id END) AS visits_no_show
FROM clients c
LEFT JOIN passes p ON c.id = p.client_id
LEFT JOIN bookings b ON c.id = b.client_id
GROUP BY c.id;

-- ============================================
-- Готово!
-- ============================================
-- Для проверки:
-- SELECT * FROM session_stats WHERE start_time >= NOW() ORDER BY start_time LIMIT 10;
-- SELECT * FROM client_summary ORDER BY visits_completed DESC LIMIT 10;
