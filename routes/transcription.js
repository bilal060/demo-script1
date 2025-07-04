const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateDevice, rateLimit } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const deviceId = req.deviceId;
        const uploadDir = path.join(__dirname, '../uploads', deviceId, 'transcriptions');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const originalName = file.originalname;
        const extension = path.extname(originalName);
        const filename = `${timestamp}_${req.deviceId}_transcription${extension}`;
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow audio files
        const allowedTypes = [
            'audio/opus', 'audio/ogg', 'audio/mpeg', 'audio/wav',
            'audio/mp4', 'audio/aac', 'audio/flac', 'audio/x-ms-wma',
            'audio/amr', 'audio/3gpp'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only audio files are allowed.'), false);
        }
    }
});

// Upload transcription
router.post('/upload', authenticateDevice, rateLimit, upload.single('audio'), async (req, res) => {
    try {
        const deviceId = req.deviceId;
        const {
            sourceApp,
            originalText,
            transcription,
            englishTranslation,
            detectedLanguage,
            metadata
        } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const transcriptionData = {
            deviceId,
            filePath: req.file.path,
            sourceApp: sourceApp || 'unknown',
            originalText: originalText || '',
            transcription: transcription || '',
            englishTranslation: englishTranslation || '',
            detectedLanguage: detectedLanguage || 'en',
            metadata: metadata || '',
            timestamp: Date.now(),
            uploaded: true
        };

        // Save to database
        const db = req.app.locals.db;
        const result = await db.collection('transcriptions').insertOne(transcriptionData);

        res.json({
            success: true,
            message: 'Transcription uploaded successfully',
            transcriptionId: result.insertedId,
            filePath: req.file.path
        });

    } catch (error) {
        console.error('Error uploading transcription:', error);
        res.status(500).json({ error: 'Failed to upload transcription' });
    }
});

// Get transcriptions for device
router.get('/list', authenticateDevice, rateLimit, async (req, res) => {
    try {
        const deviceId = req.deviceId;
        const { page = 1, limit = 20, language, sourceApp } = req.query;
        
        const skip = (page - 1) * limit;
        const query = { deviceId };
        
        if (language) query.detectedLanguage = language;
        if (sourceApp) query.sourceApp = sourceApp;

        const db = req.app.locals.db;
        const transcriptions = await db.collection('transcriptions')
            .find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .toArray();

        const total = await db.collection('transcriptions').countDocuments(query);

        res.json({
            success: true,
            transcriptions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching transcriptions:', error);
        res.status(500).json({ error: 'Failed to fetch transcriptions' });
    }
});

// Get transcription by ID
router.get('/:id', authenticateDevice, rateLimit, async (req, res) => {
    try {
        const deviceId = req.deviceId;
        const transcriptionId = req.params.id;

        const db = req.app.locals.db;
        const transcription = await db.collection('transcriptions').findOne({
            _id: transcriptionId,
            deviceId
        });

        if (!transcription) {
            return res.status(404).json({ error: 'Transcription not found' });
        }

        res.json({
            success: true,
            transcription
        });

    } catch (error) {
        console.error('Error fetching transcription:', error);
        res.status(500).json({ error: 'Failed to fetch transcription' });
    }
});

// Get transcription statistics
router.get('/stats/summary', authenticateDevice, rateLimit, async (req, res) => {
    try {
        const deviceId = req.deviceId;
        const db = req.app.locals.db;

        // Get total count
        const totalCount = await db.collection('transcriptions').countDocuments({ deviceId });

        // Get language distribution
        const languageStats = await db.collection('transcriptions').aggregate([
            { $match: { deviceId } },
            { $group: { _id: '$detectedLanguage', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).toArray();

        // Get app distribution
        const appStats = await db.collection('transcriptions').aggregate([
            { $match: { deviceId } },
            { $group: { _id: '$sourceApp', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).toArray();

        // Get recent activity
        const recentActivity = await db.collection('transcriptions')
            .find({ deviceId })
            .sort({ timestamp: -1 })
            .limit(5)
            .toArray();

        res.json({
            success: true,
            stats: {
                totalCount,
                languageStats,
                appStats,
                recentActivity
            }
        });

    } catch (error) {
        console.error('Error fetching transcription stats:', error);
        res.status(500).json({ error: 'Failed to fetch transcription statistics' });
    }
});

// Delete transcription
router.delete('/:id', authenticateDevice, rateLimit, async (req, res) => {
    try {
        const deviceId = req.deviceId;
        const transcriptionId = req.params.id;

        const db = req.app.locals.db;
        
        // Get transcription first to delete file
        const transcription = await db.collection('transcriptions').findOne({
            _id: transcriptionId,
            deviceId
        });

        if (!transcription) {
            return res.status(404).json({ error: 'Transcription not found' });
        }

        // Delete file if exists
        if (transcription.filePath && fs.existsSync(transcription.filePath)) {
            fs.unlinkSync(transcription.filePath);
        }

        // Delete from database
        await db.collection('transcriptions').deleteOne({
            _id: transcriptionId,
            deviceId
        });

        res.json({
            success: true,
            message: 'Transcription deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting transcription:', error);
        res.status(500).json({ error: 'Failed to delete transcription' });
    }
});

module.exports = router; 