"""Модели SQLAlchemy для базы данных."""
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class Trainer(Base):
    __tablename__ = "trainers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("ClassSession", back_populates="trainer")


class ClassType(Base):
    __tablename__ = "class_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    duration_minutes = Column(Integer, nullable=False)
    max_capacity = Column(Integer, nullable=False)
    color_code = Column(String(7), default="#E11D48")

    sessions = relationship("ClassSession", back_populates="class_type")


class ClassSession(Base):
    __tablename__ = "class_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    class_type_id = Column(UUID(as_uuid=True), ForeignKey("class_types.id"), nullable=False)
    trainer_id = Column(UUID(as_uuid=True), ForeignKey("trainers.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)

    class_type = relationship("ClassType", back_populates="sessions")
    trainer = relationship("Trainer", back_populates="sessions")
    bookings = relationship("Booking", back_populates="session")


class Client(Base):
    __tablename__ = "clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100))
    phone = Column(String(20), unique=True, nullable=False)
    email = Column(String(255))
    telegram_id = Column(String(100))
    notification_preference = Column(String(20), default="none")
    created_at = Column(DateTime, default=datetime.utcnow)

    bookings = relationship("Booking", back_populates="client")
    passes = relationship("Pass", back_populates="client")

    __table_args__ = (
        CheckConstraint("notification_preference IN ('telegram', 'email', 'none')"),
    )


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    session_id = Column(UUID(as_uuid=True), ForeignKey("class_sessions.id"), nullable=False)
    status_id = Column(Integer, ForeignKey("booking_statuses.id"), nullable=False, default=1)
    booked_at = Column(DateTime, default=datetime.utcnow)
    cancelled_at = Column(DateTime)
    notes = Column(Text)

    client = relationship("Client", back_populates="bookings")
    session = relationship("ClassSession", back_populates="bookings")

    __table_args__ = (
        UniqueConstraint("client_id", "session_id", name="uq_client_session"),
    )


class BookingStatus(Base):
    __tablename__ = "booking_statuses"

    id = Column(Integer, primary_key=True)
    name = Column(String(30), unique=True, nullable=False)


class Pass(Base):
    __tablename__ = "passes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    total_visits = Column(Integer, nullable=False)
    remaining_visits = Column(Integer, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="passes")

    __table_args__ = (
        CheckConstraint("status IN ('active', 'expired', 'exhausted')"),
    )


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    session_id = Column(UUID(as_uuid=True), ForeignKey("class_sessions.id"))
    type = Column(String(30), nullable=False)
    channel = Column(String(20), nullable=False)
    message = Column(Text)
    sent_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="pending")
