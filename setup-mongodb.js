// MongoDB Setup and Data Addition Script
// Run with: node setup-mongodb.js

const https = require('https');

const BASE_URL = 'https://script-bioa.vercel.app';

// Sample data to add to MongoDB
const sampleData = [
  {
    app: "WhatsApp",
    title: "New Message from John",
    content: "Hey! How are you doing today?"
  },
  {
    app: "Gmail",
    title: "Meeting Reminder",
    content: "Team meeting in 30 minutes. Don't forget to prepare your presentation."
  },
  {
    app: "Instagram",
    title: "New Story from Sarah",
    content: "Sarah posted a new story - check it out!"
  },
  {
    app: "Twitter",
    title: "Trending Topic",
    content: "Breaking news: Major technology announcement coming soon!"
  },
  {
    app: "Slack",
    title: "New Message in #general",
    content: "Project update: Phase 1 completed successfully!"
  },
  {
    app: "LinkedIn",
    title: "New Connection Request",
    content: "Jane Smith wants to connect with you on LinkedIn"
  },
  {
    app: "YouTube",
    title: "New Upload from Favorite Channel",
    content: "New video: 'How to Build Amazing Apps' just uploaded!"
  },
  {
    app: "TikTok",
    title: "Trending Video",
    content: "Check out this viral dance challenge!"
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

async function addDataToMongoDB() {
  console.log('🚀 Adding Sample Data to MongoDB...\n');
  
  let successCount = 0;
  let totalCount = sampleData.length;
  
  for (let i = 0; i < sampleData.length; i++) {
    const notification = sampleData[i];
    
    try {
      console.log(`📤 Adding ${i + 1}/${totalCount}: [${notification.app}] ${notification.title}`);
      
      const response = await makeRequest(`${BASE_URL}/api/notify-mongo`, {
        method: 'POST',
        body: notification
      });
      
      if (response.data.message.includes('MongoDB')) {
        console.log(`   ✅ Success: ${response.data.message}`);
        successCount++;
      } else {
        console.log(`   ⚠️  Fallback: ${response.data.message}`);
      }
      
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Results: ${successCount}/${totalCount} notifications added`);
  
  // Fetch all notifications
  console.log('\n📥 Fetching all notifications from MongoDB...');
  try {
    const fetchResponse = await makeRequest(`${BASE_URL}/api/notifications-mongo`);
    console.log(`📱 Total notifications: ${fetchResponse.data.count}`);
    console.log(`📝 Message: ${fetchResponse.data.message}`);
    
    if (fetchResponse.data.notifications && fetchResponse.data.notifications.length > 0) {
      console.log('\n📋 Recent notifications:');
      fetchResponse.data.notifications.slice(0, 5).forEach((n, i) => {
        console.log(`   ${i + 1}. [${n.app}] ${n.title}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error fetching notifications:', error.message);
  }
  
  console.log('\n🎉 Data addition completed!');
  console.log('\n📱 View your notifications at: https://script-bioa.vercel.app/');
}

async function checkMongoDBStatus() {
  console.log('🔍 Checking MongoDB Status...\n');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/notifications-mongo`);
    
    if (response.data.message.includes('MongoDB')) {
      console.log('✅ MongoDB is connected and working!');
      console.log(`📊 Current notifications: ${response.data.count}`);
      return true;
    } else {
      console.log('❌ MongoDB not configured yet');
      console.log('\n📋 To enable MongoDB:');
      console.log('1. Go to https://vercel.com/dashboard');
      console.log('2. Find your project: script-bioa');
      console.log('3. Settings → Environment Variables');
      console.log('4. Add: MONGODB_URI = mongodb+srv://dbuser:Bil@l112@cluster0.ey6gj6g.mongodb.net/notifications?retryWrites=true&w=majority');
      console.log('5. Redeploy the project');
      return false;
    }
  } catch (error) {
    console.error('❌ Error checking MongoDB status:', error.message);
    return false;
  }
}

async function main() {
  const isMongoWorking = await checkMongoDBStatus();
  
  if (isMongoWorking) {
    console.log('\n' + '='.repeat(50));
    await addDataToMongoDB();
  } else {
    console.log('\n💡 Please set up MongoDB first, then run this script again.');
  }
}

main().catch(console.error); 