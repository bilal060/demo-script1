# Mobile App Logging System

A comprehensive logging and monitoring system designed specifically for mobile applications. Capture logs, errors, user interactions, performance metrics, and system events from your mobile apps in real-time.

## 🚀 Features

### Core Logging Capabilities
- **Multi-level logging**: Error, Warning, Info, Debug
- **Categorized logs**: Notification, Error, Event, User Action, System, Performance
- **Device context**: Device ID, model, OS version, app version
- **User tracking**: User ID, session ID, screen tracking
- **Performance monitoring**: Duration, memory usage, network status
- **Error tracking**: Error codes, stack traces, context
- **Location data**: GPS coordinates with accuracy
- **Custom metadata**: Flexible JSON data for app-specific information

### Advanced Features
- **Real-time monitoring**: Auto-refresh web interface
- **Advanced filtering**: By log level, category, device, user, screen, date range
- **Search functionality**: Full-text search across titles and content
- **Statistics dashboard**: Error counts, user counts, device counts
- **Persistent storage**: MongoDB Atlas cloud database
- **RESTful API**: Easy integration with any mobile platform

## 📱 API Endpoints

### Send Mobile App Logs
```http
POST /api/notify-mongo
Content-Type: application/json

{
  "app": "MyApp",
  "title": "User Login",
  "content": "User successfully logged in",
  "logLevel": "info",
  "category": "user_action",
  "userId": "user123",
  "deviceId": "device_iphone_14",
  "sessionId": "session_abc123",
  "appVersion": "1.2.3",
  "osVersion": "iOS 17.0",
  "deviceModel": "iPhone 14",
  "screen": "LoginScreen",
  "action": "login",
  "metadata": {
    "loginMethod": "email",
    "loginTime": "2.3s"
  }
}
```

### Fetch Mobile App Logs
```http
GET /api/notifications-mongo?logLevel=error&category=error&deviceId=device_iphone_14&limit=10
```

## 🔧 Available Fields

### Required Fields
- `app` (string): Application name
- `title` (string): Log title/message

### Optional Fields

#### Basic Information
- `content` (string): Detailed log content
- `logLevel` (string): "error", "warning", "info", "debug"
- `category` (string): "notification", "error", "event", "user_action", "system", "performance"

#### Device & User Context
- `deviceId` (string): Unique device identifier
- `userId` (string): User identifier
- `sessionId` (string): Session identifier
- `appVersion` (string): App version
- `osVersion` (string): Operating system version
- `deviceModel` (string): Device model

#### Context Information
- `screen` (string): Current screen/activity
- `action` (string): User action performed
- `metadata` (object): Additional custom data

#### Error Tracking
- `errorCode` (string): Error code
- `errorStack` (string): Error stack trace
- `errorContext` (string): Error context description

#### Performance Metrics
- `duration` (number): Time taken in milliseconds
- `memoryUsage` (string): Memory usage information
- `networkStatus` (string): Network connection status

#### Location Data
- `location` (object): GPS coordinates
  - `latitude` (number): Latitude
  - `longitude` (number): Longitude
  - `accuracy` (number): GPS accuracy in meters

## 🔍 Query Parameters

### Filtering
- `app` (string): Filter by app name
- `logLevel` (string): Filter by log level
- `category` (string): Filter by category
- `deviceId` (string): Filter by device ID
- `userId` (string): Filter by user ID
- `sessionId` (string): Filter by session ID
- `screen` (string): Filter by screen name
- `action` (string): Filter by action
- `errorCode` (string): Filter by error code

### Search & Pagination
- `search` (string): Full-text search in title and content
- `limit` (number): Maximum number of results (1-100)
- `startDate` (ISO string): Start date for filtering
- `endDate` (ISO string): End date for filtering

### Sorting
- `sort` (string): "asc" or "desc" (default: "desc")

## 📊 Web Interface

### Main Dashboard
- **URL**: https://script-bioa.vercel.app/
- **Features**: Basic notification viewing

### Mobile Logs Viewer
- **URL**: https://script-bioa.vercel.app/mobile-logs
- **Features**: 
  - Advanced filtering by log level, category, device, user
  - Real-time statistics dashboard
  - Detailed log information with device context
  - Auto-refresh every 5 seconds
  - Search functionality
  - Performance metrics display

## 🛠️ Integration Examples

### iOS (Swift)
```swift
import Foundation

struct MobileAppLog {
    let app: String
    let title: String
    let content: String?
    let logLevel: String
    let category: String
    let userId: String?
    let deviceId: String
    let sessionId: String?
    let appVersion: String
    let osVersion: String
    let deviceModel: String
    let screen: String?
    let action: String?
    let metadata: [String: Any]?
}

class LoggingService {
    private let baseURL = "https://script-bioa.vercel.app"
    
    func sendLog(_ log: MobileAppLog) {
        guard let url = URL(string: "\(baseURL)/api/notify-mongo") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let logData: [String: Any] = [
            "app": log.app,
            "title": log.title,
            "content": log.content ?? "",
            "logLevel": log.logLevel,
            "category": log.category,
            "userId": log.userId ?? "",
            "deviceId": log.deviceId,
            "sessionId": log.sessionId ?? "",
            "appVersion": log.appVersion,
            "osVersion": log.osVersion,
            "deviceModel": log.deviceModel,
            "screen": log.screen ?? "",
            "action": log.action ?? "",
            "metadata": log.metadata ?? [:]
        ]
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: logData)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("Logging error: \(error)")
            }
        }.resume()
    }
}

// Usage
let loggingService = LoggingService()

let log = MobileAppLog(
    app: "MyApp",
    title: "User Login",
    content: "User successfully logged in",
    logLevel: "info",
    category: "user_action",
    userId: "user123",
    deviceId: UIDevice.current.identifierForVendor?.uuidString ?? "unknown",
    sessionId: UUID().uuidString,
    appVersion: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown",
    osVersion: UIDevice.current.systemVersion,
    deviceModel: UIDevice.current.model,
    screen: "LoginScreen",
    action: "login",
    metadata: ["loginMethod": "email"]
)

loggingService.sendLog(log)
```

### Android (Kotlin)
```kotlin
import android.content.Context
import android.os.Build
import android.provider.Settings
import com.google.gson.Gson
import okhttp3.*
import java.io.IOException

data class MobileAppLog(
    val app: String,
    val title: String,
    val content: String? = null,
    val logLevel: String,
    val category: String,
    val userId: String? = null,
    val deviceId: String,
    val sessionId: String? = null,
    val appVersion: String,
    val osVersion: String,
    val deviceModel: String,
    val screen: String? = null,
    val action: String? = null,
    val metadata: Map<String, Any>? = null
)

class LoggingService(private val context: Context) {
    private val baseURL = "https://script-bioa.vercel.app"
    private val client = OkHttpClient()
    private val gson = Gson()
    
    fun sendLog(log: MobileAppLog) {
        val url = "$baseURL/api/notify-mongo"
        val json = gson.toJson(log)
        
        val request = Request.Builder()
            .url(url)
            .post(RequestBody.create(MediaType.get("application/json"), json))
            .build()
        
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                println("Logging error: ${e.message}")
            }
            
            override fun onResponse(call: Call, response: Response) {
                // Handle response if needed
            }
        })
    }
    
    fun getDeviceId(): String {
        return Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ANDROID_ID
        )
    }
    
    fun getAppVersion(): String {
        return try {
            val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            packageInfo.versionName
        } catch (e: Exception) {
            "unknown"
        }
    }
}

// Usage
val loggingService = LoggingService(context)

val log = MobileAppLog(
    app = "MyApp",
    title = "User Login",
    content = "User successfully logged in",
    logLevel = "info",
    category = "user_action",
    userId = "user123",
    deviceId = loggingService.getDeviceId(),
    sessionId = java.util.UUID.randomUUID().toString(),
    appVersion = loggingService.getAppVersion(),
    osVersion = Build.VERSION.RELEASE,
    deviceModel = Build.MODEL,
    screen = "LoginScreen",
    action = "login",
    metadata = mapOf("loginMethod" to "email")
)

loggingService.sendLog(log)
```

### React Native
```javascript
import { Platform, Dimensions } from 'react-native';
import DeviceInfo from 'react-native-device-info';

class LoggingService {
  constructor() {
    this.baseURL = 'https://script-bioa.vercel.app';
  }

  async sendLog(logData) {
    const log = {
      app: 'MyApp',
      title: logData.title,
      content: logData.content,
      logLevel: logData.logLevel || 'info',
      category: logData.category || 'notification',
      userId: logData.userId,
      deviceId: await DeviceInfo.getUniqueId(),
      sessionId: logData.sessionId,
      appVersion: await DeviceInfo.getVersion(),
      osVersion: DeviceInfo.getSystemVersion(),
      deviceModel: DeviceInfo.getModel(),
      screen: logData.screen,
      action: logData.action,
      metadata: logData.metadata || {},
      ...logData
    };

    try {
      const response = await fetch(`${this.baseURL}/api/notify-mongo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(log),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Logging error:', error);
    }
  }
}

// Usage
const loggingService = new LoggingService();

loggingService.sendLog({
  title: 'User Login',
  content: 'User successfully logged in',
  logLevel: 'info',
  category: 'user_action',
  userId: 'user123',
  screen: 'LoginScreen',
  action: 'login',
  metadata: {
    loginMethod: 'email',
    loginTime: '2.3s'
  }
});
```

## 🧪 Testing

### Run Mobile App Logging Test
```bash
node mobile-app-logging-test.js
```

This test script demonstrates:
- Different log levels and categories
- Error tracking with stack traces
- Performance metrics
- Device and user context
- Location data
- Custom metadata
- Advanced filtering

### Manual Testing with curl
```bash
# Send a simple log
curl -X POST https://script-bioa.vercel.app/api/notify-mongo \
  -H "Content-Type: application/json" \
  -d '{
    "app": "TestApp",
    "title": "Test Log",
    "content": "This is a test log entry",
    "logLevel": "info",
    "category": "notification"
  }'

# Fetch logs with filters
curl "https://script-bioa.vercel.app/api/notifications-mongo?logLevel=error&limit=5"
```

## 📈 Monitoring & Analytics

### Key Metrics to Track
- **Error rates**: Monitor error logs by device, user, or screen
- **Performance**: Track duration and memory usage trends
- **User engagement**: Monitor user actions and screen usage
- **Device issues**: Identify problematic devices or OS versions
- **App crashes**: Track error patterns and stack traces

### Dashboard Features
- Real-time log streaming
- Error count statistics
- User and device counts
- Performance metrics visualization
- Advanced filtering and search
- Export capabilities

## 🔒 Security Considerations

- **Data privacy**: Ensure user consent for logging
- **Sensitive data**: Avoid logging passwords, tokens, or PII
- **Rate limiting**: Implement client-side rate limiting
- **Data retention**: Consider data retention policies
- **Access control**: Secure your MongoDB database

## 🚀 Deployment

The system is already deployed on Vercel at:
- **Main URL**: https://script-bioa.vercel.app/
- **Mobile Logs**: https://script-bioa.vercel.app/mobile-logs
- **API Base**: https://script-bioa.vercel.app/api/

### Environment Variables
- `MONGODB_URI`: MongoDB Atlas connection string

## 📞 Support

For questions or issues:
1. Check the web interface for real-time logs
2. Review the API documentation
3. Test with the provided examples
4. Monitor the MongoDB database directly

---

**Happy Logging! 📱📊** 