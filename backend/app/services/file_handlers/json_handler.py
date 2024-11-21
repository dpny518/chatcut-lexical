import json
import uuid
from datetime import datetime

def hyphenate_speaker_name(name):
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

async def parse(content):
    try:
        data = json.loads(content)
        project_id = str(uuid.uuid4())
        media_id = str(uuid.uuid4())
        uploaded_on = datetime.utcnow().isoformat() + "Z"

        segments = []
        for index, item in enumerate(data.get('transcription', []), start=1):
            segment = item['segment']
            words = item['words']
            
            # Hyphenate speaker name
            speaker = hyphenate_speaker_name(segment['speaker'])
            
            segments.append({
                "index": index,
                "start_time": segment['start'],
                "end_time": segment['end'],
                "text": segment['text'],
                "speaker": speaker,
                "words": [
                    {
                        "start": word['start'],
                        "end": word['end'],
                        "word": word['word']
                    } for word in words
                ]
            })

        total_duration = segments[-1]['end_time'] if segments else 0

        parsed_data = {
            "project_id": project_id,
            "media": {
                "id": media_id,
                "source": "unknown.json",
                "duration": total_duration,
                "uploaded_on": uploaded_on
            },
            "transcript": {
                "segments": segments
            },
            "edits": []
        }

        return parsed_data

    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON format: {str(e)}")
    except KeyError as e:
        raise ValueError(f"Missing required key in JSON structure: {str(e)}")