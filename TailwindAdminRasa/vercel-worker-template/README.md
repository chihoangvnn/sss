# 🦾 Distributed Auto-Posting Worker (Vercel)

This is a serverless worker template for the distributed auto-posting system. It represents the **"Arms"** in the Brain-Arms-Satellites architecture, executing social media posts across multiple regions for IP diversity.

## 🏗️ Architecture Overview

```
🧠 Brain (Railway/Render)     - Central coordination & job distribution
    ↓ JWT-secured communication
🦾 Arms (Vercel Functions)    - This worker template 
    ↓ API calls across regions
🛰️ Satellites (1000+ pages)   - Facebook/Instagram/Twitter pages
```

## ✨ Features

- **Serverless Execution**: Runs on Vercel's global edge network
- **IP Diversity**: Each deployment region provides different IP addresses
- **Secure Communication**: JWT authentication with Brain server
- **Real-time Progress**: Reports job status back to Brain
- **Platform Support**: Facebook (active), Instagram & Twitter (coming soon)
- **Auto-retry Logic**: Intelligent failure handling and retry mechanisms
- **Performance Monitoring**: Execution time and success rate tracking

## 🚀 Quick Deploy

### 1. One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/vercel-worker-template)

### 2. Manual Deployment

```bash
# Clone this template
git clone <worker-template-repo>
cd vercel-worker-template

# Install dependencies
npm install

# Configure environment variables (see Configuration section)
cp .env.example .env.local

# Deploy to Vercel
npx vercel --prod
```

## ⚙️ Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BRAIN_BASE_URL` | Base URL of your Brain server | `https://brain.railway.app` |
| `WORKER_REGISTRATION_SECRET` | Secret for worker authentication | `super-secret-key-123` |
| `WORKER_ID` | Unique identifier for this worker | `vercel-worker-us-east-1` |
| `WORKER_REGION` | AWS region this worker runs in | `us-east-1` |
| `WORKER_PLATFORMS` | Comma-separated platforms | `facebook,instagram` |
| `FACEBOOK_APP_ID` | Facebook App ID | `1234567890123456` |
| `FACEBOOK_APP_SECRET` | Facebook App Secret | `abc123def456...` |

### Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable from the table above
4. Deploy your changes

## 🌍 Multi-Region Deployment

Deploy multiple workers across different regions for IP diversity:

### Americas
- `us-east-1` (Virginia) - Primary
- `us-west-2` (Oregon) - Secondary  
- `sa-east-1` (São Paulo) - South America

### Europe
- `eu-west-1` (Dublin) - Primary
- `eu-central-1` (Frankfurt) - Secondary
- `eu-north-1` (Stockholm) - Nordic

### Asia Pacific
- `ap-southeast-1` (Singapore) - Primary
- `ap-northeast-1` (Tokyo) - Secondary
- `ap-south-1` (Mumbai) - India

### Deployment Commands

```bash
# Deploy to multiple regions
vercel --prod --regions us-east-1,us-west-2,eu-west-1

# Or deploy separate instances with different configs
WORKER_REGION=us-east-1 vercel --prod
WORKER_REGION=eu-west-1 vercel --prod  
WORKER_REGION=ap-southeast-1 vercel --prod
```

## 🔧 Development

### Local Development

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev

# Test the worker endpoint
curl -X POST http://localhost:3000/api/worker
```

### Testing

```bash
# Test worker functionality
npm test

# Manual testing with curl
curl -X POST https://your-worker.vercel.app/api/worker \
  -H "Content-Type: application/json"
```

## 🔐 Security Features

- **JWT Authentication**: All communication with Brain is secured
- **Worker Registration**: Requires pre-shared secret for initial authentication  
- **Job Ownership**: Workers can only process jobs assigned to them
- **Lock Token Validation**: Prevents race conditions and duplicate processing
- **Error Sanitization**: Sensitive data is never logged or exposed

## 📊 Monitoring & Analytics

### Built-in Metrics
- Job execution time tracking
- Success/failure rate monitoring
- Platform-specific performance stats
- Regional performance comparison

### Vercel Analytics Integration
- Function execution time
- Memory usage monitoring
- Error rate tracking
- Geographic distribution

### Brain Dashboard
- Real-time worker status
- Job distribution analytics
- Performance optimization insights

## 🛠️ Platform Support

### ✅ Facebook (Active)
- Text posts with captions
- Media upload support (coming soon)
- Page posting with proper tokens
- Error handling for API limits

### 🔄 Instagram (Coming Soon)
- Photo/video posting
- Story publishing
- IGTV content upload
- Shopping post creation

### 🔄 Twitter (Coming Soon)  
- Tweet posting with media
- Thread creation
- Twitter Spaces integration
- Tweet scheduling

## 🚨 Troubleshooting

### Common Issues

**Authentication Errors**
```
Error: Authentication failed: 401
```
- Check `WORKER_REGISTRATION_SECRET` matches Brain server
- Verify `BRAIN_BASE_URL` is correct and accessible

**Job Processing Failures**
```
Error: Failed to pull jobs: 403
```
- Ensure worker platforms match Brain configuration
- Check worker region is supported by Brain

**Facebook API Errors**
```
Error: Facebook API error: Invalid access token
```
- Verify `FACEBOOK_APP_ID` and `FACEBOOK_APP_SECRET`
- Check page access tokens are valid and not expired

### Debug Mode

Enable debug logging:
```bash
# Set debug environment variable
DEBUG=worker:* vercel dev
```

### Health Check

Test worker health:
```bash
curl https://your-worker.vercel.app/api/worker
```

Expected response:
```json
{
  "success": true,
  "worker": {
    "id": "vercel-worker-us-east-1",
    "region": "us-east-1", 
    "platforms": ["facebook"]
  },
  "result": {
    "jobsPulled": 0,
    "jobsCompleted": 0,
    "jobsFailed": 0
  }
}
```

## 📚 API Reference

### Worker Endpoint
`POST /api/worker`

Processes jobs from Brain server and executes social media posts.

**Response:**
```json
{
  "success": true,
  "worker": {
    "id": "string",
    "region": "string", 
    "platforms": ["string"]
  },
  "result": {
    "jobsPulled": 0,
    "jobsCompleted": 0,
    "jobsFailed": 0,
    "errors": []
  },
  "processedAt": "2025-09-21T08:00:00.000Z"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Related

- [Brain Server](../brain-server) - Central coordination server
- [Satellites Dashboard](../satellites-dashboard) - Management interface
- [Documentation](../docs) - Complete system documentation