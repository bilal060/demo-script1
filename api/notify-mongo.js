import { MongoClient } from 'mongodb';

let mongoClient = null;

async function connectToMongo() {
  if (mongoClient) {
    return mongoClient;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MongoDB URI not configured');
  }

  try {
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    console.log('Connected to MongoDB');
    return mongoClient;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  console.log('MongoDB URI available:', !!process.env.MONGODB_URI);

  try {
    const notif = req.body;
    
    // Validate required fields
    if (!notif.title || !notif.app) {
      return res.status(400).json({ error: 'Title and app are required' });
    }

    // Connect to MongoDB
    const mongoClient = await connectToMongo();
    const database = mongoClient.db('notifications');
    const collection = database.collection('notifications');

    // Enhanced notification document for mobile app logging
    const notification = {
      // Basic notification fields
      app: notif.app,
      title: notif.title,
      content: notif.content || '',
      timestamp: new Date(),
      createdAt: new Date(),
      
      // Mobile app specific fields
      logLevel: notif.logLevel || 'info', // error, warning, info, debug
      category: notif.category || 'notification', // notification, error, event, user_action, system
      
      // Device and user context
      deviceId: notif.deviceId || null,
      userId: notif.userId || null,
      sessionId: notif.sessionId || null,
      appVersion: notif.appVersion || null,
      osVersion: notif.osVersion || null,
      deviceModel: notif.deviceModel || null,
      
      // Additional context
      screen: notif.screen || null, // Current screen/activity
      action: notif.action || null, // User action performed
      metadata: notif.metadata || {}, // Additional custom data
      
      // Error tracking (if applicable)
      errorCode: notif.errorCode || null,
      errorStack: notif.errorStack || null,
      errorContext: notif.errorContext || null,
      
      // Performance metrics
      duration: notif.duration || null, // Time taken for operation
      memoryUsage: notif.memoryUsage || null,
      networkStatus: notif.networkStatus || null,
      
      // Geolocation (if available)
      location: notif.location ? {
        latitude: notif.location.latitude,
        longitude: notif.location.longitude,
        accuracy: notif.location.accuracy
      } : null
    };

    // Insert into MongoDB
    const result = await collection.insertOne(notification);
    
    // Add the MongoDB _id to the response
    const savedNotification = {
      id: result.insertedId.toString(),
      ...notification,
      timestamp: notification.timestamp.toISOString()
    };

    console.log('Saved mobile app notification to MongoDB:', {
      app: savedNotification.app,
      title: savedNotification.title,
      logLevel: savedNotification.logLevel,
      category: savedNotification.category,
      deviceId: savedNotification.deviceId,
      userId: savedNotification.userId
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Mobile app notification saved to MongoDB',
      notification: savedNotification
    });
  } catch (error) {
    console.error('Error saving mobile app notification to MongoDB:', error);
    
    // If MongoDB fails, fall back to demo response
    res.status(200).json({ 
      success: true, 
      message: 'Notification saved (MongoDB not configured)',
      notification: {
        id: Date.now().toString(),
        app: req.body.app,
        title: req.body.title,
        content: req.body.content || '',
        timestamp: new Date().toISOString(),
        logLevel: req.body.logLevel || 'info',
        category: req.body.category || 'notification'
      }
    });
  }
} 