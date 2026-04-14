import os

from starlette.responses import JSONResponse

# remove postgis env variables if set
os.environ.pop('PROJ_LIB', None)  # Remove PROJ_LIB if set
os.environ.pop('GDAL_DATA', None)  # Remove GDAL_DATA if set

from fastapi import FastAPI
from app.core.config import settings
from app.core.db import init_db_sync

from app.api.endpoints import router as api_endpoint_router
from fastapi.middleware.cors import CORSMiddleware


def startup():
    """
    Function to run at startup.
    """
    # Initialize the database by creating all tables if they do not exist
    init_db_sync()


app = FastAPI(
    title="Climate Insights Portal",
    description="API for climate data, predictions, and historical analysis",
    version="1.0.0",
)

@app.exception_handler(ValueError)
async def value_error_exception_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"message": str(exc)},
    )

startup()

# CORS (Cross-Origin Resource Sharing) middleware configuration
origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router=api_endpoint_router, prefix=settings.API_PREFIX)


@app.get("/")
async def root():
    return {"message": "Welcome to the Climate Insights Portal!"}
