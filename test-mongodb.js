// Test script for MongoDB notification API
// Run with: node test-mongodb.js

const https = require('https');

const BASE_URL = 'https://script-bioa.vercel.app';

const mongoTestNotifications = [
  {
    app: "MongoDB Test",
    title: "First MongoDB Notification",
    content: "This notification is saved to MongoDB Atlas!"
  },
  {
    app: "MongoDB Test",
    title: "Persistent Storage",
    content: "This notification will survive server restarts"
  },
  {
    app: "MongoDB Test",
    title: "Real Database",
    content: "No more ephemeral storage - data is permanent!"
  },
  {
    app: "WhatsApp",
    title: "MongoDB Integration",
    content: "WhatsApp notifications now saved to MongoDB"
  },
  {
    app: "Gmail",
    title: "Database Test",
    content: "Gmail notifications working with MongoDB"
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

async function sendMongoNotification(notification) {
  try {
    const response = await makeRequest(`${BASE_URL}/api/notify-mongo`, {
      method: 'POST',
      body: notification
    });

    console.log(`✅ [${notification.app}] ${notification.title}`);
    console.log(`   Response: ${response.data.message}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to send ${notification.app}:`, error.message);
    return null;
  }
}

async function fetchMongoNotifications() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/notifications-mongo`);
    console.log(`📱 MongoDB notifications: ${response.data.count}`);
    console.log(`   Message: ${response.data.message}`);
    return response.data.notifications || [];
  } catch (error) {
    console.error('❌ Failed to fetch MongoDB notifications:', error.message);
    return [];
  }
}

async function testMongoDB() {
  console.log('🚀 Testing MongoDB Integration...\n');
  
  // Send notifications to MongoDB
  console.log('📤 Sending notifications to MongoDB...');
  for (const notification of mongoTestNotifications) {
    await sendMongoNotification(notification);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📥 Fetching notifications from MongoDB...');
  const notifications = await fetchMongoNotifications();
  
  if (notifications.length > 0) {
    console.log('\n📋 Recent MongoDB notifications:');
    notifications.slice(0, 3).forEach((n, i) => {
      console.log(`   ${i + 1}. [${n.app}] ${n.title}: ${n.content}`);
    });
  }
  
  console.log('\n🎉 MongoDB test completed!');
  console.log('\n📱 View MongoDB notifications at: https://script-bioa.vercel.app/');
  console.log('\n💡 Note: If you see "MongoDB not configured", follow the setup guide in MONGODB_SETUP.md');
}

testMongoDB().catch(console.error); 