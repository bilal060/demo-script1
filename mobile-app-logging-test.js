// Mobile App Logging Test Script
// Demonstrates comprehensive mobile app monitoring capabilities
// Run with: node mobile-app-logging-test.js

const https = require('https');

const BASE_URL = 'https://script-bioa.vercel.app';

// Sample mobile app logs with different scenarios
const mobileAppLogs = [
  // User interaction logs
  {
    app: "MyApp",
    title: "User Login",
    content: "User successfully logged in",
    logLevel: "info",
    category: "user_action",
    userId: "user123",
    deviceId: "device_iphone_14",
    sessionId: "session_abc123",
    appVersion: "1.2.3",
    osVersion: "iOS 17.0",
    deviceModel: "iPhone 14",
    screen: "LoginScreen",
    action: "login",
    metadata: {
      loginMethod: "email",
      loginTime: "2.3s"
    }
  },
  
  // Error logs
  {
    app: "MyApp",
    title: "Network Error",
    content: "Failed to fetch user data",
    logLevel: "error",
    category: "error",
    userId: "user123",
    deviceId: "device_iphone_14",
    sessionId: "session_abc123",
    appVersion: "1.2.3",
    osVersion: "iOS 17.0",
    deviceModel: "iPhone 14",
    screen: "ProfileScreen",
    action: "fetch_profile",
    errorCode: "NETWORK_TIMEOUT",
    errorStack: "NetworkError: Request timeout at fetchUserData.js:45",
    errorContext: "User was viewing profile when network failed",
    networkStatus: "wifi",
    metadata: {
      retryCount: 3,
      endpoint: "/api/user/profile"
    }
  },
  
  // Performance logs
  {
    app: "MyApp",
    title: "Image Load Performance",
    content: "Profile image loaded successfully",
    logLevel: "info",
    category: "performance",
    userId: "user123",
    deviceId: "device_iphone_14",
    sessionId: "session_abc123",
    appVersion: "1.2.3",
    osVersion: "iOS 17.0",
    deviceModel: "iPhone 14",
    screen: "ProfileScreen",
    action: "load_image",
    duration: 1250, // milliseconds
    memoryUsage: "45MB",
    metadata: {
      imageSize: "2.3MB",
      cacheHit: false
    }
  },
  
  // System logs
  {
    app: "MyApp",
    title: "App Backgrounded",
    content: "Application moved to background",
    logLevel: "info",
    category: "system",
    userId: "user123",
    deviceId: "device_iphone_14",
    sessionId: "session_abc123",
    appVersion: "1.2.3",
    osVersion: "iOS 17.0",
    deviceModel: "iPhone 14",
    screen: "HomeScreen",
    action: "app_background",
    metadata: {
      backgroundTime: new Date().toISOString(),
      batteryLevel: "78%"
    }
  },
  
  // Location-based logs
  {
    app: "MyApp",
    title: "Location Updated",
    content: "User location changed",
    logLevel: "info",
    category: "event",
    userId: "user123",
    deviceId: "device_iphone_14",
    sessionId: "session_abc123",
    appVersion: "1.2.3",
    osVersion: "iOS 17.0",
    deviceModel: "iPhone 14",
    screen: "MapScreen",
    action: "location_update",
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10
    },
    metadata: {
      locationSource: "GPS",
      locationAge: "5s"
    }
  },
  
  // Warning logs
  {
    app: "MyApp",
    title: "Low Memory Warning",
    content: "Device memory is running low",
    logLevel: "warning",
    category: "system",
    userId: "user123",
    deviceId: "device_iphone_14",
    sessionId: "session_abc123",
    appVersion: "1.2.3",
    osVersion: "iOS 17.0",
    deviceModel: "iPhone 14",
    screen: "GalleryScreen",
    action: "memory_warning",
    memoryUsage: "85MB",
    metadata: {
      availableMemory: "15MB",
      actionTaken: "cleared_image_cache"
    }
  },
  
  // Debug logs
  {
    app: "MyApp",
    title: "API Request Debug",
    content: "Making API request to /api/posts",
    logLevel: "debug",
    category: "event",
    userId: "user123",
    deviceId: "device_iphone_14",
    sessionId: "session_abc123",
    appVersion: "1.2.3",
    osVersion: "iOS 17.0",
    deviceModel: "iPhone 14",
    screen: "FeedScreen",
    action: "api_request",
    networkStatus: "wifi",
    metadata: {
      endpoint: "/api/posts",
      method: "GET",
      headers: { "Authorization": "Bearer ***" }
    }
  },
  
  // Notification logs
  {
    app: "MyApp",
    title: "Push Notification Received",
    content: "New message from John Doe",
    logLevel: "info",
    category: "notification",
    userId: "user123",
    deviceId: "device_iphone_14",
    sessionId: "session_abc123",
    appVersion: "1.2.3",
    osVersion: "iOS 17.0",
    deviceModel: "iPhone 14",
    screen: "ChatScreen",
    action: "push_notification",
    metadata: {
      notificationType: "message",
      senderId: "john_doe",
      messageId: "msg_456"
    }
  }
];

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function sendMobileAppLog(log) {
  try {
    const response = await makeRequest(`${BASE_URL}/api/notify-mongo`, {
      method: 'POST',
      body: log
    });

    const levelEmoji = {
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️',
      'debug': '🔍'
    };

    console.log(`${levelEmoji[log.logLevel] || '📝'} [${log.app}] ${log.title}`);
    console.log(`   Category: ${log.category} | Level: ${log.logLevel}`);
    console.log(`   Device: ${log.deviceModel} | User: ${log.userId}`);
    console.log(`   Screen: ${log.screen} | Action: ${log.action}`);
    
    if (log.errorCode) {
      console.log(`   Error: ${log.errorCode}`);
    }
    
    if (log.duration) {
      console.log(`   Duration: ${log.duration}ms`);
    }
    
    console.log('');
    
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to send log from ${log.app}:`, error.message);
    return null;
  }
}

async function fetchMobileAppLogs(filters = {}) {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    const url = `${BASE_URL}/api/notifications-mongo${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await makeRequest(url);
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch mobile app logs:', error.message);
    return { count: 0, notifications: [] };
  }
}

async function testMobileAppLogging() {
  console.log('🚀 Mobile App Logging System Test');
  console.log('==================================\n');
  
  // Send all mobile app logs
  console.log('📤 Sending mobile app logs...\n');
  for (let i = 0; i < mobileAppLogs.length; i++) {
    const log = mobileAppLogs[i];
    console.log(`📝 Log ${i + 1}/${mobileAppLogs.length}:`);
    await sendMobileAppLog(log);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('📥 Fetching all mobile app logs...\n');
  const allLogs = await fetchMobileAppLogs();
  console.log(`📊 Total logs: ${allLogs.count}`);
  
  // Test different filters
  console.log('\n🔍 Testing filters...\n');
  
  // Filter by log level
  console.log('📋 Error logs only:');
  const errorLogs = await fetchMobileAppLogs({ logLevel: 'error' });
  console.log(`   Found ${errorLogs.count} error logs\n`);
  
  // Filter by category
  console.log('📋 User action logs only:');
  const userActionLogs = await fetchMobileAppLogs({ category: 'user_action' });
  console.log(`   Found ${userActionLogs.count} user action logs\n`);
  
  // Filter by device
  console.log('📋 Logs from specific device:');
  const deviceLogs = await fetchMobileAppLogs({ deviceId: 'device_iphone_14' });
  console.log(`   Found ${deviceLogs.count} logs from device_iphone_14\n`);
  
  // Filter by user
  console.log('📋 Logs from specific user:');
  const userLogs = await fetchMobileAppLogs({ userId: 'user123' });
  console.log(`   Found ${userLogs.count} logs from user123\n`);
  
  // Search functionality
  console.log('📋 Search for "network":');
  const searchLogs = await fetchMobileAppLogs({ search: 'network' });
  console.log(`   Found ${searchLogs.count} logs containing "network"\n`);
  
  // Date range (last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  console.log('📋 Logs from last hour:');
  const recentLogs = await fetchMobileAppLogs({ startDate: oneHourAgo });
  console.log(`   Found ${recentLogs.count} logs from last hour\n`);
  
  console.log('🎉 Mobile app logging test completed!');
  console.log('\n📱 View your mobile app logs at: https://script-bioa.vercel.app/');
  console.log('\n💡 API Endpoints:');
  console.log('   POST /api/notify-mongo - Send mobile app logs');
  console.log('   GET  /api/notifications-mongo - Fetch logs with filters');
  console.log('\n🔧 Available filters:');
  console.log('   - logLevel: error, warning, info, debug');
  console.log('   - category: notification, error, event, user_action, system, performance');
  console.log('   - deviceId, userId, sessionId, screen, action, errorCode');
  console.log('   - startDate, endDate, search');
}

// Run the test
testMobileAppLogging().catch(console.error); 