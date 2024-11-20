# Transcript Processing API

This API allows you to upload, process, and manage transcript files in various formats.

## API Endpoints

### Upload and Process File

Upload a file to be processed and converted into our standard transcript format.

```bash
curl -X POST "http://localhost:8000/api/v1/upload" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@/path/to/your/file.txt"
     ```
Replace /path/to/your/file.txt with the actual path to the file you want to upload. Supported file types include .txt, .docx, .pdf, .json, and .srtx.

Get Project Details
Retrieve details for a specific project.
     ```
curl -X GET "http://localhost:8000/api/v1/projects/{project_id}"
     ```
Replace {project_id} with the actual ID of the project you want to retrieve.

Update Project
Update an existing project.
     ```
curl -X PUT "http://localhost:8000/api/v1/projects/{project_id}" \
     -H "Content-Type: application/json" \
     -d '{"key": "value"}'
          ```
Replace {project_id} with the ID of the project you want to update, and provide the update data in the request body.

Delete Project
Delete a specific project.
     ```
curl -X DELETE "http://localhost:8000/api/v1/projects/{project_id}"
     ```
Replace {project_id} with the ID of the project you want to delete.

Health Check
Check the health status of the API.
     ```
curl -X GET "http://localhost:8000/api/v1/health"
     ```
Response Format
All successful responses will be in JSON format. Here's an example of the structure for a processed transcript:
     ```
{
  "project_id": "unique-project-id",
  "media": {
    "id": "unique-media-id",
    "source": "filename.txt",
    "duration": 300.5,
    "uploaded_on": "2023-06-15T10:30:00Z"
  },
  "transcript": {
    "segments": [
      {
        "segment_id": "segment1",
        "start_time": 0.0,
        "end_time": 5.2,
        "text": "This is the transcribed text.",
        "speaker": "Speaker 1",
        "words": [
          {
            "word": "This",
            "start": 0.0,
            "end": 0.5,
            "confidence": 0.98
          },
          // ... more words ...
        ]
      },
      // ... more segments ...
    ]
  },
  "edits": []
}
     ```
Error Handling
In case of errors, the API will return appropriate HTTP status codes along with error messages in the response body.

For example:
     ```
{
  "detail": "Unsupported file type: .wav"
}
     ```
Notes
Ensure that your server is running before making requests.
The default server address is http://localhost:8000. Adjust this in the curl commands if your server is hosted elsewhere.
Some endpoints may require authentication in a production environment.