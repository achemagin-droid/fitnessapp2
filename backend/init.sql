-- CheckLis Booking Database Initialization
-- LIFE Fitness Studio

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trainers table
CREATE TABLE IF NOT EXISTS trainers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Class types table
CREATE TABLE IF NOT EXISTS class_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    max_capacity INTEGER NOT NULL,
    color_code VARCHAR(7) DEFAULT '#E11D48'
);

-- Class sessions table
CREATE TABLE IF NOT EXISTS class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_type_id UUID REFERENCES class_types(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    telegram_id VARCHAR(100),
    notification_preference VARCHAR(20) DEFAULT 'none',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Booking statuses table
CREATE TABLE IF NOT EXISTS booking_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL
);

-- Insert default booking statuses
INSERT INTO booking_statuses (id, name) VALUES
    (1, 'confirmed'),
    (2, 'waitlist'),
    (3, 'cancelled_client'),
    (4, 'cancelled_admin'),
    (5, 'completed'),
    (6, 'no_show')
ON CONFLICT (id) DO NOTHING;

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES class_sessions(id) ON DELETE CASCADE,
    status_id INTEGER REFERENCES booking_statuses(id),
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    notes TEXT,
    UNIQUE(client_id, session_id)
);

-- Passes (subscriptions) table
CREATE TABLE IF NOT EXISTS passes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    total_visits INTEGER NOT NULL,
    remaining_visits INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    session_id UUID REFERENCES class_sessions(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending'
);

-- Insert initial trainers
INSERT INTO trainers (name, description, is_active) VALUES
    ('Марта', 'Йога, Пилатес, Растяжка', TRUE),
    ('Алексей', 'Силовые тренировки, Кроссфит', TRUE),
    ('Елена', 'Танцы, Zumba, Stretching', TRUE)
ON CONFLICT DO NOTHING;

-- Insert initial class types
INSERT INTO class_types (name, description, duration_minutes, max_capacity, color_code) VALUES
    ('Йога', 'Хатха-йога для всех уровней', 60, 12, '#10B981'),
    ('Пилатес', 'Укрепление мышечного корсета', 55, 10, '#8B5CF6'),
    ('Силовая', 'Тренировка с весом', 60, 8, '#F59E0B'),
    ('Растяжка', 'Гибкость и мобильность', 45, 15, '#EC4899'),
    ('Zumba', 'Танцевальный фитнес', 60, 20, '#3B82F6'),
    ('Кроссфит', 'Функциональный тренинг', 60, 8, '#EF4444')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_class_sessions_start_time ON class_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_class_sessions_trainer ON class_sessions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_session ON bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status_id);
CREATE INDEX IF NOT EXISTS idx_passes_client ON passes(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_client ON notifications(client_id);

-- Function to deduct visit from pass (FIFO)
CREATE OR REPLACE FUNCTION deduct_pass_visit(p_client_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_pass_id UUID;
    v_remaining INTEGER;
BEGIN
    -- Find oldest active pass with remaining visits
    SELECT id, remaining_visits INTO v_pass_id, v_remaining
    FROM passes
    WHERE client_id = p_client_id
      AND status = 'active'
      AND remaining_visits > 0
      AND end_date >= CURRENT_DATE
    ORDER BY start_date ASC
    LIMIT 1;

    IF v_pass_id IS NULL THEN
        RETURN FALSE; -- No active pass found
    END IF;

    -- Deduct one visit
    UPDATE passes
    SET remaining_visits = remaining_visits - 1,
        status = CASE WHEN remaining_visits - 1 = 0 THEN 'exhausted' ELSE status END
    WHERE id = v_pass_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-deduct pass on booking completion
CREATE OR REPLACE FUNCTION auto_deduct_pass_on_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changed to completed or no_show, deduct pass
    IF NEW.status_id IN (5, 6) AND (OLD.status_id IS NULL OR OLD.status_id NOT IN (5, 6)) THEN
        PERFORM deduct_pass_visit(NEW.client_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_booking_completion ON bookings;
CREATE TRIGGER trg_booking_completion
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION auto_deduct_pass_on_completion();
