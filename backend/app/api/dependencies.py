from typing import Generator
from sqlalchemy.orm import Session
from app.database import get_db


def get_database_session() -> Generator[Session, None, None]:
    """Dependency for getting database session"""
    yield from get_db()
