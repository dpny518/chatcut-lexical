import os
import json
from fastapi import UploadFile
from uuid import uuid4

UPLOAD_DIR = "uploads"
PROCESSED_DIR = "processed"

def ensure_dir(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)

ensure_dir(UPLOAD_DIR)
ensure_dir(PROCESSED_DIR)

async def save_uploaded_file(file: UploadFile, user_id: str):
    file_id = str(uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"{user_id}_{file_id}{file_extension}")
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    return file_id, file_path

def save_processed_file(processed_data: dict, user_id: str, file_id: str):
    file_path = os.path.join(PROCESSED_DIR, f"{user_id}_{file_id}.json")
    
    with open(file_path, "w") as buffer:
        json.dump(processed_data, buffer)
    
    return file_path

def get_processed_file(user_id: str, file_id: str):
    file_path = os.path.join(PROCESSED_DIR, f"{user_id}_{file_id}.json")
    
    if not os.path.exists(file_path):
        return None
    
    with open(file_path, "r") as buffer:
        return json.load(buffer)