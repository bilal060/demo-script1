# MongoDB Setup Guide for Notification System

## 🚀 Quick Setup (5 minutes)

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" and create an account
3. Choose "Free" tier (M0)
4. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
5. Choose a region close to you
6. Click "Create"

### Step 2: Create Database Cluster

1. **Cluster Name:** `notifications-cluster` (or any name)
2. **Database Access:** Create a user
   - Username: `notification-user`
   - Password: `your-secure-password`
   - Role: `Read and write to any database`
3. **Network Access:** Allow access from anywhere (0.0.0.0/0)
4. Click "Finish and Close"

### Step 3: Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your actual password (URL-encoded if needed)
5. Replace `<dbname>` with `notifications`

**Example connection string:**
```
mongodb+srv://dbuser:your-password@cluster0.xxxxx.mongodb.net/notifications?retryWrites=true&w=majority
```

**For your specific case (with URL-encoded password):**
```
mongodb+srv://dbuser:Bil%40l112@cluster0.ey6gj6g.mongodb.net/notifications?retryWrites=true&w=majority
```

### Step 4: Add to Vercel Environment Variables

1. Go to your Vercel dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add new variable:
   - **Name:** `MONGODB_URI`
   - **Value:** Your connection string from Step 3
5. Click "Save"

### Step 5: Deploy

```bash
git add .
git commit -m "Add MongoDB integration"
git push
```

## 🧪 Test MongoDB Integration

### Test the MongoDB API:

```bash
# Send notification to MongoDB
curl -X POST https://your-project.vercel.app/api/notify-mongo \
  -H "Content-Type: application/json" \
  -d '{"app":"TestApp","title":"MongoDB Test","content":"This is saved to MongoDB!"}'

# Fetch notifications from MongoDB
curl https://your-project.vercel.app/api/notifications-mongo

# Test MongoDB connection
curl https://your-project.vercel.app/api/mongo-test
```

### Update your test scripts:

```javascript
// In test-notifications.js, change BASE_URL to use MongoDB endpoints
const BASE_URL = 'https://your-project.vercel.app';

// Use these endpoints:
// POST /api/notify-mongo
// GET /api/notifications-mongo
```

## 📊 MongoDB Benefits

✅ **Persistent Storage** - Notifications survive function restarts
✅ **Scalable** - Handle thousands of notifications
✅ **Queryable** - Advanced filtering and search
✅ **Reliable** - No data loss
✅ **Free Tier** - 512MB storage, perfect for notifications

## 🔧 API Endpoints

### MongoDB Endpoints:
- **POST** `/api/notify-mongo` - Save notification to MongoDB
- **GET** `/api/notifications-mongo` - Fetch notifications from MongoDB
- **GET** `/api/mongo-test` - Test MongoDB connection

### Original Endpoints (still available):
- **POST** `/api/notify` - Save notification (ephemeral)
- **GET** `/api/notifications` - Fetch notifications (ephemeral)

## 🎯 Usage Examples

### Send Notification to MongoDB:
```bash
curl -X POST https://your-project.vercel.app/api/notify-mongo \
  -H "Content-Type: application/json" \
  -d '{
    "app": "WhatsApp",
    "title": "New Message",
    "content": "Hello from MongoDB!"
  }'
```

### Fetch with Filters:
```bash
# Get all notifications
curl https://your-project.vercel.app/api/notifications-mongo

# Filter by app
curl "https://your-project.vercel.app/api/notifications-mongo?app=WhatsApp"

# Limit results
curl "https://your-project.vercel.app/api/notifications-mongo?limit=5"

# Sort ascending
curl "https://your-project.vercel.app/api/notifications-mongo?sort=asc"
```

## 🛠️ Troubleshooting

### If you get connection errors:

1. **Check environment variable** - Make sure `MONGODB_URI` is set in Vercel
2. **Check network access** - Ensure IP whitelist includes `0.0.0.0/0`
3. **Check credentials** - Verify username/password in connection string
4. **Check database name** - Make sure it's `notifications`
5. **URL-encode special characters** - Use `%40` for `@` in passwords

### View MongoDB Data:

1. Go to MongoDB Atlas dashboard
2. Click "Browse Collections"
3. Select `notifications` database
4. View `notifications` collection

## 🚀 Next Steps

1. **Set up MongoDB Atlas** (follow steps above)
2. **Add environment variables** to Vercel
3. **Deploy** your changes
4. **Test** with the MongoDB endpoints
5. **Update** your mobile apps to use `/api/notify-mongo`

Your notifications will now persist permanently in MongoDB! 🎉 