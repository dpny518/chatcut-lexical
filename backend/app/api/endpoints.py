#app/api/endpoints.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from app.services.file_processor import process_file
from app.services.storage_handler import get_processed_file
import logging
from pydantic import BaseModel
from typing import Dict, Any, List

logger = logging.getLogger(__name__)
router = APIRouter()

class ChatInput(BaseModel):
    message: str
    formatted_content: Dict[str, Any]
    selected_files: Dict[str, Any]


@router.post("/upload")
async def upload_file(file: UploadFile = File(...), user_id: str = "default_user"):
    logger.info(f"Received file: {file.filename}, user_id: {user_id}")
    try:
        result = await process_file(file, user_id)
        logger.info(f"File processed successfully: {result}")
        return result
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/multiple_uploads")
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    user_id: str = Form("default_user")
):
    logger.info(f"Received multiple files, user_id: {user_id}")
    results = {}

    for file in files:
        try:
            result = await process_file(file, user_id)
            results[file.filename] = result
            logger.info(f"File processed successfully: {file.filename}")
        except Exception as e:
            logger.error(f"Error processing file {file.filename}: {str(e)}", exc_info=True)
            results[file.filename] = {"error": str(e)}

    return results
@router.get("/processed/{user_id}/{file_id}")
async def get_processed(user_id: str, file_id: str):
    processed_data = get_processed_file(user_id, file_id)
    if not processed_data:
        raise HTTPException(status_code=404, detail="Processed file not found")
    return processed_data

@router.post("/chat")
async def chat(chat_input: ChatInput):
    logger.info(f"Received chat input: {chat_input}")
    # Here you would process the chat input and generate a response
    # For now, we'll just echo back the received data
    response = {
        "message": f"Received message: {chat_input.message}",
        "formatted_content": chat_input.formatted_content,
        "selected_files": chat_input.selected_files
    }
    logger.info(f"Sending chat response: {response}")
    return response

@router.get("/projects/{project_id}")
async def get_project(project_id: str):
    # Implement logic to retrieve a project by ID
    return {"message": f"Project {project_id} details"}

@router.put("/projects/{project_id}")
async def update_project(project_id: str):
    # Implement logic to update a project
    return {"message": f"Project {project_id} updated"}

@router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    # Implement logic to delete a project
    return {"message": f"Project {project_id} deleted"}

@router.get("/health")
async def health_check():
    return {"status": "healthy"}