"""Управление видами занятий для админ-панели."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.routes.auth import verify_admin
from app.core.database import get_db
from app.models.models import ClassType

router = APIRouter()


class ClassTypeCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


@router.get("/class-types")
def list_class_types(_: object = Depends(verify_admin), db: Session = Depends(get_db)):
    types = db.query(ClassType).filter(ClassType.is_mock.is_(False)).order_by(ClassType.name).all()
    return {"class_types": [
        {"id": str(item.id), "name": item.name, "description": item.description or "",
         "duration_minutes": item.duration_minutes, "max_capacity": item.max_capacity,
         "color_code": item.color_code or "#E11D48", "is_mock": False}
        for item in types
    ]}


@router.post("/class-types", status_code=201)
def create_class_type(data: ClassTypeCreate, _: object = Depends(verify_admin), db: Session = Depends(get_db)):
    name = data.name.strip()
    existing = db.query(ClassType).filter(ClassType.name.ilike(name)).first()
    if existing:
        raise HTTPException(status_code=409, detail="Такой вид занятия уже существует")
    item = ClassType(
        name=name, description=None, duration_minutes=60, max_capacity=10,
        color_code="#E11D48", is_mock=False,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": str(item.id), "name": item.name, "description": "", "duration_minutes": item.duration_minutes,
            "max_capacity": item.max_capacity, "color_code": item.color_code, "is_mock": False}
