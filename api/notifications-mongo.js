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

// Sample notifications for fallback
const sampleNotifications = [
  {
    id: 'demo-1',
    app: 'WhatsApp',
    title: 'Welcome to Your Mobile App Logging System!',
    content: 'This is a demo notification. Send real mobile app logs using the API.',
    timestamp: new Date().toISOString(),
    logLevel: 'info',
    category: 'notification'
  },
  {
    id: 'demo-2',
    app: 'Gmail',
    title: 'System Status',
    content: 'Your mobile app logging server is running perfectly!',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    logLevel: 'info',
    category: 'system'
  },
  {
    id: 'demo-3',
    app: 'Instagram',
    title: 'Getting Started',
    content: 'Use the enhanced API to send detailed mobile app logs and notifications.',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    logLevel: 'info',
    category: 'notification'
  }
];

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    // Handle DELETE request to clear all logs
    try {
      const mongoClient = await connectToMongo();
      const database = mongoClient.db('notifications');
      const collection = database.collection('notifications');
      
      const result = await collection.deleteMany({});
      
      res.status(200).json({
        message: `Successfully cleared ${result.deletedCount} logs from MongoDB`,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      console.error('Error clearing logs from MongoDB:', error);
      res.status(500).json({ error: 'Failed to clear logs' });
    }
    return;
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Connect to MongoDB
    const mongoClient = await connectToMongo();
    const database = mongoClient.db('notifications');
    const collection = database.collection('notifications');

    // Enhanced query parameters for mobile app logging
    const { 
      limit, 
      app, 
      sort = 'desc',
      logLevel,
      category,
      deviceId,
      userId,
      sessionId,
      screen,
      action,
      errorCode,
      startDate,
      endDate,
      search
    } = req.query;

    // Build enhanced query
    let query = {};
    
    // Basic filters
    if (app) {
      query.app = { $regex: app, $options: 'i' }; // Case-insensitive search
    }
    
    // Mobile app specific filters
    if (logLevel) {
      query.logLevel = logLevel;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (deviceId) {
      query.deviceId = deviceId;
    }
    
    if (userId) {
      query.userId = userId;
    }
    
    if (sessionId) {
      query.sessionId = sessionId;
    }
    
    if (screen) {
      query.screen = { $regex: screen, $options: 'i' };
    }
    
    if (action) {
      query.action = { $regex: action, $options: 'i' };
    }
    
    if (errorCode) {
      query.errorCode = errorCode;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }
    
    // Text search across title and content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { errorContext: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sortOrder = sort === 'asc' ? 1 : -1;
    const sortQuery = { timestamp: sortOrder };

    // Build options
    const options = { sort: sortQuery };
    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        options.limit = limitNum;
      }
    }

    // Fetch notifications from MongoDB
    const cursor = collection.find(query, options);
    const notifications = await cursor.toArray();

    // Transform MongoDB documents to match our API format
    const transformedNotifications = notifications.map(doc => ({
      id: doc._id.toString(),
      app: doc.app,
      title: doc.title,
      content: doc.content,
      timestamp: doc.timestamp.toISOString(),
      logLevel: doc.logLevel,
      category: doc.category,
      deviceId: doc.deviceId,
      userId: doc.userId,
      sessionId: doc.sessionId,
      appVersion: doc.appVersion,
      osVersion: doc.osVersion,
      deviceModel: doc.deviceModel,
      screen: doc.screen,
      action: doc.action,
      metadata: doc.metadata,
      errorCode: doc.errorCode,
      errorStack: doc.errorStack,
      errorContext: doc.errorContext,
      duration: doc.duration,
      memoryUsage: doc.memoryUsage,
      networkStatus: doc.networkStatus,
      location: doc.location
    }));

    res.status(200).json({
      count: transformedNotifications.length,
      notifications: transformedNotifications,
      message: transformedNotifications.length > 0 
        ? 'Mobile app logs retrieved from MongoDB' 
        : 'No mobile app logs found in MongoDB',
      filters: {
        app: app || null,
        logLevel: logLevel || null,
        category: category || null,
        deviceId: deviceId || null,
        userId: userId || null,
        search: search || null
      }
    });

  } catch (error) {
    console.error('Error reading mobile app logs from MongoDB:', error);
    
    // Fallback to demo notifications if MongoDB fails
    res.status(200).json({
      count: sampleNotifications.length,
      notifications: sampleNotifications,
      message: 'Demo mobile app logs (MongoDB not configured)'
    });
  }
} 