// Test script for the notification API
// Run with: node test-notifications.js

const https = require('https');
const http = require('http');

const BASE_URL = 'https://script-bioa.vercel.app'; // Your Vercel URL

const sampleNotifications = [
  {
    app: "WhatsApp",
    title: "New Message",
    content: "John Doe: Hey, how are you doing?"
  },
  {
    app: "Gmail",
    title: "New Email",
    content: "Meeting reminder for tomorrow at 2 PM"
  },
  {
    app: "Instagram",
    title: "New Follow",
    content: "jane_smith started following you"
  },
  {
    app: "Twitter",
    title: "New Tweet",
    content: "Breaking news: Major announcement coming soon!"
  },
  {
    app: "Slack",
    title: "New Message in #general",
    content: "Team meeting in 5 minutes"
  }
];

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
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

async function sendNotification(notification) {
  try {
    const response = await makeRequest(`${BASE_URL}/api/notify`, {
      method: 'POST',
      body: notification
    });

    console.log(`✅ Sent notification from ${notification.app}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to send notification from ${notification.app}:`, error.message);
    return null;
  }
}

async function fetchAllNotifications() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/notifications`);
    console.log(`📱 Total notifications: ${response.data.count || 0}`);
    return response.data.notifications || [];
  } catch (error) {
    console.error('❌ Failed to fetch notifications:', error.message);
    return [];
  }
}

async function testNotifications() {
  console.log('🚀 Starting notification test...\n');

  // Send sample notifications
  console.log('📤 Sending sample notifications...');
  for (const notification of sampleNotifications) {
    await sendNotification(notification);
    // Wait a bit between notifications
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📥 Fetching all notifications...');
  const notifications = await fetchAllNotifications();
  
  if (notifications.length > 0) {
    console.log('\n📋 Recent notifications:');
    notifications.slice(0, 3).forEach((n, i) => {
      console.log(`${i + 1}. [${n.app}] ${n.title}: ${n.content}`);
    });
  }

  console.log('\n✅ Test completed!');
}

// Run the test
testNotifications().catch(console.error); 