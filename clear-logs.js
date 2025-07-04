const { MongoClient } = require('mongodb');

async function clearLogs() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const database = client.db('notification_logs');
        const collection = database.collection('notifications');

        // Clear all documents from the collection
        const result = await collection.deleteMany({});
        
        console.log(`✅ Successfully cleared ${result.deletedCount} notification logs from the database`);
        
    } catch (error) {
        console.error('❌ Error clearing logs:', error);
    } finally {
        await client.close();
        console.log('Disconnected from MongoDB');
    }
}

clearLogs(); 