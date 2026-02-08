from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    database_url: Optional[str] = None
    postgres_user: Optional[str] = None
    postgres_password: Optional[str] = None
    postgres_db: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = False

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Construct database_url from components if not provided
        if not self.database_url and all([self.postgres_user, self.postgres_password, self.postgres_db]):
            self.database_url = f"postgresql://{self.postgres_user}:{self.postgres_password}@localhost:5432/{self.postgres_db}"


settings = Settings()
