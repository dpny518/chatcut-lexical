from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from .api.endpoints import router as api_router
import logging

logging.basicConfig(level=logging.INFO)
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(api_router, prefix="/api/v1")