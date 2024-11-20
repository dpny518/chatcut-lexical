#!/bin/bash

# Create main directory
#mkdir -p file_processing_api

# Change to the main directory
#cd file_processing_api

# Create app directory and subdirectories
mkdir -p app/routers app/services/file_handlers app/utils

# Create files in app directory
touch app/main.py

# Create files in routers directory
touch app/routers/file_processing.py
touch app/routers/health.py

# Create files in services directory
touch app/services/file_processor.py

# Create files in file_handlers directory
touch app/services/file_handlers/image_handler.py
touch app/services/file_handlers/docx_handler.py
touch app/services/file_handlers/txt_handler.py
touch app/services/file_handlers/json_handler.py

# Create file in utils directory
touch app/utils/logging.py

# Create root level files
touch Dockerfile
touch requirements.txt
touch docker-compose.yml

echo "Directory structure and files created successfully!"
