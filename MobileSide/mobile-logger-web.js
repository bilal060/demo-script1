/**
 * Mobile Logger for Web Applications
 * Captures browser notifications, user interactions, and performance metrics
 * Include this script in your web app to start logging
 */

class MobileLogger {
    constructor(config = {}) {
        this.config = {
            serverUrl: 'https://script-bioa.vercel.app',
            deviceId: this.generateDeviceId(),
            userId: config.userId || '',
            logLevel: config.logLevel || 'info',
            captureNotifications: config.captureNotifications !== false,
            captureLocation: config.captureLocation || false,
            capturePerformance: config.capturePerformance !== false,
            captureErrors: config.captureErrors !== false,
            captureInteractions: config.captureInteractions !== false,
            autoStart: config.autoStart !== false,
            ...config
        };
        
        this.isRunning = false;
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.interactionCount = 0;
        
        // Initialize
        this.init();
    }
    
    // Generate unique device ID
    generateDeviceId() {
        let deviceId = localStorage.getItem('mobile_logger_device_id');
        if (!deviceId) {
            deviceId = 'web_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('mobile_logger_device_id', deviceId);
        }
        return deviceId;
    }
    
    // Generate session ID
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Initialize the logger
    init() {
        console.log('📱 Mobile Logger initialized');
        console.log('📱 Device ID:', this.config.deviceId);
        console.log('🌐 Server:', this.config.serverUrl);
        
        if (this.config.autoStart) {
            this.start();
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
        if (this.config.captureNotifications) {
            this.startNotificationMonitoring();
        }
        
        if (this.config.captureErrors) {
            this.startErrorMonitoring();
        }
        
        if (this.config.captureInteractions) {
            this.startInteractionMonitoring();
        }
        
        if (this.config.capturePerformance) {
            this.startPerformanceMonitoring();
        }
        
        if (this.config.captureLocation) {
            this.startLocationMonitoring();
        }
        
        // Log app start
        this.log({
            level: 'info',
            category: 'system',
            title: 'App Started',
            content: 'Web application started',
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
        
        // Log app stop
        this.log({
            level: 'info',
            category: 'system',
            title: 'App Stopped',
            content: 'Web application stopped',
            action: 'app_stop'
        });
    }
    
    // Start notification monitoring
    startNotificationMonitoring() {
        if (!('Notification' in window)) {
            console.warn('Notifications not supported');
            return;
        }
        
        // Request notification permission
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('✅ Notification permission granted');
                }
            });
        }
        
        // Monitor notification events
        const originalNotification = window.Notification;
        window.Notification = function(title, options = {}) {
            const notification = new originalNotification(title, options);
            
            // Log notification
            this.log({
                level: 'info',
                category: 'notification',
                title: 'Browser Notification',
                content: title,
                action: 'notification_sent',
                metadata: {
                    body: options.body || '',
                    icon: options.icon || '',
                    tag: options.tag || '',
                    data: options.data || {}
                }
            });
            
            return notification;
        }.bind(this);
        
        console.log('🔔 Notification monitoring started');
    }
    
    // Start error monitoring
    startErrorMonitoring() {
        // Monitor JavaScript errors
        window.addEventListener('error', (event) => {
            this.log({
                level: 'error',
                category: 'error',
                title: 'JavaScript Error',
                content: event.message,
                action: 'js_error',
                errorCode: 'JS_ERROR',
                errorStack: event.error?.stack || '',
                errorContext: `${event.filename}:${event.lineno}:${event.colno}`,
                metadata: {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                }
            });
        });
        
        // Monitor unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.log({
                level: 'error',
                category: 'error',
                title: 'Unhandled Promise Rejection',
                content: event.reason?.message || event.reason || 'Unknown error',
                action: 'promise_rejection',
                errorCode: 'PROMISE_REJECTION',
                errorStack: event.reason?.stack || '',
                metadata: {
                    reason: event.reason
                }
            });
        });
        
        console.log('🐛 Error monitoring started');
    }
    
    // Start interaction monitoring
    startInteractionMonitoring() {
        // Monitor clicks
        document.addEventListener('click', (event) => {
            this.interactionCount++;
            this.log({
                level: 'info',
                category: 'user_action',
                title: 'User Click',
                content: `Clicked on ${event.target.tagName.toLowerCase()}`,
                action: 'click',
                screen: this.getCurrentScreen(),
                metadata: {
                    tagName: event.target.tagName,
                    className: event.target.className,
                    id: event.target.id,
                    text: event.target.textContent?.substring(0, 100) || '',
                    x: event.clientX,
                    y: event.clientY
                }
            });
        });
        
        // Monitor form submissions
        document.addEventListener('submit', (event) => {
            this.log({
                level: 'info',
                category: 'user_action',
                title: 'Form Submission',
                content: `Form submitted: ${event.target.tagName}`,
                action: 'form_submit',
                screen: this.getCurrentScreen(),
                metadata: {
                    formId: event.target.id,
                    formAction: event.target.action,
                    formMethod: event.target.method
                }
            });
        });
        
        // Monitor navigation
        window.addEventListener('popstate', (event) => {
            this.log({
                level: 'info',
                category: 'user_action',
                title: 'Navigation',
                content: `Navigated to ${window.location.pathname}`,
                action: 'navigation',
                screen: this.getCurrentScreen(),
                metadata: {
                    from: document.referrer,
                    to: window.location.href,
                    state: event.state
                }
            });
        });
        
        console.log('👆 Interaction monitoring started');
    }
    
    // Start performance monitoring
    startPerformanceMonitoring() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
            const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart;
            
            this.log({
                level: 'info',
                category: 'performance',
                title: 'Page Load Performance',
                content: `Page loaded in ${loadTime}ms`,
                action: 'page_load',
                duration: loadTime,
                metadata: {
                    domContentLoaded: domContentLoaded,
                    domComplete: perfData.domComplete - perfData.domContentLoadedEventEnd,
                    redirectCount: perfData.redirectCount,
                    transferSize: perfData.transferSize,
                    encodedBodySize: perfData.encodedBodySize,
                    decodedBodySize: perfData.decodedBodySize
                }
            });
        });
        
        // Monitor memory usage
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                this.log({
                    level: 'info',
                    category: 'performance',
                    title: 'Memory Usage',
                    content: `Memory: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB used`,
                    action: 'memory_check',
                    memoryUsage: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
                    metadata: {
                        usedJSHeapSize: memory.usedJSHeapSize,
                        totalJSHeapSize: memory.totalJSHeapSize,
                        jsHeapSizeLimit: memory.jsHeapSizeLimit
                    }
                });
            }, 30000); // Every 30 seconds
        }
        
        // Monitor network requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            try {
                const response = await originalFetch(...args);
                const duration = performance.now() - startTime;
                
                this.log({
                    level: 'info',
                    category: 'performance',
                    title: 'Network Request',
                    content: `Request to ${args[0]} completed in ${Math.round(duration)}ms`,
                    action: 'network_request',
                    duration: Math.round(duration),
                    networkStatus: navigator.onLine ? 'online' : 'offline',
                    metadata: {
                        url: args[0],
                        method: args[1]?.method || 'GET',
                        status: response.status,
                        statusText: response.statusText
                    }
                });
                
                return response;
            } catch (error) {
                const duration = performance.now() - startTime;
                
                this.log({
                    level: 'error',
                    category: 'error',
                    title: 'Network Error',
                    content: `Request to ${args[0]} failed: ${error.message}`,
                    action: 'network_error',
                    duration: Math.round(duration),
                    errorCode: 'NETWORK_ERROR',
                    errorStack: error.stack,
                    networkStatus: navigator.onLine ? 'online' : 'offline',
                    metadata: {
                        url: args[0],
                        method: args[1]?.method || 'GET',
                        error: error.message
                    }
                });
                
                throw error;
            }
        };
        
        console.log('📊 Performance monitoring started');
    }
    
    // Start location monitoring
    startLocationMonitoring() {
        if (!('geolocation' in navigator)) {
            console.warn('Geolocation not supported');
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.log({
                    level: 'info',
                    category: 'event',
                    title: 'Location Updated',
                    content: 'User location obtained',
                    action: 'location_update',
                    location: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    },
                    metadata: {
                        altitude: position.coords.altitude,
                        heading: position.coords.heading,
                        speed: position.coords.speed
                    }
                });
            },
            (error) => {
                this.log({
                    level: 'warning',
                    category: 'error',
                    title: 'Location Error',
                    content: `Location error: ${error.message}`,
                    action: 'location_error',
                    errorCode: 'LOCATION_ERROR',
                    metadata: {
                        errorCode: error.code,
                        errorMessage: error.message
                    }
                });
            }
        );
        
        console.log('📍 Location monitoring started');
    }
    
    // Get current screen/page
    getCurrentScreen() {
        return window.location.pathname || '/';
    }
    
    // Get device information
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screenWidth: screen.width,
            screenHeight: screen.height,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth
        };
    }
    
    // Send log to server
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
            // Store failed logs in localStorage for retry
            this.storeFailedLog(logData);
        }
    }
    
    // Store failed logs for retry
    storeFailedLog(logData) {
        const failedLogs = JSON.parse(localStorage.getItem('mobile_logger_failed_logs') || '[]');
        failedLogs.push({
            ...logData,
            timestamp: new Date().toISOString(),
            retryCount: 0
        });
        localStorage.setItem('mobile_logger_failed_logs', JSON.stringify(failedLogs.slice(-50))); // Keep last 50
    }
    
    // Retry failed logs
    async retryFailedLogs() {
        const failedLogs = JSON.parse(localStorage.getItem('mobile_logger_failed_logs') || '[]');
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
        
        localStorage.setItem('mobile_logger_failed_logs', JSON.stringify(failedLogs));
    }
    
    // Main logging function
    log(data) {
        if (!this.isRunning) {
            console.warn('Mobile Logger is not running');
            return;
        }
        
        const logEntry = {
            app: 'Web App',
            title: data.title,
            content: data.content,
            logLevel: data.level || this.config.logLevel,
            category: data.category || 'event',
            deviceId: this.config.deviceId,
            userId: this.config.userId,
            sessionId: this.sessionId,
            appVersion: '1.0.0',
            osVersion: navigator.platform,
            deviceModel: navigator.userAgent,
            screen: data.screen || this.getCurrentScreen(),
            action: data.action || 'log',
            metadata: {
                ...data.metadata,
                deviceInfo: this.getDeviceInfo(),
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
        
        // Send to server
        this.sendLog(logEntry);
        
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
        this.log({ 
            level: 'info', 
            category: 'user_action', 
            title, 
            content, 
            action,
            metadata 
        });
    }
    
    // Get status
    getStatus() {
        return {
            isRunning: this.isRunning,
            deviceId: this.config.deviceId,
            sessionId: this.sessionId,
            sessionDuration: Date.now() - this.startTime,
            interactionCount: this.interactionCount,
            failedLogsCount: JSON.parse(localStorage.getItem('mobile_logger_failed_logs') || '[]').length
        };
    }
}

// Auto-initialize if script is loaded directly
if (typeof window !== 'undefined') {
    // Create global instance
    window.mobileLogger = new MobileLogger();
    
    // Auto-retry failed logs every 30 seconds
    setInterval(() => {
        if (window.mobileLogger) {
            window.mobileLogger.retryFailedLogs();
        }
    }, 30000);
    
    console.log('📱 Mobile Logger loaded and ready!');
    console.log('📊 View logs at: https://script-bioa.vercel.app/mobile-logs');
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileLogger;
} 