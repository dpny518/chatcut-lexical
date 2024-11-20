{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Transcript JSON Schema",
  "description": "Schema for handling text-based editing of media projects.",
  "type": "object",
  "properties": {
    "project_id": {
      "type": "string",
      "description": "A unique identifier for the project."
    },
    "media": {
      "type": "object",
      "description": "Metadata about the uploaded media file.",
      "properties": {
        "id": {
          "type": "string",
          "description": "Unique identifier for the media file."
        },
        "source": {
          "type": "string",
          "description": "Path or URL to the media file."
        },
        "duration": {
          "type": "number",
          "description": "Total duration of the media file in seconds."
        },
        "uploaded_on": {
          "type": "string",
          "format": "date-time",
          "description": "Timestamp when the media was uploaded."
        }
      },
      "required": ["id", "source", "duration"]
    },
    "transcript": {
      "type": "object",
      "description": "The working copy of the transcript associated with the media.",
      "properties": {
        "segments": {
          "type": "array",
          "description": "Array of transcript segments.",
          "items": {
            "type": "object",
            "properties": {
              "segment_id": {
                "type": "string",
                "description": "Unique identifier for the segment."
              },
              "start_time": {
                "type": "number",
                "description": "Start time of the segment in seconds."
              },
              "end_time": {
                "type": "number",
                "description": "End time of the segment in seconds."
              },
              "text": {
                "type": "string",
                "description": "The full text of this segment."
              },
              "speaker": {
                "type": "string",
                "description": "Speaker name or identifier."
              },
              "words": {
                "type": "array",
                "description": "Array of word-level details within the segment.",
                "items": {
                  "type": "object",
                  "properties": {
                    "word": {
                      "type": "string",
                      "description": "The word in the transcript."
                    },
                    "start": {
                      "type": "number",
                      "description": "Start time of the word in seconds."
                    },
                    "end": {
                      "type": "number",
                      "description": "End time of the word in seconds."
                    },
                    "confidence": {
                      "type": "number",
                      "minimum": 0,
                      "maximum": 1,
                      "description": "Confidence score for the transcription of this word (optional)."
                    }
                  },
                  "required": ["word", "start", "end"]
                }
              }
            },
            "required": ["segment_id", "start_time", "end_time", "text"]
          }
        }
      },
      "required": ["segments"]
    },
    "edits": {
      "type": "array",
      "description": "List of all edits made to the transcript.",
      "items": {
        "type": "object",
        "properties": {
          "edit_id": {
            "type": "string",
            "description": "Unique identifier for the edit."
          },
          "type": {
            "type": "string",
            "enum": ["delete", "replace", "insert", "merge", "split"],
            "description": "Type of edit performed."
          },
          "affected_words": {
            "type": "array",
            "description": "Words affected by the edit.",
            "items": {
              "type": "string"
            }
          },
          "new_text": {
            "type": "string",
            "description": "The new text after the edit (if applicable)."
          },
          "affected_segments": {
            "type": "array",
            "description": "Segments affected by the edit.",
            "items": {
              "type": "string"
            }
          },
          "timestamp": {
            "type": "string",
            "format": "date-time",
            "description": "When the edit occurred."
          },
          "user": {
            "type": "string",
            "description": "Identifier of the user who made the edit."
          }
        },
        "required": ["edit_id", "type", "timestamp"]
      }
    }
  },
  "required": ["project_id", "media", "transcript"]
}
segment_id|start_time|end_time|speaker|text|word1,start1,end1;word2,start2,end2;...;wordN,startN,endN
s1|64.261|66.862|SPEAKER_00|Finding exposure on my face.|Finding,64.261,64.801;exposure,65.022,65.822;on,65.842,65.902;my,66.322,66.502;face.,66.562,66.862
s2|19.526|24.089|SPEAKER_00|But I wanna do this video for you guys to talk about a few things.|But,19.526,19.666;I,19.846,20.227;wanna,20.447,20.707;do,20.727,20.847;this,20.887,21.027;video,21.107,21.447;for,21.507,21.648;you,21.688,21.808;guys,21.828,22.168;to,22.228,22.488;talk,22.608,22.868;about,22.908,23.209;a,23.229,23.249;few,23.529,23.689;things,23.729,24.089
