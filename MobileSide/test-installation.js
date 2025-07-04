#!/usr/bin/env node

/**
 * Mobile Logger Installation Test
 * Tests the installation and connectivity of mobile loggers
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const SERVER_URL = 'https://script-bioa.vercel.app';
const CONFIG_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.mobile-logger', 'config.json');

// Colors for output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function printStatus(message, color = 'green') {
    console.log(`${colors[color]}✅ ${message}${colors.reset}`);
}

function printWarning(message) {
    console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function printError(message) {
    console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function printInfo(message) {
    console.log(`${colors.cyan}ℹ️  ${message}${colors.reset}`);
}

function printHeader(message) {
    console.log(`${colors.blue}${message}${colors.reset}`);
}

// Test server connectivity
async function testServerConnectivity() {
    printInfo('Testing server connectivity...');
    
    try {
        const response = await makeRequest(`${SERVER_URL}/api/mongo-test`);
        if (response.success) {
            printStatus('Server connectivity: OK');
            return true;
        } else {
            printError('Server connectivity: Failed');
            return false;
        }
    } catch (error) {
        printError(`Server connectivity: ${error.message}`);
        return false;
    }
}

// Test configuration file
function testConfiguration() {
    printInfo('Testing configuration...');
    
    if (fs.existsSync(CONFIG_PATH)) {
        try {
            const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
            printStatus('Configuration file: OK');
            printInfo(`Device ID: ${config.deviceId}`);
            printInfo(`Server URL: ${config.serverUrl}`);
            return true;
        } catch (error) {
            printError(`Configuration file: ${error.message}`);
            return false;
        }
    } else {
        printWarning('Configuration file: Not found');
        return false;
    }
}

// Test logger files
function testLoggerFiles() {
    printInfo('Testing logger files...');
    
    const mobileLoggerDir = path.dirname(CONFIG_PATH);
    const files = [
        'mobile-logger-web.js',
        'mobile-logger-ios.sh',
        'mobile-logger-android.sh',
        'mobile-logger-react-native.js'
    ];
    
    let foundFiles = 0;
    
    files.forEach(file => {
        const filePath = path.join(mobileLoggerDir, file);
        if (fs.existsSync(filePath)) {
            printStatus(`${file}: OK`);
            foundFiles++;
        } else {
            printWarning(`${file}: Not found`);
        }
    });
    
    if (foundFiles > 0) {
        printStatus(`Found ${foundFiles} logger files`);
        return true;
    } else {
        printError('No logger files found');
        return false;
    }
}

// Test sending a log
async function testLogSending() {
    printInfo('Testing log sending...');
    
    try {
        const testLog = {
            app: 'Test App',
            title: 'Installation Test',
            content: 'This is a test log from the installation verification',
            logLevel: 'info',
            category: 'test',
            deviceId: 'test_device',
            userId: 'test_user',
            metadata: {
                test: true,
                timestamp: new Date().toISOString()
            }
        };
        
        const response = await makeRequest(`${SERVER_URL}/api/notify-mongo`, {
            method: 'POST',
            body: testLog
        });
        
        if (response.success) {
            printStatus('Log sending: OK');
            return true;
        } else {
            printError('Log sending: Failed');
            return false;
        }
    } catch (error) {
        printError(`Log sending: ${error.message}`);
        return false;
    }
}

// Test log retrieval
async function testLogRetrieval() {
    printInfo('Testing log retrieval...');
    
    try {
        const response = await makeRequest(`${SERVER_URL}/api/notifications-mongo?limit=1`);
        
        if (response.notifications && Array.isArray(response.notifications)) {
            printStatus('Log retrieval: OK');
            printInfo(`Found ${response.count} logs`);
            return true;
        } else {
            printError('Log retrieval: Failed');
            return false;
        }
    } catch (error) {
        printError(`Log retrieval: ${error.message}`);
        return false;
    }
}

// Test web interface
async function testWebInterface() {
    printInfo('Testing web interface...');
    
    try {
        const response = await makeRequest(`${SERVER_URL}/mobile-logs`);
        
        if (response.includes('Mobile App Logs Viewer')) {
            printStatus('Web interface: OK');
            return true;
        } else {
            printError('Web interface: Failed');
            return false;
        }
    } catch (error) {
        printError(`Web interface: ${error.message}`);
        return false;
    }
}

// Make HTTP request
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const requestOptions = {
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const req = https.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    resolve(data);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }
        
        req.end();
    });
}

// Main test function
async function runTests() {
    printHeader('📱 Mobile Logger Installation Test');
    console.log('');
    
    const tests = [
        { name: 'Server Connectivity', fn: testServerConnectivity },
        { name: 'Configuration', fn: testConfiguration },
        { name: 'Logger Files', fn: testLoggerFiles },
        { name: 'Log Sending', fn: testLogSending },
        { name: 'Log Retrieval', fn: testLogRetrieval },
        { name: 'Web Interface', fn: testWebInterface }
    ];
    
    let passedTests = 0;
    const totalTests = tests.length;
    
    for (const test of tests) {
        console.log(`\n🧪 Testing: ${test.name}`);
        console.log('─'.repeat(50));
        
        try {
            const result = await test.fn();
            if (result) {
                passedTests++;
            }
        } catch (error) {
            printError(`Test failed: ${error.message}`);
        }
    }
    
    console.log('\n' + '='.repeat(50));
    printHeader('📊 Test Results');
    console.log('');
    
    if (passedTests === totalTests) {
        printStatus(`All tests passed! (${passedTests}/${totalTests})`);
        printStatus('Mobile Logger is working correctly!');
    } else {
        printWarning(`${passedTests}/${totalTests} tests passed`);
        printError('Some tests failed. Please check the installation.');
    }
    
    console.log('');
    printInfo('📱 View your logs at: https://script-bioa.vercel.app/mobile-logs');
    printInfo('📚 Documentation: https://github.com/bilal060/script/blob/main/MobileSide/README.md');
    
    if (passedTests < totalTests) {
        console.log('');
        printWarning('Troubleshooting:');
        printInfo('1. Run the installer again: curl -sSL https://raw.githubusercontent.com/bilal060/script/main/MobileSide/install.sh | bash');
        printInfo('2. Check your internet connection');
        printInfo('3. Verify the server is accessible: https://script-bioa.vercel.app/api/mongo-test');
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    testServerConnectivity,
    testConfiguration,
    testLoggerFiles,
    testLogSending,
    testLogRetrieval,
    testWebInterface,
    runTests
}; 