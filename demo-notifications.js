// Demo script to show notifications working
// Run with: node demo-notifications.js

const https = require('https');

const BASE_URL = 'https://script-bioa.vercel.app';

const demoNotifications = [
  {
    app: "Demo App",
    title: "Welcome!",
    content: "This is your first notification"
  },
  {
    app: "Demo App", 
    title: "System Status",
    content: "All systems are running smoothly"
  },
  {
    app: "Demo App",
    title: "Feature Update",
    content: "New notification features are now available"
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

async function sendNotification(notification) {
  try {
    const response = await makeRequest(`${BASE_URL}/api/notify`, {
      method: 'POST',
      body: notification
    });

    console.log(`✅ Sent: [${notification.app}] ${notification.title}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to send ${notification.app}:`, error.message);
    return null;
  }
}

async function fetchNotifications() {
  try {
    const response = await makeRequest(`${BASE_URL}/api/notifications`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch notifications:', error.message);
    return { count: 0, notifications: [] };
  }
}

async function runDemo() {
  console.log('🎬 Starting Notification Demo...\n');
  
  // Send notifications one by one
  for (let i = 0; i < demoNotifications.length; i++) {
    const notification = demoNotifications[i];
    
    console.log(`📤 Sending notification ${i + 1}/${demoNotifications.length}...`);
    await sendNotification(notification);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to fetch notifications immediately after sending
    console.log('📥 Fetching notifications...');
    const result = await fetchNotifications();
    
    console.log(`📊 Found ${result.count} notifications`);
    if (result.notifications && result.notifications.length > 0) {
      console.log('📋 Recent notifications:');
      result.notifications.slice(0, 3).forEach((n, idx) => {
        console.log(`   ${idx + 1}. [${n.app}] ${n.title}: ${n.content}`);
      });
    } else {
      console.log('   No notifications found (this is expected on Vercel due to ephemeral storage)');
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('🎉 Demo completed!');
  console.log('\n📱 View the web interface at: https://script-bioa.vercel.app/view.html');
  console.log('\n💡 Note: On Vercel, notifications are stored in ephemeral storage');
  console.log('   and may not persist between function invocations.');
  console.log('   For production use, consider using a database like Vercel Postgres.');
}

runDemo().catch(console.error); 