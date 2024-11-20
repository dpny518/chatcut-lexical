from fastapi import UploadFile, HTTPException
from app.services.file_handlers import image_handler, docx_handler, txt_handler, json_handler, srtx_handler
from app.services.storage_handler import save_uploaded_file, save_processed_file
from datetime import datetime
import uuid
import logging
import traceback
import os
# app/services/file_processor.py

logger = logging.getLogger(__name__)

async def process_file(file: UploadFile, user_id: str):
    logger.info(f"Processing file: {file.filename} for user: {user_id}")
    try:
        # Save the uploaded file
        file_id, original_path = await save_uploaded_file(file, user_id)
        
        # Read the file content
        with open(original_path, 'rb') as f:
            file_content = f.read()
        
        if file.filename.endswith('.txt'):
            logger.info("Using TXT parser")
            parsed = await txt_handler.parse(file_content)
        elif file.filename.endswith('.docx'):
            logger.info("Using DOCX parser")
            parsed = await docx_handler.parse_to_schema(file_content)
        elif file.filename.endswith('.pdf'):
            logger.info("Using PDF parser")
            parsed = await image_handler.parse(file_content)
        elif file.filename.endswith('.json'):
            logger.info("Using JSON parser")
            parsed = await json_handler.parse(file_content)
        elif file.filename.endswith('.srtx'):
            logger.info("Using SRTX parser")
            parsed = await srtx_handler.parse(file_content)
        else:
            logger.error(f"Unsupported file type: {file.filename}")
            raise ValueError(f"Unsupported file type: {file.filename}")


        logger.info(f"Parsed content: {parsed}")
        result = create_project_structure(parsed, file.filename, file_id)
        
        # Save the processed result locally
        processed_path = save_processed_file(result, user_id, file_id)
        
        logger.info(f"Created project structure with {len(result['transcript']['segments'])} segments")
        
        # Return both the file information and the processed result
        return {
            "file_info": {
                "file_id": file_id,
                "original_path": original_path,
                "processed_path": processed_path
            },
            "processed_data": result
        }
    except Exception as e:
        logger.error(f"Error processing file {file.filename}: {str(e)}")
        raise


def create_project_structure(parsed_content, file_name, file_size):
    logger.info(f"Creating project structure for {file_name}")
    
    # Check if parsed_content is already in the correct structure
    if isinstance(parsed_content, dict) and 'project_id' in parsed_content:
        return parsed_content

    project_id = str(uuid.uuid4())
    media_id = str(uuid.uuid4())
    
    if isinstance(parsed_content, dict) and 'transcript' in parsed_content:
        segments = parsed_content['transcript']['segments']
        estimated_duration = parsed_content['media']['duration']
    else:
        segments = parsed_content
        estimated_duration = segments[-1]['end_time'] if segments else None
    
    logger.info(f"Estimated duration: {estimated_duration}")

    project = {
        "project_id": project_id,
        "media": {
            "id": media_id,
            "source": file_name,
            "duration": estimated_duration,
            "uploaded_on": datetime.now().isoformat()
        },
        "transcript": {
            "segments": segments
        },
        "edits": []
    }

    logger.info(f"Created project structure with {len(project['transcript']['segments'])} segments")
    return project