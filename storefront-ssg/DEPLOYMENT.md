# 🚀 Custom Domain Deployment Guide

## Overview

This guide helps you deploy the Next.js SSG frontend with your Replit backend using either the default `.replit.dev` domain or a custom domain.

## 📋 Prerequisites

- Replit backend running and accessible
- Vercel account for frontend deployment
- Domain name (optional, for custom domain setup)

## 🔧 Configuration Options

### Option 1: Use Replit Default Domain (Quickest)

```bash
# Setup for Replit default domain
node scripts/setup-domain.js replit
```

**Pros:**
- ✅ Works immediately
- ✅ No DNS configuration needed
- ✅ Free SSL certificate included

**Cons:**
- ❌ Long, non-branded URL
- ❌ Not suitable for production

### Option 2: Custom Domain (Recommended for Production)

```bash
# Setup for custom domain
node scripts/setup-domain.js custom
```

**Pros:**
- ✅ Professional branded URL
- ✅ Better SEO and user experience
- ✅ Custom SSL certificate

**Requires:**
- 🔧 DNS configuration
- 🔧 Domain ownership

## 🌐 Setting Up Custom Domain in Replit

### Step 1: Configure Replit Deployment

1. **Open your Replit project**
2. **Go to the "Deployments" tab**
3. **Click "Settings" → "Link a domain"**
4. **Choose "Manually connect from another registrar"**

### Step 2: Configure DNS Records

Replit will provide you with:
- **A Record**: Points to Replit's servers
- **TXT Record**: Verifies domain ownership

Add these records to your domain registrar:

```dns
Type: A
Name: api (or @)
Value: [IP provided by Replit]
TTL: 300

Type: TXT  
Name: [verification code from Replit]
Value: [verification value from Replit]
TTL: 300
```

### Step 3: Update Frontend Configuration

1. **Edit `.env.local`:**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
```

2. **Test the connection:**
```bash
npm run dev
```

## 🔄 Backend CORS Configuration

Update your Replit backend to allow your frontend domain:

```javascript
// In your Replit backend
app.use(cors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'https://your-storefront.vercel.app',
    'http://localhost:3000' // For development
  ],
  credentials: true
}));
```

## 🚀 Vercel Deployment

### Method 1: Automatic Deployment

1. **Connect your Git repository to Vercel**
2. **Configure environment variables in Vercel dashboard:**

```env
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
NEXT_PUBLIC_FALLBACK_API_URL=https://your-replit-backup.replit.dev
```

3. **Deploy automatically on Git push**

### Method 2: Manual Deployment

```bash
# Build and export static files
npm run build

# Deploy to Vercel
vercel deploy --prod
```

## 🔍 Health Checks & Monitoring

The system includes built-in health checks:

- **Automatic failover** to backup URLs
- **Health check endpoint**: `/api/health`
- **Connection monitoring** with retries
- **Error logging** for debugging

## 🛠️ Troubleshooting

### Common Issues

**1. CORS Errors**
```
Access to fetch at 'https://api.yourdomain.com' from origin 'https://your-storefront.vercel.app' has been blocked by CORS policy
```

**Solution:** Update CORS configuration in your Replit backend

**2. DNS Propagation Delays**
```
DNS resolution failed for api.yourdomain.com
```

**Solution:** Wait 24-48 hours for DNS propagation or use DNS checker tools

**3. SSL Certificate Issues**
```
SSL certificate verification failed
```

**Solution:** Ensure Replit has generated SSL certificates (usually automatic)

### Debug Commands

```bash
# Test backend health
curl https://api.yourdomain.com/api/health

# Check DNS resolution
nslookup api.yourdomain.com

# Test CORS
curl -H "Origin: https://your-storefront.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api.yourdomain.com/api/health
```

## 📊 Performance Optimization

### CDN Configuration

Enable Vercel's CDN for static assets:

```javascript
// In vercel.json
{
  "headers": [
    {
      "source": "/_next/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Backend Optimization

Consider upgrading to Replit's Reserved VM for better performance:

- **Guaranteed uptime**
- **Faster response times**
- **Dedicated resources**

## 🔐 Security Best Practices

1. **Environment Variables**
   - Never commit API keys to Git
   - Use Vercel's environment variable settings
   - Rotate secrets regularly

2. **CORS Configuration**
   - Only allow trusted domains
   - Use specific origins instead of wildcards
   - Enable credentials only when needed

3. **SSL/TLS**
   - Always use HTTPS in production
   - Verify SSL certificates are valid
   - Enable HSTS headers

## 📈 Monitoring & Analytics

Set up monitoring for your deployment:

1. **Vercel Analytics** - Built-in performance monitoring
2. **Custom Health Checks** - Monitor backend availability
3. **Error Tracking** - Log and track errors
4. **Performance Metrics** - Monitor response times

## 🆘 Support

If you encounter issues:

1. **Check the logs** in Vercel dashboard
2. **Review Replit deployment** status
3. **Verify DNS configuration** with your registrar
4. **Test health endpoints** manually

The system is designed with robust error handling and automatic failover to ensure maximum uptime.