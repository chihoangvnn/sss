import { NextRequest, NextResponse } from 'next/server';

// Backend URL configuration
const INTERNAL_BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://localhost:3001';
const EXTERNAL_BACKEND_URL = process.env.EXTERNAL_BACKEND_URL || 
  (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:3001');

export async function GET(request: NextRequest) {
  try {
    // Redirect to backend login endpoint
    const backendLoginUrl = `${EXTERNAL_BACKEND_URL}/api/login`;
    
    // Include query parameters if any
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const finalUrl = queryString ? `${backendLoginUrl}?${queryString}` : backendLoginUrl;
    
    return NextResponse.redirect(finalUrl);
  } catch (error) {
    console.error('Login redirect error:', error);
    return NextResponse.json({ message: 'Login service unavailable' }, { status: 503 });
  }
}