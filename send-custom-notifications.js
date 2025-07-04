// Send custom notifications
// Run with: node send-custom-notifications.js

const https = require('https');

const BASE_URL = 'https://script-bioa.vercel.app';

const customNotifications = [
  {
    app: "Instagram",
    title: "New Story",
    content: "Your friend Sarah posted a new story"
  },
  {
    app: "WhatsApp",
    title: "Group Message",
    content: "Family Group: Mom: Don't forget dinner tonight!"
  },
  {
    app: "Gmail",
    title: "Important Email",
    content: "Your order #12345 has been shipped and will arrive tomorrow"
  },
  {
    app: "Twitter",
    title: "Trending Topic",
    content: "Breaking: New technology breakthrough announced"
  },
  {
    app: "Slack",
    title: "Direct Message",
    content: "Boss: Can you review the latest project proposal?"
  },
  {
    app: "Facebook",
    title: "Birthday Reminder",
    content: "Today is John's birthday. Don't forget to wish them!"
  },
  {
    app: "LinkedIn",
    title: "New Connection",
    content: "Jane Smith wants to connect with you"
  },
  {
    app: "YouTube",
    title: "New Upload",
    content: "Your favorite channel just uploaded: 'How to Code Better'"
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

    console.log(`✅ [${notification.app}] ${notification.title}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to send ${notification.app}:`, error.message);
    return null;
  }
}

async function sendAllNotifications() {
  console.log('🚀 Sending custom notifications...\n');
  
  for (const notification of customNotifications) {
    await sendNotification(notification);
    // Wait a bit between notifications
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('\n🎉 All notifications sent!');
  console.log('\n📱 View them at: https://script-bioa.vercel.app/view.html');
}

sendAllNotifications().catch(console.error); 