/**
 * Vercel Serverless Worker Function
 * The "Arms" in the Brain-Arms-Satellites architecture
 * 
 * This function:
 * 1. Authenticates with Brain using worker credentials
 * 2. Pulls jobs from Brain's Redis queue
 * 3. Executes Facebook/Instagram/Twitter API calls
 * 4. Reports results back to Brain via callbacks
 * 
 * Environment Variables Required:
 * - BRAIN_BASE_URL: Base URL of Brain server (e.g. https://your-brain.railway.app)
 * - WORKER_ID: Unique identifier for this worker instance
 * - WORKER_REGION: AWS region this function runs in (e.g. us-east-1)
 * - WORKER_PLATFORMS: Comma-separated platforms (e.g. facebook,instagram)
 * - WORKER_REGISTRATION_SECRET: Secret for worker registration
 * - FACEBOOK_APP_ID: Facebook App ID for API calls
 * - FACEBOOK_APP_SECRET: Facebook App Secret
 */

import fetch from 'node-fetch';

// Configuration from environment variables
const BRAIN_BASE_URL = process.env.BRAIN_BASE_URL;
const WORKER_ID = process.env.WORKER_ID || `vercel-worker-${Math.random().toString(36).substr(2, 9)}`;
const WORKER_REGION = process.env.WORKER_REGION || 'us-east-1';
const WORKER_PLATFORMS = (process.env.WORKER_PLATFORMS || 'facebook').split(',');
const WORKER_REGISTRATION_SECRET = process.env.WORKER_REGISTRATION_SECRET;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

// Worker state (persisted across invocations in memory)
let workerToken = null;
let tokenExpiry = null;

/**
 * Main Vercel serverless function handler
 */
export default async function handler(req, res) {
  console.log(`🚀 Vercel Worker ${WORKER_ID} started in region ${WORKER_REGION}`);
  
  // CORS headers for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Validate configuration
    if (!BRAIN_BASE_URL) {
      throw new Error('BRAIN_BASE_URL environment variable is required');
    }
    
    if (!WORKER_REGISTRATION_SECRET) {
      throw new Error('WORKER_REGISTRATION_SECRET environment variable is required');
    }

    // Authenticate with Brain if needed
    await ensureAuthenticated();

    // Pull and process jobs
    const result = await processJobs();

    res.status(200).json({
      success: true,
      worker: {
        id: WORKER_ID,
        region: WORKER_REGION,
        platforms: WORKER_PLATFORMS
      },
      result,
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Worker error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      worker: {
        id: WORKER_ID,
        region: WORKER_REGION
      },
      errorAt: new Date().toISOString()
    });
  }
}

/**
 * Authenticate with Brain server and get JWT token
 */
async function ensureAuthenticated() {
  // Check if token is still valid
  if (workerToken && tokenExpiry && new Date() < tokenExpiry) {
    return;
  }

  console.log(`🔑 Authenticating worker ${WORKER_ID} with Brain...`);

  const response = await fetch(`${BRAIN_BASE_URL}/api/workers/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      workerId: WORKER_ID,
      region: WORKER_REGION,
      platforms: WORKER_PLATFORMS,
      registrationSecret: WORKER_REGISTRATION_SECRET
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Authentication failed: ${response.status} - ${error}`);
  }

  const auth = await response.json();
  if (!auth.success || !auth.token) {
    throw new Error('Authentication failed - no token received');
  }

  workerToken = auth.token;
  // Token expires in 24 hours, refresh 1 hour early
  tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000);
  
  console.log(`✅ Worker ${WORKER_ID} authenticated successfully`);
}

/**
 * Pull jobs from Brain and process them
 */
async function processJobs() {
  const maxJobs = 3; // Process max 3 jobs per invocation
  const results = {
    jobsPulled: 0,
    jobsCompleted: 0,
    jobsFailed: 0,
    errors: []
  };

  try {
    // Pull jobs from Brain
    console.log(`📥 Pulling jobs from Brain (max ${maxJobs})...`);
    
    const response = await fetch(`${BRAIN_BASE_URL}/api/workers/jobs/pull?limit=${maxJobs}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${workerToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to pull jobs: ${response.status} - ${await response.text()}`);
    }

    const pullResult = await response.json();
    if (!pullResult.success || !pullResult.jobs) {
      throw new Error('Failed to pull jobs - invalid response');
    }

    const jobs = pullResult.jobs;
    results.jobsPulled = jobs.length;
    
    console.log(`📋 Pulled ${jobs.length} jobs from Brain`);

    // Process each job
    for (const job of jobs) {
      try {
        await processJob(job);
        results.jobsCompleted++;
        console.log(`✅ Job ${job.jobId} completed successfully`);
      } catch (error) {
        results.jobsFailed++;
        results.errors.push(`Job ${job.jobId}: ${error.message}`);
        console.error(`❌ Job ${job.jobId} failed:`, error);
        
        // Report failure to Brain
        await reportJobFailure(job.jobId, error, job.lockToken);
      }
    }

    return results;

  } catch (error) {
    results.errors.push(`Job processing error: ${error.message}`);
    throw error;
  }
}

/**
 * Process a single job
 */
async function processJob(job) {
  const { jobId, platform, data, lockToken } = job;
  const startTime = Date.now();

  console.log(`🔄 Processing job ${jobId} for platform ${platform}`);

  // Report job started
  await reportJobProgress(jobId, 'started', 'Job execution started');

  // Get credentials for this job
  const credentials = await getJobCredentials(data.accountId, jobId);
  
  // Execute platform-specific posting
  let result;
  switch (platform) {
    case 'facebook':
      result = await postToFacebook(data, credentials);
      break;
    case 'instagram':
      result = await postToInstagram(data, credentials);
      break;
    case 'twitter':
      result = await postToTwitter(data, credentials);
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }

  const executionTime = Date.now() - startTime;

  // Report job completion
  await reportJobCompletion(jobId, result, executionTime, lockToken);
}

/**
 * Get credentials for job execution
 */
async function getJobCredentials(accountId, jobId) {
  console.log(`🔐 Getting credentials for account ${accountId}...`);

  const response = await fetch(`${BRAIN_BASE_URL}/api/workers/credentials/${accountId}?jobId=${jobId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${workerToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get credentials: ${response.status} - ${await response.text()}`);
  }

  const credResult = await response.json();
  if (!credResult.success || !credResult.credentials) {
    throw new Error('Failed to get credentials - invalid response');
  }

  return credResult.credentials;
}

/**
 * Post content to Facebook
 */
async function postToFacebook(jobData, credentials) {
  console.log(`📘 Posting to Facebook page...`);
  
  await reportJobProgress(jobData.jobId, 'posting', 'Publishing to Facebook');

  const { content, targetAccount } = jobData;
  const pageAccessToken = credentials.pageAccessToken;
  
  if (!pageAccessToken) {
    throw new Error('No Facebook page access token available');
  }

  // Prepare post data
  const postData = {
    message: content.caption,
    access_token: pageAccessToken
  };

  // Add media if present
  if (content.assetIds && content.assetIds.length > 0) {
    // For simplicity, we'll just post text for now
    // In production, you'd upload media first then attach to post
    console.log(`📸 Note: ${content.assetIds.length} media files would be uploaded`);
  }

  // Make Facebook API call
  const response = await fetch(`https://graph.facebook.com/v18.0/${targetAccount.id}/feed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(postData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Facebook API error: ${response.status} - ${error}`);
  }

  const result = await response.json();
  
  if (result.error) {
    throw new Error(`Facebook API error: ${result.error.message}`);
  }

  return {
    platformPostId: result.id,
    platformUrl: `https://facebook.com/${result.id}`,
    analytics: {
      postType: 'text',
      mediaCount: content.assetIds?.length || 0,
      hashtagCount: content.hashtags?.length || 0,
      captionLength: content.caption?.length || 0
    }
  };
}

/**
 * Post content to Instagram (placeholder)
 */
async function postToInstagram(jobData, credentials) {
  console.log(`📷 Instagram posting not yet implemented`);
  throw new Error('Instagram posting not yet implemented');
}

/**
 * Post content to Twitter (placeholder)
 */
async function postToTwitter(jobData, credentials) {
  console.log(`🐦 Twitter posting not yet implemented`);
  throw new Error('Twitter posting not yet implemented');
}

/**
 * Report job progress to Brain
 */
async function reportJobProgress(jobId, status, message) {
  try {
    await fetch(`${BRAIN_BASE_URL}/api/callbacks/jobs/${jobId}/progress`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${workerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status,
        message,
        progress: getProgressPercent(status),
        region: WORKER_REGION
      })
    });
  } catch (error) {
    console.warn(`Failed to report progress for job ${jobId}:`, error);
  }
}

/**
 * Report job completion to Brain
 */
async function reportJobCompletion(jobId, result, executionTime, lockToken) {
  console.log(`✅ Reporting completion for job ${jobId}...`);

  const response = await fetch(`${BRAIN_BASE_URL}/api/callbacks/jobs/${jobId}/complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${workerToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      platformPostId: result.platformPostId,
      platformUrl: result.platformUrl,
      analytics: result.analytics,
      executionTime,
      lockToken
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to report completion: ${response.status} - ${await response.text()}`);
  }

  const completionResult = await response.json();
  if (!completionResult.success) {
    throw new Error(`Brain rejected completion: ${completionResult.error}`);
  }
}

/**
 * Report job failure to Brain
 */
async function reportJobFailure(jobId, error, lockToken) {
  console.log(`❌ Reporting failure for job ${jobId}...`);

  try {
    const response = await fetch(`${BRAIN_BASE_URL}/api/callbacks/jobs/${jobId}/fail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${workerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: error.message,
        errorCode: error.code || 'UNKNOWN_ERROR',
        shouldRetry: shouldRetry(error),
        retryAfter: getRetryDelay(error),
        lockToken
      })
    });

    if (!response.ok) {
      console.warn(`Failed to report failure for job ${jobId}: ${response.status}`);
    }
  } catch (reportError) {
    console.warn(`Failed to report failure for job ${jobId}:`, reportError);
  }
}

/**
 * Determine if job should be retried based on error
 */
function shouldRetry(error) {
  // Don't retry authentication or permission errors
  if (error.message.includes('authentication') || 
      error.message.includes('permission') ||
      error.message.includes('access_token')) {
    return false;
  }
  
  // Don't retry validation errors
  if (error.message.includes('validation') ||
      error.message.includes('invalid')) {
    return false;
  }
  
  // Retry network and temporary errors
  return true;
}

/**
 * Get retry delay based on error type
 */
function getRetryDelay(error) {
  // Rate limit errors - longer delay
  if (error.message.includes('rate limit') || 
      error.message.includes('429')) {
    return 15 * 60 * 1000; // 15 minutes
  }
  
  // Server errors - medium delay
  if (error.message.includes('500') || 
      error.message.includes('502') ||
      error.message.includes('503')) {
    return 5 * 60 * 1000; // 5 minutes
  }
  
  // Default retry delay
  return 2 * 60 * 1000; // 2 minutes
}

/**
 * Get progress percentage for status
 */
function getProgressPercent(status) {
  const progressMap = {
    'started': 10,
    'uploading': 30,
    'processing': 50,
    'posting': 80,
    'analyzing': 90
  };
  
  return progressMap[status] || 0;
}