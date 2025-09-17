# Facebook OAuth Integration Setup

## Required Environment Variables

To enable Facebook OAuth integration, you need to set up the following environment variables in Replit's Secrets tab:

### 1. FACEBOOK_APP_ID
- **Description**: Your Facebook App ID from Facebook Developers Console
- **Example**: `123456789012345`
- **How to get**: 
  1. Go to [Facebook Developers](https://developers.facebook.com/)
  2. Create or select your app
  3. Copy the App ID from the Basic Settings

### 2. FACEBOOK_APP_SECRET
- **Description**: Your Facebook App Secret (keep this confidential)
- **Example**: `abcdef1234567890abcdef1234567890`
- **How to get**:
  1. Go to [Facebook Developers](https://developers.facebook.com/)
  2. Navigate to App Settings > Basic
  3. Copy the App Secret (you may need to click "Show")
  4. **NEVER** expose this in client-side code

### 3. FACEBOOK_REDIRECT_URI
- **Description**: The OAuth callback URL for your application
- **For Development**: `http://localhost:5000/auth/facebook/callback`
- **For Production**: `https://your-replit-url.replit.dev/auth/facebook/callback`
- **Note**: This must match exactly what's configured in your Facebook App settings

## Facebook App Configuration

In your Facebook App settings, ensure:

1. **Valid OAuth Redirect URIs** includes your redirect URI
2. **App Domains** includes your domain (for production)
3. **Required Permissions** include:
   - `email` (basic profile access)
   - `pages_read_engagement` (read page insights)
   - `pages_show_list` (list user's pages)
   - `pages_manage_posts` (for future posting features)

## Setting Up Replit Secrets

1. Open your Replit project
2. Click on the "Secrets" tab (lock icon) in the left sidebar
3. Add each environment variable:
   - Key: `FACEBOOK_APP_ID`, Value: Your Facebook App ID
   - Key: `FACEBOOK_APP_SECRET`, Value: Your Facebook App Secret  
   - Key: `FACEBOOK_REDIRECT_URI`, Value: Your callback URL

## Testing the Integration

1. Navigate to `/social-media` in your application
2. Click "Kết nối Facebook" (Connect Facebook) button
3. You should be redirected to Facebook for authorization
4. After granting permissions, you'll be redirected back with a success message
5. Your Facebook account should appear in the social media panel with follower count and engagement metrics

## Features Implemented

- ✅ Secure OAuth 2.0 flow with CSRF protection
- ✅ Automatic token refresh (long-lived tokens)
- ✅ Facebook page insights (follower count, engagement)
- ✅ Account connection/disconnection
- ✅ Error handling and user feedback
- ✅ Production-ready security measures

## Security Features

- State parameter prevents CSRF attacks
- App Secret never exposed to client
- Secure token storage in database
- Proper error handling without data leakage
- Rate limiting for OAuth endpoints
- Token expiration management

## Troubleshooting

### "App Not Set Up" Error
- Verify FACEBOOK_APP_ID and FACEBOOK_APP_SECRET are set correctly
- Check that your app is properly configured in Facebook Developers Console

### "Invalid Redirect URI" Error
- Ensure FACEBOOK_REDIRECT_URI matches exactly what's configured in Facebook App settings
- Check for trailing slashes or protocol mismatches

### Connection Timeout
- Verify your Replit environment has internet access
- Check Facebook API status at [Facebook Platform Status](https://developers.facebook.com/status/)

### Permission Denied
- Ensure your Facebook app has the required permissions enabled
- Check that your app is in "Live" mode for production use

## Next Steps

Once Facebook OAuth is working:

1. **Analytics Integration**: Fetch detailed page insights and analytics
2. **Post Scheduling**: Implement content posting to Facebook pages
3. **Webhook Integration**: Set up real-time notifications for page activities
4. **Multi-Account Support**: Allow connecting multiple Facebook pages per user
5. **Instagram Integration**: Extend to include Instagram Business accounts

## API Endpoints Added

- `GET /auth/facebook` - Initiates Facebook OAuth flow
- `GET /auth/facebook/callback` - Handles OAuth callback
- `POST /api/facebook/connect` - Generates OAuth URL for frontend
- `DELETE /api/facebook/disconnect/:accountId` - Disconnects Facebook account