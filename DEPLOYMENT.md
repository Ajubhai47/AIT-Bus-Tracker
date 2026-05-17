# Cloud Deployment Guide

This application is now configured for cloud deployment with HTTPS support. The geolocation features require HTTPS to work properly on mobile devices.

## Quick Deploy Options

### 1. Vercel (Recommended - Easiest)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 2. Railway (Good for Node.js apps)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway deploy
```

### 3. Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login and deploy
netlify login
netlify deploy --prod
```

### 4. Heroku
```bash
# Install Heroku CLI
# Create Procfile first
echo "web: npm run deploy:start" > Procfile

# Deploy
heroku create your-app-name
git push heroku main
```

### 5. Docker (Any cloud provider)
```bash
# Build image
docker build -t bus-tracker .

# Run locally to test
docker run -p 3000:3000 bus-tracker

# Deploy to any cloud provider that supports Docker
```

## Environment Variables Required

Set these in your cloud provider's dashboard:

```
MONGODB_URI=mongodb+srv://hanvithckm_db_user:4ai22ai022@sih1906.fuoum2e.mongodb.net/?retryWrites=true&w=majority&appName=sih1906
SESSION_SECRET=your-secure-jwt-secret-key
NODE_ENV=production
PORT=3000
```

## HTTPS Configuration

The app automatically:
- ✅ Redirects HTTP to HTTPS in production
- ✅ Sets security headers (HSTS, XSS protection, etc.)
- ✅ Handles port configuration for cloud platforms
- ✅ Provides health check endpoint at `/api/health`

## Geolocation Requirements

✅ **HTTPS Required**: GPS/location access only works over HTTPS in production
✅ **Cloud Benefits**: Most cloud providers (Vercel, Netlify, Railway) provide automatic HTTPS
✅ **Mobile Support**: Real-time location tracking will work on mobile devices

## Post-Deployment Checklist

1. ✅ Verify HTTPS is working: `https://your-domain.com`
2. ✅ Test geolocation: Allow location permissions on first visit
3. ✅ Check health: `https://your-domain.com/api/health`
4. ✅ Test bus tracking: Register as driver and start tracking
5. ✅ Verify student view: Check live location and bus markers

## Troubleshooting

**Location not working?**
- Ensure HTTPS is enabled
- Check browser location permissions
- Verify no mixed content (HTTP resources on HTTPS page)

**Build failing?**
- Check Node.js version (18+ recommended)
- Verify all environment variables are set
- Review build logs for specific errors

## Support

The application includes:
- Auto HTTPS redirect
- Security headers
- Health monitoring
- WebSocket real-time updates
- MongoDB Atlas integration
- Cross-platform compatibility