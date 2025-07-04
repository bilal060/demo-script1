# 🚀 Quick Start Guide

Get your mobile notifications server running in minutes!

## Option 1: One-Click Deploy (Easiest)

```bash
# Run the automated deployment script
bash deploy.sh
```

## Option 2: Manual Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

## Option 3: Deploy from GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Click "Deploy"

## 🧪 Test Your Deployment

1. **Update the test script:**
   ```bash
   # Edit test-notifications.js and change BASE_URL to your Vercel URL
   nano test-notifications.js
   ```

2. **Run the test:**
   ```bash
   node test-notifications.js
   ```

3. **Or test manually:**
   ```bash
   # Send a test notification
   curl -X POST https://your-project.vercel.app/api/notify \
     -H "Content-Type: application/json" \
     -d '{"app":"Test","title":"Hello","content":"World"}'
   
   # View notifications
   curl https://your-project.vercel.app/api/notifications
   ```

## 📱 Access Your App

- **Web Interface:** `https://your-project.vercel.app/view.html`
- **API Endpoint:** `https://your-project.vercel.app/api/notify`

## 🎯 Next Steps

1. **Integrate with mobile apps** - Send POST requests to `/api/notify`
2. **Customize the UI** - Edit `public/view.html`
3. **Add features** - See README.md for enhancement ideas

## 🆘 Need Help?

- Check the full [README.md](README.md) for detailed documentation
- View deployment logs: `vercel logs`
- Check project status: `vercel info`

---

**That's it! Your notification server is ready to use! 🎉** 