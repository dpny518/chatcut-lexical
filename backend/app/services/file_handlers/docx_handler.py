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
    """Split text into words, treating Chinese characters as individual words"""
    words = []
    current_word = ''
    
    for char in text:
        if is_chinese_char(char):
            if current_word:
                words.extend(current_word.split())
                current_word = ''
            words.append(char)
        else:
            current_word += char
    
    if current_word:
        words.extend(current_word.split())
    
    return words

def extract_timestamp(text: str) -> Optional[float]:
    """
    Extract MM:SS format timestamp and convert to seconds
    Returns None if no valid timestamp found
    """
    timestamp_match = re.search(r'(\d{2}):(\d{2})', text)
    if timestamp_match:
        minutes = int(timestamp_match.group(1))
        seconds = int(timestamp_match.group(2))
        if minutes < 60 and seconds < 60:  # Basic validation
            total_seconds = float(minutes * 60 + seconds)
            logger.debug(f"Extracted timestamp {total_seconds} seconds from {text}")
            return total_seconds
    return None

def clean_text(text: str) -> str:
    """Remove markdown-style formatting and clean text"""
    # Remove ** markers
    text = re.sub(r'\*\*|\*', '', text)
    # Remove timestamps
    text = re.sub(r'\d{2}:\d{2}(?::\d{2})?\s*', '', text)
    # Clean extra whitespace
    return ' '.join(text.split()).strip()

def parse_segment(text: str) -> Tuple[Optional[str], str, Optional[float]]:
    """Parse a segment of text to extract speaker and content"""
    # Match speaker patterns
    speaker_patterns = [
        r'\*\*(.*?)\*\*:?\s*(\d{2}:\d{2})?\s*',  # **Speaker Name** 00:00
        r'(说话人\d+)\s*(\d{2}:\d{2})?\s*',       # 说话人1 00:00
        r'^([^:]+?):\s*(\d{2}:\d{2})?\s*'         # Speaker: 00:00
    ]
    
    for pattern in speaker_patterns:
        match = re.match(pattern, text)
        if match:
            speaker = match.group(1).strip()
            timestamp = match.group(2) if len(match.groups()) > 1 else None
            
            # Get the remaining text after the speaker/time pattern
            content = text[match.end():].strip()
            
            # Extract timestamp
            start_time = extract_timestamp(timestamp) if timestamp else None
            
            # Clean and hyphenate speaker name
            speaker = speaker.rstrip(':').replace(' ', '-')
            
            return speaker, content, start_time
            
    return None, text.strip(), None

async def parse_to_schema(content: bytes) -> Dict[str, Any]:
    """Parse DOCX content to transcript segments"""
    try:
        doc_stream = io.BytesIO(content)
        doc = Document(doc_stream)
        
        segments = []
        current_segment = None
        segment_index = 1
        last_time = 0.0  # Track the last known timestamp
        
        for para in doc.paragraphs:
            text = para.text.strip()
            if not text:
                continue
                
            speaker, content, start_time = parse_segment(text)
            
            if speaker:
                # Save previous segment if it exists
                if current_segment:
                    # If we have a new start_time, use it for previous segment's end_time
                    if start_time is not None:
                        current_segment["end_time"] = start_time
                    else:
                        # If no new timestamp, estimate end_time based on last known time
                        current_segment["end_time"] = current_segment["start_time"] + 30.0
                    segments.append(current_segment)
                
                # Update last_time if we have a valid start_time
                if start_time is not None:
                    last_time = start_time
                else:
                    # If no timestamp provided, estimate based on last known time
                    start_time = last_time + 30.0
                    last_time = start_time
                
                # Clean the content and split into words
                cleaned_text = clean_text(content)
                words = split_into_words(cleaned_text)
                
                # Create new segment
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
                    words = split_into_words(cleaned_text)
                    current_segment["words"].extend([
                        {"start": -1, "end": -1, "word": word}
                        for word in words
                    ])
        
        # Add the last segment
        if current_segment:
            # For the last segment, add a reasonable duration
            current_segment["end_time"] = current_segment["start_time"] + 30.0
            segments.append(current_segment)
        
        # Calculate total duration safely
        if segments:
            # Filter out None values and get the maximum end_time
            valid_end_times = [seg["end_time"] for seg in segments if seg["end_time"] is not None]
            total_duration = max(valid_end_times) if valid_end_times else 0.0
        else:
            total_duration = 0.0
        
        parsed_data = {
            "project_id": str(uuid.uuid4()),
            "media": {
                "id": str(uuid.uuid4()),
                "source": "document.docx",
                "duration": total_duration,
                "uploaded_on": datetime.utcnow().isoformat() + "Z"
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