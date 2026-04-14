import pathlib
from pydantic_settings import BaseSettings
from pydantic import Field, SecretStr
from dotenv import load_dotenv


load_dotenv()

ROOT_DIR: pathlib.Path = pathlib.Path(__file__).parent.parent.parent.parent.parent.resolve()
# print("ROOT_DIR", ROOT_DIR)

class Settings(BaseSettings):
    DATABASE_URL_ASYNC: str = Field(
        # default="postgresql+asyncpg://postgres:qtrm&2*Q@localhost:5432/gisdb",
        title="Database URL for async operations (with asyncpg driver)"
    )

    DATABASE_URL: str = Field(
        # default="postgresql://postgres:qtrm&2*Q@localhost:5432/gisdb",
        title="Database URL for sync operations (without asyncpg driver)"
    )

    FRONTEND_URL: str = Field(
        default="https://localhost:3000",
        title="Frontend URL",
    )

    PORT: int = Field(
        default=8000,
        title="Port"
    )
    SERVER_HOST: str = Field(
        default="127.0.0.1",
        title="Server domain"
    )
    APP_NAME: str = Field(
        default="ECIP Backend",
        title="App name"
    )

    SECRET_KEY: SecretStr = Field(
        default="thisisaseriouscaseofmonkeybusiness",
        title="Secret key used for JWT token"
    )

    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=100,
        title="Access token expire minutes",
    )
    SRC_GEOMETRY_SRID: int = Field(
        default=4326,
        title="Source geometry SRID for .gdb files",
    )
    DB_GEOMETRY_SRID: int = Field(
        default=4326,
        title="Database geometry SRID",
    )

    SERVER_WORKERS: int = 2
    API_PREFIX: str = "/api"
    DOCS_URL: str = "/docs"

    class Config:
        env_file: str = f"{str(ROOT_DIR)}/.env"
        extra = 'allow'  # Allow extra fields


settings = Settings()
