import re
from datetime import timedelta
import logging
from typing import List, Dict, Any, Union

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

def hyphenate_speaker_name(name: str) -> str:
    """
    Replace spaces in speaker names with hyphens.
    Also handles cases with colons and other potential formatting.
    
    Args:
        name (str): Original speaker name
    
    Returns:
        str: Speaker name with spaces replaced by hyphens
    """
    if not name:
        return name
    
    # Remove trailing colon if present
    name = name.rstrip(':')
    
    # Replace spaces with hyphens
    return name.replace(' ', '-')

def parse_time(time_str: str) -> timedelta:
    hours, minutes, seconds_ms = time_str.split(':')
    seconds, milliseconds = seconds_ms.split(',')
    return timedelta(hours=int(hours), minutes=int(minutes), seconds=int(seconds), milliseconds=int(milliseconds))

async def parse(content: Union[str, bytes]) -> List[Dict[str, Any]]:
    logger.info("Starting SRTX parsing")
    
    if isinstance(content, str):
        # If content is a file path, read the file
        with open(content, 'r', encoding='utf-8') as file:
            content = file.read()
    elif isinstance(content, bytes):
        # If content is bytes, decode it
        content = content.decode('utf-8')
    
    # Updated pattern to match the format in your file
    pattern = re.compile(r'(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\n(.+?)\n(.*?)(?=\n\n|\Z)', re.DOTALL)
    matches = pattern.findall(content)

    logger.info(f"Found {len(matches)} matches in SRTX content")

    parsed_content = []
    for index, match in enumerate(matches, start=1):
        index, start_time, end_time, speaker, text = match
        start = parse_time(start_time)
        end = parse_time(end_time)
        
        # Hyphenate speaker name
        speaker = hyphenate_speaker_name(speaker)
        
        # Split text into words, treating Chinese characters as individual words
        words = split_into_words(text)
        word_list = []
        
        for word in words:
            word_list.append({
                "start": -1,  # Use -1 to indicate timing is not available
                "end": -1,    # Use -1 to indicate timing is not available
                "word": word
            })
        
        parsed_content.append({
            "index": int(index),
            "start_time": start.total_seconds(),
            "end_time": end.total_seconds(),
            "text": text.strip(),
            "speaker": speaker.strip(),
            "words": word_list
        })

    logger.info(f"Parsed {len(parsed_content)} segments from SRTX")
    return parsed_content