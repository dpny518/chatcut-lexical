from docx import Document
import re
import io
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

def extract_time(text: str) -> float:
    """Extract time from format like '00:00' or '00:00:00' and convert to seconds"""
    if not text:
        return 0.0
    
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
        
        return float(hours * 3600 + minutes * 60 + seconds)
    return 0.0

def clean_speaker_name(text: str) -> str:
    """Clean speaker name by removing special characters and timestamps"""
    # Remove timestamps
    text = re.sub(r'\d{2}:\d{2}(?::\d{2})?', '', text)
    # Remove asterisks
    text = text.replace('*', '')
    # Remove leading/trailing whitespace
    text = text.strip()
    # Remove trailing colon if present
    text = text.rstrip(':')
    return text.replace(' ', '-')

def parse_segment(text: str) -> tuple[str | None, str, float]:
    """Parse a segment of text to extract speaker and content"""
    # Match different speaker patterns
    speaker_patterns = [
        r'\*\*(.*?)\*\*[:\s]*(\d{2}:\d{2}(?::\d{2})?)?',  # **Speaker Name** 00:00
        r'(说话人\d+)\s+(\d{2}:\d{2}(?::\d{2})?)',        # 说话人1 00:00
        r'^([^:]+?):\s*(\d{2}:\d{2}(?::\d{2})?)?'         # Speaker: 00:00
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
            
    return None, text.strip(), 0.0

async def parse_to_schema(content: bytes) -> Dict[str, Any]:
    """Parse DOCX content to transcript segments"""
    try:
        # Create a BytesIO object from the content
        doc_stream = io.BytesIO(content)
        doc = Document(doc_stream)
        
        segments = []
        current_time = 0.0
        last_speaker = None
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
                        "end_time": start_time if start_time else current_time + 30.0,
                        "text": " ".join(current_text),
                        "speaker": last_speaker,
                        "words": []  # Word-level timing not available in DOCX
                    })
                    
                current_text = [content] if content else []
                last_speaker = speaker
                if start_time > 0:
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
                "end_time": current_time + 30.0,  # Estimate for last segment
                "text": " ".join(current_text),
                "speaker": last_speaker,
                "words": []
            })

        logger.info(f"Parsed {len(segments)} segments from DOCX")
        
        # Return segments only - project structure will be created by create_project_structure
        return {
            "transcript": {
                "segments": segments
            },
            "media": {
                "duration": segments[-1]["end_time"] if segments else 0
            }
        }

    except Exception as e:
        logger.error(f"Error parsing DOCX content: {str(e)}")
        raise ValueError(f"Error parsing DOCX content: {str(e)}")

# Expose the parse_to_schema function at module level
__all__ = ['parse_to_schema']