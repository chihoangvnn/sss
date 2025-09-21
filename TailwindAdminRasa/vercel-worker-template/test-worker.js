/**
 * Test script for Vercel worker
 * Run with: node test-worker.js
 */

import fetch from 'node-fetch';

const WORKER_URL = process.env.WORKER_URL || 'http://localhost:3000';

async function testWorker() {
  console.log('🧪 Testing Vercel worker...');
  console.log(`📍 Worker URL: ${WORKER_URL}/api/worker`);

  try {
    const response = await fetch(`${WORKER_URL}/api/worker`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Response Status: ${response.status}`);
    
    const result = await response.json();
    console.log('📋 Response Body:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ Worker test passed!');
      console.log(`🎯 Worker ID: ${result.worker.id}`);
      console.log(`🌍 Region: ${result.worker.region}`);
      console.log(`🔧 Platforms: ${result.worker.platforms.join(', ')}`);
    } else {
      console.log('❌ Worker test failed!');
      console.log(`🚨 Error: ${result.error}`);
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    process.exit(1);
  }
}

// Run test
testWorker();