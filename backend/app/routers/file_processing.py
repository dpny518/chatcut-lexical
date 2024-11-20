from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.file_processor import process_file

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        project = await process_file(file)
        return project
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))