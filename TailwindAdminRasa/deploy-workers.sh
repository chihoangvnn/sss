#!/bin/bash

# Multi-Region Serverless Worker Deployment Script
# Deploys auto-posting workers across all 13 supported global regions

set -e

echo "🌍 Multi-Region Auto-Posting Worker Deployment"
echo "=============================================="

# Prerequisites check
if ! command -v vercel &> /dev/null; then
    echo "❌ Error: Vercel CLI not found. Install with: npm i -g vercel"
    exit 1
fi

echo "📋 Prerequisites:"
echo "   1. Vercel CLI installed and logged in (vercel login)"
echo "   2. Project linked to Vercel organization (vercel link)"
echo "   3. Required environment variables set"
echo ""

# Configuration - MODIFY THESE VALUES
VERCEL_ORG="${VERCEL_ORG:-your-vercel-org}"
BRAIN_BASE_URL="${BRAIN_BASE_URL:-https://your-brain-server.com}"
WORKER_REGISTRATION_SECRET="${WORKER_REGISTRATION_SECRET:-your-secret}"
FACEBOOK_APP_ID="${FACEBOOK_APP_ID}"
FACEBOOK_APP_SECRET="${FACEBOOK_APP_SECRET}"

# Validate required environment variables
if [[ -z "$BRAIN_BASE_URL" || "$BRAIN_BASE_URL" == "https://your-brain-server.com" ]]; then
    echo "❌ Error: BRAIN_BASE_URL must be set to your actual Brain server URL"
    exit 1
fi

if [[ -z "$WORKER_REGISTRATION_SECRET" || "$WORKER_REGISTRATION_SECRET" == "your-secret" ]]; then
    echo "❌ Error: WORKER_REGISTRATION_SECRET must be set"
    exit 1
fi

if [[ -z "$FACEBOOK_APP_ID" || -z "$FACEBOOK_APP_SECRET" ]]; then
    echo "❌ Error: FACEBOOK_APP_ID and FACEBOOK_APP_SECRET must be set"
    exit 1
fi

# Regional mapping: logical region -> Vercel region
declare -A REGIONS=(
  # Americas
  ["us-east-1"]="iad1"      # N. Virginia
  ["us-west-2"]="sfo1"      # Oregon  
  ["sa-east-1"]="gru1"      # São Paulo

  # Europe
  ["eu-west-1"]="dub1"      # Ireland
  ["eu-central-1"]="fra1"   # Frankfurt
  ["eu-south-1"]="mxp1"     # Milan
  ["eu-north-1"]="arn1"     # Stockholm

  # Asia Pacific  
  ["ap-southeast-1"]="sin1" # Singapore
  ["ap-southeast-2"]="syd1" # Sydney
  ["ap-northeast-1"]="hnd1" # Tokyo
  ["ap-south-1"]="bom1"     # Mumbai

  # Middle East & Africa
  ["me-south-1"]="bah1"     # Bahrain
  ["af-south-1"]="cpt1"     # Cape Town
)

# Platform support configuration
PLATFORMS="facebook,instagram,twitter,tiktok"

echo "📋 Configuration:"
echo "   Brain Server: $BRAIN_BASE_URL"
echo "   Regions: ${#REGIONS[@]} global regions"
echo "   Platforms: $PLATFORMS"
echo ""

# Check if vercel-worker-template exists
if [[ ! -d "vercel-worker-template" ]]; then
    echo "❌ Error: vercel-worker-template directory not found"
    echo "   Make sure you're running this script from the project root"
    exit 1
fi

# Deployment counter
deployed_count=0
failed_count=0
failed_regions=()

echo "🚀 Starting regional worker deployments..."
echo ""

# Deploy workers for each region
for logical_region in "${!REGIONS[@]}"; do
    vercel_region="${REGIONS[$logical_region]}"
    worker_id="autoposting-worker-${logical_region}"
    
    echo "🛰️  Deploying: ${logical_region} → ${vercel_region}"
    echo "   Worker ID: ${worker_id}"
    
    cd vercel-worker-template
    
    # Deploy with region-specific configuration
    if vercel --prod \
        --scope "${VERCEL_ORG}" \
        --name "${worker_id}" \
        --regions="${vercel_region}" \
        -e "BRAIN_BASE_URL=${BRAIN_BASE_URL}" \
        -e "WORKER_ID=${worker_id}" \
        -e "WORKER_REGION=${logical_region}" \
        -e "WORKER_PLATFORMS=${PLATFORMS}" \
        -e "WORKER_REGISTRATION_SECRET=${WORKER_REGISTRATION_SECRET}" \
        -e "FACEBOOK_APP_ID=${FACEBOOK_APP_ID}" \
        -e "FACEBOOK_APP_SECRET=${FACEBOOK_APP_SECRET}" \
        --yes; then
        
        echo "   ✅ Deployed successfully!"
        ((deployed_count++))
    else
        echo "   ❌ Deployment failed!"
        ((failed_count++))
        failed_regions+=("${logical_region}")
    fi
    
    cd ..
    echo ""
    
    # Brief pause to avoid rate limiting
    sleep 2
done

echo "=============================================="
echo "🎉 Deployment Summary"
echo "=============================================="
echo "✅ Successfully deployed: ${deployed_count} workers"
echo "❌ Failed deployments: ${failed_count} workers"

if [[ ${failed_count} -gt 0 ]]; then
    echo ""
    echo "Failed regions:"
    for region in "${failed_regions[@]}"; do
        echo "   - ${region}"
    done
    echo ""
    echo "💡 To retry failed deployments:"
    echo "   1. Check your Vercel account limits"
    echo "   2. Verify environment variables are set correctly"
    echo "   3. Re-run this script or deploy failed regions manually"
fi

echo ""
echo "🌍 Global Coverage Active:"
echo "   Total Regions: ${deployed_count}/13"
echo "   Platforms: 4 (Facebook, Instagram, Twitter, TikTok)"
echo "   Expected Worker Registration: Check Brain server logs"

echo ""
echo "📊 Next Steps:"
echo "   1. Monitor Brain server logs for worker registrations"
echo "   2. Test posting functionality in different regions"
echo "   3. Check worker health at: ${BRAIN_BASE_URL}/api/workers/status"

if [[ ${deployed_count} -eq 13 ]]; then
    echo ""
    echo "🎉 SUCCESS: All 13 regional workers deployed!"
    echo "   Your auto-posting system now has global coverage."
else
    echo ""
    echo "⚠️  PARTIAL DEPLOYMENT: ${deployed_count}/13 workers active"
    echo "   Some regions may have limited coverage."
fi

echo ""
echo "=============================================="