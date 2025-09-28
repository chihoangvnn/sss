import { NextRequest, NextResponse } from 'next/server';

// Backend URL configuration
const INTERNAL_BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://localhost:3001';
const EXTERNAL_BACKEND_URL = process.env.EXTERNAL_BACKEND_URL || 
  (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:3001');

export async function GET(request: NextRequest) {
  try {
    // Redirect to backend logout endpoint
    const backendLogoutUrl = `${EXTERNAL_BACKEND_URL}/api/logout`;
    
    return NextResponse.redirect(backendLogoutUrl);
  } catch (error) {
    console.error('Logout redirect error:', error);
    return NextResponse.json({ message: 'Logout service unavailable' }, { status: 503 });
  }
}