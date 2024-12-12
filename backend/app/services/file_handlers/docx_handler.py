import json
import uuid
from datetime import datetime
import re
from docx import Document
import regex  # For better Unicode support

def extract_time(text):
    """
    Extract time from format like '00:00' or '00:00:00'
    Returns time in seconds
    """
    if not text:
        return None
    
    time_match = re.search(r'(\d{2}):(\d{2})(?::(\d{2}))?', text)
    if time_match:
        hours = 0
        if time_match.group(3):  # HH:MM:SS format
            hours = int(time_match.group(1))
            minutes = int(time_match.group(2))
            seconds = int(time_match.group(3))
        else:  # MM:SS format
            minutes = int(time_match.group(1))
            seconds = int(time_match.group(2))
        
        return hours * 3600 + minutes * 60 + seconds
    return None

def clean_speaker_name(text):
    """
    Clean speaker name by removing special characters and timestamps
    """
    # Remove timestamps
    text = re.sub(r'\d{2}:\d{2}(?::\d{2})?', '', text)
    # Remove asterisks
    text = text.replace('*', '')
    # Remove leading/trailing whitespace
    text = text.strip()
    # Remove trailing colon if present
    text = text.rstrip(':')
    return text

def parse_segment(text):
    """
    Parse a segment of text to extract speaker and content
    """
    # Match bold text patterns (between ** or after speaker identifier)
    speaker_patterns = [
        r'\*\*(.*?)\*\*[:\s]*(\d{2}:\d{2}(?::\d{2})?)?',  # **Speaker Name** 00:00
        r'(说话人\d+)\s+(\d{2}:\d{2}(?::\d{2})?)',  # 说话人1 00:00
    ]
    
    for pattern in speaker_patterns:
        match = re.match(pattern, text)
        if match:
            speaker = clean_speaker_name(match.group(1))
            # Get the remaining text after the speaker/time pattern
            content = text[match.end():].strip()
            # Extract time if present
            time_str = match.group(2) if len(match.groups()) > 1 else None
            start_time = extract_time(time_str)
            return speaker, content, start_time
            
    return None, text, None

def parse_docx(file_path):
    """
    Parse DOCX file and convert to required JSON format
    """
    doc = Document(file_path)
    segments = []
    current_time = 0
    last_speaker = None
    
    # Join paragraphs with same speaker
    current_text = []
    
    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
            
        speaker, content, start_time = parse_segment(text)
        
        if speaker:
            # If we have accumulated text for previous speaker, save it
            if current_text and last_speaker:
                segments.append({
                    "index": len(segments) + 1,
                    "start_time": current_time,
                    "end_time": start_time if start_time else current_time + 30,  # estimate if no end time
                    "text": " ".join(current_text),
                    "speaker": last_speaker.replace(" ", "-"),
                    "words": []  # We don't have word-level timing
                })
                
            current_text = [content] if content else []
            last_speaker = speaker
            if start_time is not None:
                current_time = start_time
        else:
            # Append to current speaker's text if exists
            if last_speaker and text:
                current_text.append(text)
    
    # Add final segment
    if current_text and last_speaker:
        segments.append({
            "index": len(segments) + 1,
            "start_time": current_time,
            "end_time": current_time + 30,  # estimate for last segment
            "text": " ".join(current_text),
            "speaker": last_speaker.replace(" ", "-"),
            "words": []
        })

    # Create final output structure
    project_id = str(uuid.uuid4())
    media_id = str(uuid.uuid4())
    uploaded_on = datetime.utcnow().isoformat() + "Z"
    
    total_duration = segments[-1]['end_time'] if segments else 0
    
    return {
        "project_id": project_id,
        "media": {
            "id": media_id,
            "source": file_path,
            "duration": total_duration,
            "uploaded_on": uploaded_on
        },
        "transcript": {
            "segments": segments
        },
        "edits": []
    }

# Example usage
async def parse(file_path):
    try:
        return parse_docx(file_path)
    except Exception as e:
        raise ValueError(f"Error parsing DOCX file: {str(e)}")