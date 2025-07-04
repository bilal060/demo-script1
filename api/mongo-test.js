import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  const uri = process.env.MONGODB_URI;
  
  console.log('Testing MongoDB connection...');
  console.log('URI available:', !!uri);
  console.log('URI preview:', uri ? uri.substring(0, 30) + '...' : 'Not set');
  
  if (!uri) {
    return res.status(200).json({
      success: false,
      message: 'MONGODB_URI not found in environment variables',
      hasUri: false
    });
  }

  try {
    console.log('Attempting to connect to MongoDB...');
    const client = new MongoClient(uri);
    
    // Test connection
    await client.connect();
    console.log('MongoDB connection successful!');
    
    // Test database access
    const database = client.db('notifications');
    const collection = database.collection('notifications');
    
    // Test a simple operation
    const count = await collection.countDocuments();
    console.log('Collection document count:', count);
    
    await client.close();
    
    res.status(200).json({
      success: true,
      message: 'MongoDB connection successful!',
      hasUri: true,
      documentCount: count,
      database: 'notifications',
      collection: 'notifications'
    });
    
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    
    res.status(200).json({
      success: false,
      message: 'MongoDB connection failed',
      error: error.message,
      hasUri: true
    });
  }
} 