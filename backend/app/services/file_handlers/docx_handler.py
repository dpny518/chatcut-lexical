import logging
from docx import Document
import re
import uuid
from datetime import datetime
from io import BytesIO
import traceback
import os

logger = logging.getLogger(__name__)

def timestamp_to_seconds(timestamp):
    """Convert MM:SS timestamp to seconds."""
    try:
        if not timestamp:
            return 0
        parts = timestamp.split(':')
        if len(parts) == 2:
            minutes, seconds = map(int, parts)
            return minutes * 60 + seconds
        return 0
    except (ValueError, AttributeError) as e:
        logger.error(f"Error converting timestamp {timestamp}: {e}")
        return 0

def clean_text(text):
    """Remove markdown-style formatting and clean text."""
    # Remove ** markers
    text = re.sub(r'\*\*|\*', '', text)
    # Remove timestamps
    text = re.sub(r'\d{2}:\d{2}', '', text)
    # Clean extra whitespace
    text = ' '.join(text.split())
    return text.strip()

def extract_speaker_and_text(line):
    """Extract speaker and text from a line."""
    speaker_match = re.match(r'\*\*([^*]+)\*\*:?\s*(.*)', line)
    if speaker_match:
        speaker = speaker_match.group(1).strip()
        text = speaker_match.group(2).strip()
        return speaker, text
    return None, None

def extract_timestamp(text):
    """Extract timestamp from text."""
    timestamp_match = re.search(r'(\d{2}:\d{2})', text)
    if timestamp_match:
        return timestamp_match.group(1)
    return None

async def parse_to_schema(file_or_content):
    """Parse DOCX interview transcript to structured schema."""
    try:
        if isinstance(file_or_content, str):
            # If it's a file path
            logger.info(f"Starting DOCX parsing for file: {file_or_content}")
            with open(file_or_content, 'rb') as f:
                file_content = f.read()
            filename = os.path.basename(file_or_content)
        elif isinstance(file_or_content, bytes):
            # If it's file content
            logger.info("Starting DOCX parsing for file content")
            file_content = file_or_content
            filename = "unknown.docx"
        else:
            # If it's an UploadFile object
            logger.info(f"Starting DOCX parsing for file: {file_or_content.filename}")
            file_content = await file_or_content.read()
            filename = file_or_content.filename

        logger.info(f"File content length: {len(file_content)} bytes")
        
        doc = Document(BytesIO(file_content))
        logger.info("DOCX document created successfully")
        
        segments = []
        project_id = str(uuid.uuid4())
        media_id = str(uuid.uuid4())
        uploaded_on = datetime.utcnow().isoformat() + "Z"

        current_segment = None
        segment_index = 1  # Initialize segment_index here
        
        for para in doc.paragraphs:
            text = para.text.strip()
            logger.debug(f"Processing paragraph: {text}")
            if not text:
                continue

            speaker, remaining_text = extract_speaker_and_text(text)
            timestamp = extract_timestamp(text)

            if speaker:
                # Save previous segment if it exists
                if current_segment:
                    segments.append(current_segment)
                
                # Start new segment
                current_segment = {
                    "index": segment_index,
                    "start_time": timestamp_to_seconds(timestamp),
                    "end_time": None,  # Will be set later
                    "text": clean_text(remaining_text),
                    "speaker": speaker,
                    "words": [{"start": -1, "end": -1, "word": word} for word in clean_text(remaining_text).split()]
                }

                segment_index += 1
            elif current_segment:
                # Append text to current segment
                cleaned_text = clean_text(text)
                if cleaned_text:
                    current_segment["text"] += " " + cleaned_text
                    current_segment["words"].extend([{"start": -1, "end": -1, "word": word} for word in cleaned_text.split()])
                    
        # Add the last segment
        if current_segment:
            segments.append(current_segment)

        # Set end times
        for i, segment in enumerate(segments):
            # Set end time based on next segment's start time
            if i < len(segments) - 1:
                segment["end_time"] = segments[i + 1]["start_time"]
            else:
                # For the last segment, add 60 seconds
                segment["end_time"] = segment["start_time"] + 60

        total_duration = segments[-1]["end_time"] if segments else 0

        parsed_data = {
            "project_id": project_id,
            "media": {
                "id": media_id,
                "source": filename,
                "duration": total_duration,
                "uploaded_on": uploaded_on
            },
            "transcript": {
                "segments": segments
            },
            "edits": []
        }

        logger.info(f"Successfully parsed {len(segments)} segments from DOCX")
        return parsed_data

    except Exception as e:
        logger.error(f"Error parsing DOCX file: {str(e)}")
        logger.error(traceback.format_exc())
        raise