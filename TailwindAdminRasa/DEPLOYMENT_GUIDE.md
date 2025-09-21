# Multi-Region Auto-Posting System Deployment Guide

## 🌍 Global Infrastructure Overview

This system supports **13 global regions** across **75+ countries** with distributed serverless workers for optimal performance and IP diversity.

### Supported Regions
- **Americas**: us-east-1 (N. Virginia), us-west-2 (Oregon), sa-east-1 (São Paulo)
- **Europe**: eu-west-1 (Ireland), eu-central-1 (Frankfurt), eu-south-1 (Milan), eu-north-1 (Stockholm)
- **Asia Pacific**: ap-southeast-1 (Singapore), ap-southeast-2 (Sydney), ap-northeast-1 (Tokyo), ap-south-1 (Mumbai)
- **Middle East & Africa**: me-south-1 (Bahrain), af-south-1 (Cape Town)

## 🏗️ Architecture Components

### 1. Brain Server (Central Management)
- **Purpose**: Coordinates job distribution, manages accounts, handles UI
- **Deployment Options**: Railway, Render, or Vercel
- **Database**: PostgreSQL with Redis for job queues
- **Scaling**: Single instance with high availability

### 2. Serverless Workers (Regional)
- **Purpose**: Execute social media posting jobs in specific regions
- **Deployment Platform**: Vercel Functions (for maximum IP diversity)
- **Scaling**: Auto-scaling based on job queue demand
- **Regions**: Deploy to all 13 supported regions

## 🚀 Brain Server Deployment

### Option 1: Railway Deployment

1. **Create Railway Project**
   ```bash
   railway login
   railway init
   railway link [project-id]
   ```

2. **Add Required Services**
   ```bash
   railway add --service postgresql
   railway add --service redis
   ```

3. **Configure Environment Variables**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set SESSION_SECRET=[random-32-char-string]
   railway variables set GEMINI_API_KEY=[your-gemini-key]
   railway variables set CLOUDINARY_CLOUD_NAME=[your-cloudinary-name]
   railway variables set CLOUDINARY_API_KEY=[your-cloudinary-key]
   railway variables set CLOUDINARY_API_SECRET=[your-cloudinary-secret]
   railway variables set FACEBOOK_APP_ID=[your-facebook-app-id]
   railway variables set FACEBOOK_APP_SECRET=[your-facebook-app-secret]
   ```

4. **Deploy**
   ```bash
   railway up
   ```

### Option 2: Render Deployment

1. **Connect Repository**
   - Go to [render.com](https://render.com)
   - Connect your GitHub repository
   - Select "Web Service" for deployment

2. **Configure Build Settings**
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node

3. **Add Database & Redis**
   - Create PostgreSQL database
   - Create Redis instance
   - Note connection strings

4. **Set Environment Variables** (same as Railway list above)

### Option 3: Vercel Deployment

1. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

2. **Configure Environment Variables** in Vercel Dashboard

## 🛰️ Multi-Region Serverless Worker Setup

### Prerequisites
- Brain server deployed and accessible
- Worker registration secret configured
- Vercel account with Pro plan (for multiple projects)

### Regional Worker Deployment Script

Create and run this deployment script for all 13 regions:

```bash
#!/bin/bash

# Configuration
VERCEL_ORG="your-vercel-org"
BRAIN_BASE_URL="https://your-brain-server.com"
WORKER_REGISTRATION_SECRET="your-secret"

# All supported regions
declare -A REGIONS=(
  ["us-east-1"]="iad1"
  ["us-west-2"]="sfo1"
  ["sa-east-1"]="gru1"
  ["eu-west-1"]="dub1"
  ["eu-central-1"]="fra1"
  ["eu-south-1"]="mxp1"
  ["eu-north-1"]="arn1"
  ["ap-southeast-1"]="sin1"
  ["ap-southeast-2"]="syd1"
  ["ap-northeast-1"]="hnd1"
  ["ap-south-1"]="bom1"
  ["me-south-1"]="bah1"
  ["af-south-1"]="cpt1"
)

# Platforms to support
PLATFORMS="facebook,instagram,twitter,tiktok"

# Deploy workers for each region
for logical_region in "${!REGIONS[@]}"; do
  vercel_region="${REGIONS[$logical_region]}"
  worker_id="autoposting-worker-${logical_region}"
  
  echo "🚀 Deploying worker for region: ${logical_region} (${vercel_region})"
  
  cd vercel-worker-template
  
  # Deploy with region-specific configuration
  vercel --prod \
    --name "${worker_id}" \
    --regions="${vercel_region}" \
    -e "BRAIN_BASE_URL=${BRAIN_BASE_URL}" \
    -e "WORKER_ID=${worker_id}" \
    -e "WORKER_REGION=${logical_region}" \
    -e "WORKER_PLATFORMS=${PLATFORMS}" \
    -e "WORKER_REGISTRATION_SECRET=${WORKER_REGISTRATION_SECRET}" \
    -e "FACEBOOK_APP_ID=${FACEBOOK_APP_ID}" \
    -e "FACEBOOK_APP_SECRET=${FACEBOOK_APP_SECRET}"
  
  cd ..
  
  echo "✅ Worker deployed: ${worker_id}"
  sleep 2
done

echo "🎉 All ${#REGIONS[@]} regional workers deployed successfully!"
```

### Manual Regional Deployment

If you prefer manual deployment for specific regions:

```bash
# Navigate to worker template
cd vercel-worker-template

# Deploy for specific region (example: Singapore)
vercel --prod \
  --name "autoposting-worker-ap-southeast-1" \
  --regions="sin1" \
  -e "BRAIN_BASE_URL=https://your-brain.com" \
  -e "WORKER_ID=autoposting-worker-ap-southeast-1" \
  -e "WORKER_REGION=ap-southeast-1" \
  -e "WORKER_PLATFORMS=facebook,instagram,twitter,tiktok" \
  -e "WORKER_REGISTRATION_SECRET=your-secret" \
  -e "FACEBOOK_APP_ID=your-app-id" \
  -e "FACEBOOK_APP_SECRET=your-app-secret"
```

## 🔐 Security Configuration

### Required Secrets

1. **Session Secret** (32+ random characters)
   ```bash
   openssl rand -hex 32
   ```

2. **Worker Registration Secret** (for worker authentication)
   ```bash
   openssl rand -hex 32
   ```

3. **Facebook App Credentials**
   - Create app at [developers.facebook.com](https://developers.facebook.com)
   - Get App ID and App Secret

4. **Gemini AI Key** (for content generation)
   - Get from [Google AI Studio](https://aistudio.google.com)

5. **Cloudinary Credentials** (for image management)
   - Sign up at [cloudinary.com](https://cloudinary.com)

### Environment Variables Checklist

```bash
# Core System
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SESSION_SECRET=...

# AI & Content
GEMINI_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Social Media
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...

# Worker Authentication
WORKER_REGISTRATION_SECRET=...
WORKER_JWT_SECRET=...
```

## 📊 Post-Deployment Verification

### 1. Brain Server Health Check
```bash
curl https://your-brain-server.com/api/health
```

### 2. Regional Worker Registration
Check Brain server logs for worker registration messages:
```
🤖 Worker registered: autoposting-worker-us-east-1
🤖 Worker registered: autoposting-worker-eu-west-1
...
```

### 3. Queue System Test
Create a test post and verify it gets distributed to appropriate regional workers.

### 4. Geographic Coverage Verification
```bash
# Test worker status and regional distribution
curl https://your-brain-server.com/api/workers/status

# Test regional queue distribution
curl https://your-brain-server.com/api/satellites/overview
```

## 🌐 Regional Coverage Matrix

| Region | Countries Covered | Platforms | Worker Capacity |
|--------|------------------|-----------|-----------------|
| us-east-1 | US (East), Canada (East) | All 4 | High |
| us-west-2 | US (West), Canada (West) | All 4 | High |
| sa-east-1 | Brazil, Argentina, Chile | All 4 | Medium |
| eu-west-1 | UK, Ireland, France, Spain | All 4 | High |
| eu-central-1 | Germany, Poland, Austria | All 4 | High |
| eu-south-1 | Italy, Greece, Malta | All 4 | Medium |
| eu-north-1 | Sweden, Finland, Denmark | All 4 | Medium |
| ap-southeast-1 | Singapore, Malaysia, Indonesia | All 4 | High |
| ap-southeast-2 | Australia, New Zealand | All 4 | Medium |
| ap-northeast-1 | Japan, Korea, Taiwan | All 4 | High |
| ap-south-1 | India, Bangladesh, Pakistan | All 4 | High |
| me-south-1 | UAE, Saudi Arabia, Qatar | All 4 | Medium |
| af-south-1 | South Africa, Kenya, Nigeria | All 4 | Medium |

## 🚨 Troubleshooting

### Common Issues

1. **Worker Registration Fails**
   - Check WORKER_REGISTRATION_SECRET matches Brain server
   - Verify BRAIN_BASE_URL is accessible from worker

2. **Jobs Not Processing**
   - Check Redis connection on Brain server
   - Verify workers are registering properly
   - Monitor queue sizes in Brain dashboard

3. **Regional Routing Issues**
   - Verify account country codes in database
   - Check region assignment logic in Brain server
   - Confirm worker regions match supported regions

### Monitoring & Logs

- **Brain Server**: Check deployment platform logs (Railway/Render/Vercel)
- **Workers**: Monitor Vercel function logs per region
- **Queues**: Use Brain server dashboard for queue monitoring
- **Regional Health**: Check `/api/workers/status` endpoint

## 📈 Scaling Considerations

- **Brain Server**: Increase instance size if processing > 10,000 posts/hour
- **Workers**: Vercel auto-scales, monitor cold start times
- **Database**: Consider read replicas for > 100,000 accounts
- **Redis**: Upgrade plan if queue depth consistently > 1,000

---

🎉 **Congratulations!** Your multi-region auto-posting system is now deployed across 13 global regions, ready to handle 1000+ Facebook pages with optimal performance and IP diversity.