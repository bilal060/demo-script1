# 🚀 MobileSide Quick Start Guide

Get started with mobile logging in under 5 minutes!

## 📱 One-Click Installation

```bash
# Install MobileSide
curl -sSL https://raw.githubusercontent.com/bilal060/script/main/MobileSide/install-simple.sh | bash

# Test installation
~/.mobile-logger/start-logger.sh
```

## 🎯 What You Get

- **Web Logger**: Capture browser notifications and user interactions
- **iOS Logger**: Monitor iOS device notifications and system logs
- **Android Logger**: Track Android notifications and app activity
- **React Native Logger**: Integrated logging for React Native apps
- **Real-time Dashboard**: View all logs at https://script-bioa.vercel.app/mobile-logs

## 📋 Quick Examples

### Web App
```html
<script src="~/.mobile-logger/mobile-logger-web.js"></script>
<script>
  const logger = new MobileLogger();
  logger.start();
  logger.info('App Started', 'Web app loaded successfully');
</script>
```

### React Native
```javascript
import logger from '~/.mobile-logger/mobile-logger-react-native.js';
logger.start();
logger.userAction('button_click', 'User Action', 'User clicked login button');
```

### iOS/Android
```bash
# Start iOS logging
~/.mobile-logger/mobile-logger-ios.sh start

# Start Android logging
~/.mobile-logger/mobile-logger-android.sh start
```

## 🔍 View Your Logs

Visit: **https://script-bioa.vercel.app/mobile-logs**

Features:
- Real-time log streaming
- Advanced filtering and search
- Performance metrics
- Error tracking
- User analytics

## 🛠️ Commands

```bash
# Install
bash MobileSide/install-simple.sh install

# Check status
bash MobileSide/install-simple.sh status

# Test installation
bash MobileSide/install-simple.sh test

# Uninstall
bash MobileSide/install-simple.sh uninstall
```

## 📊 What Gets Logged

- 🔔 **Notifications**: All app and system notifications
- 👆 **User Actions**: Clicks, swipes, form submissions
- 🐛 **Errors**: Crashes, exceptions, network failures
- 📈 **Performance**: Load times, memory usage, network requests
- 📍 **Location**: Device location (if permitted)
- 📱 **Device Info**: Model, OS version, app version

## 🎯 Use Cases

- **Development**: Debug app crashes and performance issues
- **Testing**: Monitor user interactions and app behavior
- **Analytics**: Track feature usage and user patterns
- **Monitoring**: Real-time error tracking and alerting

## 🚨 Troubleshooting

**Installation fails:**
```bash
# Manual installation
mkdir -p ~/.mobile-logger
cp MobileSide/* ~/.mobile-logger/
chmod +x ~/.mobile-logger/*.sh
```

**No logs appearing:**
```bash
# Test connection
curl https://script-bioa.vercel.app/api/mongo-test
```

**Permission issues:**
- iOS: Enable developer mode in Settings
- Android: Enable USB debugging in Developer options
- Web: Allow notifications in browser settings

## 📚 Next Steps

1. **Customize Configuration**: Edit `~/.mobile-logger/config.json`
2. **Add to Your App**: Integrate logger into your mobile/web app
3. **Set Up Alerts**: Configure error notifications
4. **Analyze Data**: Use the dashboard for insights

## 🆘 Support

- **Documentation**: https://github.com/bilal060/script/blob/main/MobileSide/README.md
- **Issues**: Create an issue on GitHub
- **Dashboard**: https://script-bioa.vercel.app/mobile-logs

---

**Ready to start logging? Run the installer and begin capturing mobile data! 🚀** 