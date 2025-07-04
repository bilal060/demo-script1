import fs from 'fs';
import path from 'path';

const filePath = path.resolve('/tmp', 'notifications.json');

// In-memory storage for immediate access
let memoryStorage = [];

// Ensure the file exists
function ensureFileExists() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
}

// Read notifications from file
function readNotifications() {
  ensureFileExists();
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const fileData = JSON.parse(data);
    // Merge file data with memory storage
    const allNotifications = [...memoryStorage, ...fileData];
    return allNotifications;
  } catch (error) {
    console.error('Error reading notifications:', error);
    return memoryStorage;
  }
}

// Write notifications to file
function writeNotifications(notifications) {
  ensureFileExists();
  try {
    fs.writeFileSync(filePath, JSON.stringify(notifications, null, 2));
  } catch (error) {
    console.error('Error writing notifications:', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const notif = req.body;
    
    // Validate required fields
    if (!notif.title || !notif.app) {
      return res.status(400).json({ error: 'Title and app are required' });
    }

    // Add timestamp and ID
    const notification = {
      id: Date.now().toString(),
      ...notif,
      timestamp: new Date().toISOString()
    };

    // Add to memory storage for immediate access
    memoryStorage.push(notification);
    
    // Also try to save to file (for persistence across deployments)
    try {
      const fileNotifications = readNotifications();
      fileNotifications.push(notification);
      writeNotifications(fileNotifications);
    } catch (fileError) {
      console.log('File storage failed, using memory only:', fileError.message);
    }
    
    console.log('Received notification:', notification);
    res.status(200).json({ 
      success: true, 
      message: 'Notification saved',
      notification 
    });
  } catch (error) {
    console.error('Error saving notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
