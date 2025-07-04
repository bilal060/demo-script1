import fs from 'fs';
import path from 'path';

const filePath = path.resolve('/tmp', 'notifications.json');

// Sample notifications for demonstration
const sampleNotifications = [
  {
    id: 'demo-1',
    app: 'WhatsApp',
    title: 'Welcome to Your Notification System!',
    content: 'This is a demo notification. Send real notifications using the API.',
    timestamp: new Date().toISOString()
  },
  {
    id: 'demo-2',
    app: 'Gmail',
    title: 'System Status',
    content: 'Your notification server is running perfectly!',
    timestamp: new Date(Date.now() - 60000).toISOString()
  },
  {
    id: 'demo-3',
    app: 'Instagram',
    title: 'Getting Started',
    content: 'Use curl or the test scripts to send real notifications.',
    timestamp: new Date(Date.now() - 120000).toISOString()
  }
];

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('No notifications file found, returning demo notifications');
      return res.status(200).json({
        count: sampleNotifications.length,
        notifications: sampleNotifications,
        message: 'Demo notifications (send real ones via API)'
      });
    }

    // Read and parse notifications
    const data = fs.readFileSync(filePath, 'utf8');
    let notifications = [];
    
    try {
      notifications = JSON.parse(data);
      if (!Array.isArray(notifications)) {
        notifications = [];
      }
    } catch (parseError) {
      console.error('Error parsing notifications file:', parseError);
      notifications = [];
    }

    // If no real notifications, return demo ones
    if (notifications.length === 0) {
      return res.status(200).json({
        count: sampleNotifications.length,
        notifications: sampleNotifications,
        message: 'Demo notifications (send real ones via API)'
      });
    }

    // Handle query parameters
    const { limit, app, sort = 'desc' } = req.query;

    // Filter by app if specified
    if (app) {
      notifications = notifications.filter(n => 
        n.app && n.app.toLowerCase().includes(app.toLowerCase())
      );
    }

    // Sort notifications (newest first by default)
    notifications.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sort === 'asc' ? dateA - dateB : dateB - dateA;
    });

    // Apply limit if specified
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        notifications = notifications.slice(0, limitNum);
      }
    }

    res.status(200).json({
      count: notifications.length,
      notifications,
      message: notifications.length > 0 ? 'Notifications retrieved successfully' : 'No notifications found'
    });
  } catch (error) {
    console.error('Error reading notifications:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to read notifications',
      count: 0,
      notifications: []
    });
  }
}
