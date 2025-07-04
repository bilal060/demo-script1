// Test MongoDB connection and collection creation
// Run with: node test-mongo-connection.js

const https = require('https');

const BASE_URL = 'https://script-bioa.vercel.app';

async function testMongoConnection() {
  console.log('🔍 Testing MongoDB Connection...\n');
  
  // Test 1: Send a notification
  console.log('📤 Sending test notification...');
  try {
    const response = await makeRequest(`${BASE_URL}/api/notify-mongo`, {
      method: 'POST',
      body: {
        app: 'MongoDB Test',
        title: 'Connection Test',
        content: 'Testing if MongoDB connection works'
      }
    });
    
    console.log('✅ Send Response:', response.data.message);
    
    // Test 2: Fetch notifications
    console.log('\n📥 Fetching notifications...');
    const fetchResponse = await makeRequest(`${BASE_URL}/api/notifications-mongo`);
    
    console.log('✅ Fetch Response:', fetchResponse.data.message);
    console.log('📊 Count:', fetchResponse.data.count);
    
    if (fetchResponse.data.message.includes('MongoDB')) {
      console.log('🎉 MongoDB is working!');
    } else {
      console.log('❌ MongoDB not configured yet');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

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

testMongoConnection().catch(console.error); 