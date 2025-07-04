/**
 * React Native Mobile Logger
 * Comprehensive logging and notification capture for React Native apps
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import DeviceInfo from 'react-native-device-info';

class ReactNativeMobileLogger {
    constructor(config = {}) {
        this.config = {
            serverUrl: 'https://script-bioa.vercel.app',
            deviceId: null,
            userId: config.userId || '',
            logLevel: config.logLevel || 'info',
            captureNotifications: config.captureNotifications !== false,
            captureLocation: config.captureLocation || false,
            capturePerformance: config.capturePerformance !== false,
            captureErrors: config.captureErrors !== false,
            captureInteractions: config.captureInteractions !== false,
            autoStart: config.autoStart !== false,
            batchSize: config.batchSize || 10,
            batchInterval: config.batchInterval || 5000,
            ...config
        };
        
        this.isRunning = false;
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.interactionCount = 0;
        this.logQueue = [];
        this.batchTimer = null;
        
        // Initialize
        this.init();
    }
    
    // Generate unique device ID
    async generateDeviceId() {
        try {
            let deviceId = await AsyncStorage.getItem('mobile_logger_device_id');
            if (!deviceId) {
                deviceId = await DeviceInfo.getUniqueId();
                await AsyncStorage.setItem('mobile_logger_device_id', deviceId);
            }
            return deviceId;
        } catch (error) {
            return 'rn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    }
    
    // Generate session ID
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Initialize the logger
    async init() {
        try {
            this.config.deviceId = await this.generateDeviceId();
            
            console.log('📱 React Native Mobile Logger initialized');
            console.log('📱 Device ID:', this.config.deviceId);
            console.log('🌐 Server:', this.config.serverUrl);
            
            if (this.config.autoStart) {
                this.start();
            }
        } catch (error) {
            console.error('Failed to initialize Mobile Logger:', error);
        }
    }
    
    // Start logging
    start() {
        if (this.isRunning) {
            console.warn('Mobile Logger is already running');
            return;
        }
        
        this.isRunning = true;
        console.log('🚀 Mobile Logger started');
        
        // Start different monitoring based on configuration
        if (this.config.captureErrors) {
            this.startErrorMonitoring();
        }
        
        if (this.config.capturePerformance) {
            this.startPerformanceMonitoring();
        }
        
        if (this.config.captureLocation) {
            this.startLocationMonitoring();
        }
        
        // Start batch processing
        this.startBatchProcessing();
        
        // Log app start
        this.log({
            level: 'info',
            category: 'system',
            title: 'App Started',
            content: 'React Native application started',
            action: 'app_start'
        });
    }
    
    // Stop logging
    stop() {
        if (!this.isRunning) {
            console.warn('Mobile Logger is not running');
            return;
        }
        
        this.isRunning = false;
        console.log('🛑 Mobile Logger stopped');
        
        // Stop batch processing
        if (this.batchTimer) {
            clearInterval(this.batchTimer);
            this.batchTimer = null;
        }
        
        // Send remaining logs
        this.flushLogQueue();
        
        // Log app stop
        this.log({
            level: 'info',
            category: 'system',
            title: 'App Stopped',
            content: 'React Native application stopped',
            action: 'app_stop'
        });
    }
    
    // Start error monitoring
    startErrorMonitoring() {
        // Monitor JavaScript errors
        const originalConsoleError = console.error;
        console.error = (...args) => {
            const errorMessage = args.join(' ');
            this.log({
                level: 'error',
                category: 'error',
                title: 'JavaScript Error',
                content: errorMessage,
                action: 'js_error',
                errorCode: 'JS_ERROR',
                errorStack: new Error().stack,
                metadata: {
                    args: args
                }
            });
            originalConsoleError.apply(console, args);
        };
        
        // Monitor unhandled promise rejections
        if (global.ErrorUtils) {
            const originalErrorHandler = global.ErrorUtils.setGlobalHandler;
            global.ErrorUtils.setGlobalHandler((error, isFatal) => {
                this.log({
                    level: 'error',
                    category: 'error',
                    title: 'Unhandled Error',
                    content: error.message || 'Unknown error',
                    action: 'unhandled_error',
                    errorCode: 'UNHANDLED_ERROR',
                    errorStack: error.stack,
                    metadata: {
                        isFatal: isFatal,
                        error: error
                    }
                });
            });
        }
        
        console.log('🐛 Error monitoring started');
    }
    
    // Start performance monitoring
    startPerformanceMonitoring() {
        // Monitor app performance metrics
        setInterval(async () => {
            try {
                const memoryInfo = await this.getMemoryInfo();
                const networkInfo = await this.getNetworkInfo();
                
                this.log({
                    level: 'info',
                    category: 'performance',
                    title: 'Performance Metrics',
                    content: `Memory: ${memoryInfo.used}MB, Network: ${networkInfo.type}`,
                    action: 'performance_check',
                    memoryUsage: `${memoryInfo.used}MB`,
                    networkStatus: networkInfo.type,
                    metadata: {
                        memory: memoryInfo,
                        network: networkInfo
                    }
                });
            } catch (error) {
                console.error('Performance monitoring error:', error);
            }
        }, 30000); // Every 30 seconds
        
        console.log('📊 Performance monitoring started');
    }
    
    // Start location monitoring
    startLocationMonitoring() {
        // This would require additional permissions and native modules
        // For now, we'll just log that location monitoring is enabled
        this.log({
            level: 'info',
            category: 'system',
            title: 'Location Monitoring',
            content: 'Location monitoring enabled (requires implementation)',
            action: 'location_enabled'
        });
        
        console.log('📍 Location monitoring enabled (requires implementation)');
    }
    
    // Get memory information
    async getMemoryInfo() {
        try {
            // This is a simplified version - in real implementation,
            // you'd use native modules to get actual memory usage
            return {
                used: Math.round(Math.random() * 100 + 50), // Mock data
                total: 1024,
                available: Math.round(Math.random() * 500 + 200)
            };
        } catch (error) {
            return { used: 0, total: 0, available: 0 };
        }
    }
    
    // Get network information
    async getNetworkInfo() {
        try {
            const netInfo = await NetInfo.fetch();
            return {
                type: netInfo.type,
                isConnected: netInfo.isConnected,
                isInternetReachable: netInfo.isInternetReachable,
                details: netInfo.details
            };
        } catch (error) {
            return { type: 'unknown', isConnected: false, isInternetReachable: false };
        }
    }
    
    // Get device information
    async getDeviceInfo() {
        try {
            return {
                brand: await DeviceInfo.getBrand(),
                model: await DeviceInfo.getModel(),
                systemVersion: await DeviceInfo.getSystemVersion(),
                appVersion: await DeviceInfo.getVersion(),
                buildNumber: await DeviceInfo.getBuildNumber(),
                bundleId: await DeviceInfo.getBundleId(),
                deviceId: await DeviceInfo.getUniqueId(),
                deviceName: await DeviceInfo.getDeviceName(),
                userAgent: await DeviceInfo.getUserAgent(),
                isTablet: await DeviceInfo.isTablet(),
                isEmulator: await DeviceInfo.isEmulator()
            };
        } catch (error) {
            return {};
        }
    }
    
    // Start batch processing
    startBatchProcessing() {
        this.batchTimer = setInterval(() => {
            this.flushLogQueue();
        }, this.config.batchInterval);
    }
    
    // Add log to queue
    addToQueue(logData) {
        this.logQueue.push(logData);
        
        // Flush if queue is full
        if (this.logQueue.length >= this.config.batchSize) {
            this.flushLogQueue();
        }
    }
    
    // Flush log queue
    async flushLogQueue() {
        if (this.logQueue.length === 0) return;
        
        const logsToSend = [...this.logQueue];
        this.logQueue = [];
        
        try {
            await this.sendLogsBatch(logsToSend);
        } catch (error) {
            console.error('Failed to send logs batch:', error);
            // Re-add failed logs to queue
            this.logQueue.unshift(...logsToSend);
        }
    }
    
    // Send logs batch to server
    async sendLogsBatch(logs) {
        try {
            const response = await fetch(`${this.config.serverUrl}/api/notify-mongo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(logs)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Failed to send logs batch:', error);
            throw error;
        }
    }
    
    // Send single log to server
    async sendLog(logData) {
        try {
            const response = await fetch(`${this.config.serverUrl}/api/notify-mongo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(logData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Failed to send log:', error);
            // Store failed log for retry
            this.storeFailedLog(logData);
        }
    }
    
    // Store failed log for retry
    async storeFailedLog(logData) {
        try {
            const failedLogs = JSON.parse(await AsyncStorage.getItem('mobile_logger_failed_logs') || '[]');
            failedLogs.push({
                ...logData,
                timestamp: new Date().toISOString(),
                retryCount: 0
            });
            await AsyncStorage.setItem('mobile_logger_failed_logs', JSON.stringify(failedLogs.slice(-50))); // Keep last 50
        } catch (error) {
            console.error('Failed to store failed log:', error);
        }
    }
    
    // Retry failed logs
    async retryFailedLogs() {
        try {
            const failedLogs = JSON.parse(await AsyncStorage.getItem('mobile_logger_failed_logs') || '[]');
            if (failedLogs.length === 0) return;
            
            console.log(`🔄 Retrying ${failedLogs.length} failed logs...`);
            
            for (let i = failedLogs.length - 1; i >= 0; i--) {
                const logData = failedLogs[i];
                try {
                    await this.sendLog(logData);
                    failedLogs.splice(i, 1); // Remove successful log
                } catch (error) {
                    logData.retryCount = (logData.retryCount || 0) + 1;
                    if (logData.retryCount > 3) {
                        failedLogs.splice(i, 1); // Remove after 3 retries
                    }
                }
            }
            
            await AsyncStorage.setItem('mobile_logger_failed_logs', JSON.stringify(failedLogs));
        } catch (error) {
            console.error('Failed to retry logs:', error);
        }
    }
    
    // Main logging function
    log(data) {
        if (!this.isRunning) {
            console.warn('Mobile Logger is not running');
            return;
        }
        
        const logEntry = {
            app: 'React Native App',
            title: data.title,
            content: data.content,
            logLevel: data.level || this.config.logLevel,
            category: data.category || 'event',
            deviceId: this.config.deviceId,
            userId: this.config.userId,
            sessionId: this.sessionId,
            appVersion: DeviceInfo.getVersion(),
            osVersion: DeviceInfo.getSystemVersion(),
            deviceModel: DeviceInfo.getModel(),
            screen: data.screen || 'Unknown',
            action: data.action || 'log',
            metadata: {
                ...data.metadata,
                sessionDuration: Date.now() - this.startTime,
                interactionCount: this.interactionCount
            },
            ...data
        };
        
        // Add optional fields
        if (data.duration) logEntry.duration = data.duration;
        if (data.memoryUsage) logEntry.memoryUsage = data.memoryUsage;
        if (data.networkStatus) logEntry.networkStatus = data.networkStatus;
        if (data.location) logEntry.location = data.location;
        if (data.errorCode) logEntry.errorCode = data.errorCode;
        if (data.errorStack) logEntry.errorStack = data.errorStack;
        if (data.errorContext) logEntry.errorContext = data.errorContext;
        
        // Add to queue for batch processing
        this.addToQueue(logEntry);
        
        // Console output for debugging
        const emoji = {
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️',
            'debug': '🔍'
        };
        
        console.log(`${emoji[logEntry.logLevel] || '📝'} [${logEntry.category}] ${logEntry.title}: ${logEntry.content}`);
    }
    
    // Custom logging methods
    error(title, content, metadata = {}) {
        this.log({ level: 'error', category: 'error', title, content, metadata });
    }
    
    warning(title, content, metadata = {}) {
        this.log({ level: 'warning', category: 'system', title, content, metadata });
    }
    
    info(title, content, metadata = {}) {
        this.log({ level: 'info', category: 'event', title, content, metadata });
    }
    
    debug(title, content, metadata = {}) {
        this.log({ level: 'debug', category: 'event', title, content, metadata });
    }
    
    // Performance logging
    performance(title, duration, metadata = {}) {
        this.log({ 
            level: 'info', 
            category: 'performance', 
            title, 
            content: `Duration: ${duration}ms`, 
            duration,
            metadata 
        });
    }
    
    // User action logging
    userAction(action, title, content, metadata = {}) {
        this.interactionCount++;
        this.log({ 
            level: 'info', 
            category: 'user_action', 
            title, 
            content, 
            action,
            metadata 
        });
    }
    
    // Screen navigation logging
    screenNavigation(fromScreen, toScreen, metadata = {}) {
        this.log({
            level: 'info',
            category: 'user_action',
            title: 'Screen Navigation',
            content: `Navigated from ${fromScreen} to ${toScreen}`,
            action: 'screen_navigation',
            screen: toScreen,
            metadata: {
                fromScreen,
                toScreen,
                ...metadata
            }
        });
    }
    
    // Network request logging
    networkRequest(url, method, duration, status, metadata = {}) {
        this.log({
            level: status >= 400 ? 'error' : 'info',
            category: status >= 400 ? 'error' : 'performance',
            title: 'Network Request',
            content: `${method} ${url} - ${status} (${duration}ms)`,
            action: 'network_request',
            duration,
            networkStatus: 'online',
            metadata: {
                url,
                method,
                status,
                ...metadata
            }
        });
    }
    
    // Get status
    async getStatus() {
        const failedLogs = JSON.parse(await AsyncStorage.getItem('mobile_logger_failed_logs') || '[]');
        
        return {
            isRunning: this.isRunning,
            deviceId: this.config.deviceId,
            sessionId: this.sessionId,
            sessionDuration: Date.now() - this.startTime,
            interactionCount: this.interactionCount,
            queueSize: this.logQueue.length,
            failedLogsCount: failedLogs.length
        };
    }
}

// Create and export default instance
const mobileLogger = new ReactNativeMobileLogger();

// Auto-retry failed logs every 30 seconds
setInterval(() => {
    mobileLogger.retryFailedLogs();
}, 30000);

export default mobileLogger;
export { ReactNativeMobileLogger }; 