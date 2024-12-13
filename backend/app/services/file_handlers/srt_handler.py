import re
import uuid
from datetime import datetime
from typing import List, Dict, Any, Union
import logging
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

def parse_time(time_str: str) -> float:
    """Convert SRT time format to seconds"""
    hours, minutes, seconds_ms = time_str.split(':')
    seconds, milliseconds = seconds_ms.split(',')
    return int(hours) * 3600 + int(minutes) * 60 + int(seconds) + int(milliseconds) / 1000

async def parse_srt(content: Union[str, bytes]) -> Dict[str, Any]:
    logger.info("Starting SRT parsing")
    
    if isinstance(content, str):
        # If content is a file path, read the file
        with open(content, 'r', encoding='utf-8') as file:
            content = file.read()
    elif isinstance(content, bytes):
        # If content is bytes, decode it
        content = content.decode('utf-8')
    
    # Pattern to match SRT format
    pattern = re.compile(r'(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\n(.*?)(?=\n\n|\Z)', re.DOTALL)
    matches = pattern.findall(content)

    logger.info(f"Found {len(matches)} matches in SRT content")

    segments = []
    unknown_counter = 1
    for index, match in enumerate(matches, start=1):
        _, start_time, end_time, text = match
        start = parse_time(start_time)
        end = parse_time(end_time)
        
        # Split text into words, treating Chinese characters as individual words
        words = split_into_words(text)
        word_list = []
        
        for word in words:
            word_list.append({
                "start": -1,
                "end": -1,
                "word": word
            })
        
        segments.append({
            "index": index,
            "start_time": start,
            "end_time": end,
            "text": text.strip(),
            "speaker": f"UNKNOWN-{unknown_counter}",
            "words": word_list
        })
        unknown_counter += 1

    total_duration = segments[-1]['end_time'] if segments else 0
    
    parsed_data = {
        "project_id": str(uuid.uuid4()),
        "media": {
            "id": str(uuid.uuid4()),
            "source": "ChineseSubtitletest.srt",
            "duration": total_duration,
            "uploaded_on": datetime.utcnow().isoformat() + "Z"
        },
        "transcript": {
            "segments": segments
        },
        "edits": []
    }

    logger.info(f"Parsed {len(segments)} segments from SRT")
    return parsed_data