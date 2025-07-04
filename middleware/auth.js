const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// In-memory device registry (in production, use Redis or database)
const deviceRegistry = new Map();

// Middleware to validate device authentication
const authenticateDevice = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }
        
        const token = authHeader.substring(7); // Remove 'Bearer '
        const [apiKey, deviceId] = token.split(':');
        
        if (!apiKey || !deviceId) {
            return res.status(401).json({ error: 'Invalid token format' });
        }
        
        // Validate device ID format
        if (!/^[a-f0-9]{32}$/.test(deviceId)) {
            return res.status(401).json({ error: 'Invalid device ID format' });
        }
        
        // Store device info in request
        req.deviceId = deviceId;
        req.apiKey = apiKey;
        
        // Validate device
        if (!validateDevice(deviceId, apiKey)) {
            return res.status(401).json({
                success: false,
                message: 'Invalid device credentials'
            });
        }
        
        // Rate limiting check
        if (isRateLimited(deviceId)) {
            return res.status(429).json({
                success: false,
                message: 'Rate limit exceeded'
            });
        }
        
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

// Register a new device
const registerDevice = (deviceId, apiKey, deviceInfo = {}) => {
    const device = {
        deviceId,
        apiKey: hashApiKey(apiKey),
        registeredAt: new Date(),
        lastSeen: new Date(),
        uploadCount: 0,
        ...deviceInfo
    };
    
    deviceRegistry.set(deviceId, device);
    console.log(`Device registered: ${deviceId}`);
    
    return device;
};

// Validate device credentials
const validateDevice = (deviceId, apiKey) => {
    const device = deviceRegistry.get(deviceId);
    
    if (!device) {
        // Auto-register new devices (for MVP)
        registerDevice(deviceId, apiKey);
        return true;
    }
    
    // Update last seen
    device.lastSeen = new Date();
    deviceRegistry.set(deviceId, device);
    
    // Validate API key
    return device.apiKey === hashApiKey(apiKey);
};

// Hash API key for security
const hashApiKey = (apiKey) => {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
};

// Simple rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute

const isRateLimited = (deviceId) => {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    if (!rateLimitMap.has(deviceId)) {
        rateLimitMap.set(deviceId, []);
    }
    
    const requests = rateLimitMap.get(deviceId);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    rateLimitMap.set(deviceId, validRequests);
    
    // Check if limit exceeded
    if (validRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
        return true;
    }
    
    // Add current request
    validRequests.push(now);
    return false;
};

// Get device statistics
const getDeviceStats = (deviceId) => {
    const device = deviceRegistry.get(deviceId);
    if (!device) {
        return null;
    }
    
    return {
        deviceId: device.deviceId,
        registeredAt: device.registeredAt,
        lastSeen: device.lastSeen,
        uploadCount: device.uploadCount,
        isActive: (Date.now() - device.lastSeen.getTime()) < 300000 // 5 minutes
    };
};

// Update device upload count
const updateDeviceUploadCount = (deviceId) => {
    const device = deviceRegistry.get(deviceId);
    if (device) {
        device.uploadCount++;
        deviceRegistry.set(deviceId, device);
    }
};

// Get all devices (admin only)
const getAllDevices = () => {
    return Array.from(deviceRegistry.values()).map(device => ({
        deviceId: device.deviceId,
        registeredAt: device.registeredAt,
        lastSeen: device.lastSeen,
        uploadCount: device.uploadCount,
        isActive: (Date.now() - device.lastSeen.getTime()) < 300000
    }));
};

// Rate limiting middleware
const rateLimit = (req, res, next) => {
    const deviceId = req.deviceId;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 1000; // 1000 requests per window
    
    // Simple in-memory rate limiting (use Redis in production)
    if (!global.rateLimitMap) {
        global.rateLimitMap = new Map();
    }
    
    const key = `${deviceId}:${Math.floor(now / windowMs)}`;
    const current = global.rateLimitMap.get(key) || 0;
    
    if (current >= maxRequests) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    global.rateLimitMap.set(key, current + 1);
    next();
};

module.exports = {
    authenticateDevice,
    registerDevice,
    validateDevice,
    getDeviceStats,
    updateDeviceUploadCount,
    getAllDevices,
    rateLimit
}; 