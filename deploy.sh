#!/bin/bash

# Mobile Notifications Server - Vercel Deployment Script
# Run with: bash deploy.sh

set -e

echo "🚀 Mobile Notifications Server - Vercel Deployment"
echo "=================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
else
    echo "✅ Vercel CLI already installed"
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel..."
    vercel login
else
    echo "✅ Already logged in to Vercel"
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📱 Your notification server is now live!"
echo "   - API: https://your-project.vercel.app/api/notify"
echo "   - Web Interface: https://your-project.vercel.app/view.html"
echo ""
echo "🧪 To test your deployment:"
echo "   1. Update BASE_URL in test-notifications.js"
echo "   2. Run: node test-notifications.js"
echo ""
echo "📚 For more info, see README.md"

curl -X POST https://script-bioa.vercel.app/api/notify \
  -H "Content-Type: application/json" \
  -d '{"app":"TestApp","title":"Hello","content":"World"}'

curl https://script-bioa.vercel.app/api/notifications

node test-notifications.js 