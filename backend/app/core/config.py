from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://campuscarpool:campuscarpool@localhost:5432/campuscarpool"
    JWT_SECRET: str = "change-this-to-a-strong-random-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    COLLEGE_EMAIL_DOMAINS: str = "sctce.ac.in,ac.in,college.ac.in,college.edu,university.edu,edu"
    ENVIRONMENT: str = "development"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    @property
    def college_email_domains_list(self) -> List[str]:
        return [d.strip() for d in self.COLLEGE_EMAIL_DOMAINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
