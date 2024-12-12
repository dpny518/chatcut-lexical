FROM python:3.9

WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . /app

# Copy the .env file
COPY .env /app/.env

# Set Python path
ENV PYTHONPATH=/app

# Use a shell script to load environment variables and start the application
RUN echo '#!/bin/bash\n\
set -a\n\
source /app/.env\n\
set +a\n\
exec uvicorn app.main:app --host 0.0.0.0 --port 8000\n'\
> /app/start.sh && chmod +x /app/start.sh

# Run the start script
CMD ["/app/start.sh"]