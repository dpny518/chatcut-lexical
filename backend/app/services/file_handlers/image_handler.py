# app/services/file_handlers/image_handler.py
from fastapi import UploadFile
from PIL import Image
import io

async def process(file: UploadFile):
    content = await file.read()
    image = Image.open(io.BytesIO(content))
    # Process the image and convert it to your desired format
    # For example, you might want to resize it, extract metadata, etc.
    return {"width": image.width, "height": image.height, "format": image.format}