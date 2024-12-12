from docx import Document
import re
import io
from typing import List, Dict, Any, Optional, Union, Tuple
import logging
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

def is_chinese_char(char: str) -> bool:
    """Check if a character is Chinese"""
    return '\u4e00' <= char <= '\u9fff'

def split_into_words(text: str) -> List[str]:
    """
    Split text into words, treating Chinese characters as individual words
    and keeping English words intact
    """
    words = []
    current_word = ''
    
    for char in text:
        if is_chinese_char(char):
            # If we have accumulated non-Chinese characters, add them as a word
            if current_word:
                words.extend(current_word.split())
                current_word = ''
            # Add Chinese character as its own word
            words.append(char)
        else:
            current_word += char
    
    # Add any remaining non-Chinese words
    if current_word:
        words.extend(current_word.split())
    
    return words

def timestamp_to_seconds(timestamp: str) -> float:
    """Convert timestamp to seconds"""
    if not timestamp:
        return 0.0
    
    time_match = re.search(r'(\d{2}):(\d{2})(?::(\d{2}))?', timestamp)
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

def clean_text(text: str) -> str:
    """Remove markdown-style formatting and clean text"""
    # Remove ** markers
    text = re.sub(r'\*\*|\*', '', text)
    # Remove timestamps
    text = re.sub(r'\d{2}:\d{2}(?::\d{2})?', '', text)
    # Clean extra whitespace
    return ' '.join(text.split()).strip()

def hyphenate_speaker_name(name: str) -> str:
    """Replace spaces in speaker names with hyphens"""
    if not name:
        return name
    
    # Remove trailing colon if present
    name = name.rstrip(':')
    return name.replace(' ', '-')

def parse_segment(text: str) -> Tuple[Optional[str], str, float]:
    """Parse a segment of text to extract speaker and content"""
    speaker_patterns = [
        r'\*\*(.*?)\*\*[:\s]*(\d{2}:\d{2}(?::\d{2})?)?',  # **Speaker Name** 00:00
        r'(说话人\d+)\s+(\d{2}:\d{2}(?::\d{2})?)',        # 说话人1 00:00
        r'^([^:]+?):\s*(\d{2}:\d{2}(?::\d{2})?)?'         # Speaker: 00:00
    ]
    
    for pattern in speaker_patterns:
        match = re.match(pattern, text)
        if match:
            speaker = hyphenate_speaker_name(match.group(1))
            # Extract time if present
            time_str = match.group(2) if len(match.groups()) > 1 else None
            start_time = timestamp_to_seconds(time_str)
            # Get the remaining text after the speaker/time pattern
            content = text[match.end():].strip()
            return speaker, content, start_time
            
    return None, text.strip(), 0.0

async def parse_to_schema(content: bytes) -> Dict[str, Any]:
    """Parse DOCX content to transcript segments"""
    try:
        # Create a BytesIO object from the content
        doc_stream = io.BytesIO(content)
        doc = Document(doc_stream)
        
        segments = []
        current_segment = None
        segment_index = 1
        
        for para in doc.paragraphs:
            text = para.text.strip()
            if not text:
                continue
                
            speaker, content, start_time = parse_segment(text)
            
            if speaker:
                # Save previous segment if it exists
                if current_segment:
                    segments.append(current_segment)
                
                # Clean the content
                cleaned_text = clean_text(content)
                # Split into words, handling Chinese characters
                words = split_into_words(cleaned_text)
                
                # Start new segment
                current_segment = {
                    "index": segment_index,
                    "start_time": start_time,
                    "end_time": None,  # Will be set later
                    "text": cleaned_text,
                    "speaker": speaker,
                    "words": [{"start": -1, "end": -1, "word": word} for word in words]
                }
                segment_index += 1
            elif current_segment:
                # Append text to current segment
                cleaned_text = clean_text(text)
                if cleaned_text:
                    current_segment["text"] += " " + cleaned_text
                    # Split additional text into words, handling Chinese characters
                    words = split_into_words(cleaned_text)
                    current_segment["words"].extend([
                        {"start": -1, "end": -1, "word": word}
                        for word in words
                    ])
        
        # Add the last segment
        if current_segment:
            segments.append(current_segment)
            
        # Set end times
        for i, segment in enumerate(segments):
            if i < len(segments) - 1:
                # Set end time based on next segment's start time
                segment["end_time"] = segments[i + 1]["start_time"]
            else:
                # For the last segment, add 60 seconds
                segment["end_time"] = segment["start_time"] + 60.0

        # Generate project structure
        project_id = str(uuid.uuid4())
        media_id = str(uuid.uuid4())
        uploaded_on = datetime.utcnow().isoformat() + "Z"
        
        total_duration = segments[-1]["end_time"] if segments else 0

        parsed_data = {
            "project_id": project_id,
            "media": {
                "id": media_id,
                "source": "document.docx",
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
        logger.error(f"Error parsing DOCX content: {str(e)}")
        raise ValueError(f"Error parsing DOCX content: {str(e)}")

# Expose the parse_to_schema function at module level
__all__ = ['parse_to_schema']