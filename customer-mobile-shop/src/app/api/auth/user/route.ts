import { NextRequest, NextResponse } from 'next/server';

// Backend URL configuration - use HTTP for internal server-to-server communication
const INTERNAL_BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  try {
    // Forward the request to backend server
    const response = await fetch(`${INTERNAL_BACKEND_URL}/api/auth/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward cookies for session management
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    
    // Create response with proper headers
    const nextResponse = NextResponse.json(data);
    
    // Forward Set-Cookie headers from backend
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      nextResponse.headers.set('Set-Cookie', setCookieHeader);
    }
    
    return nextResponse;
  } catch (error) {
    console.error('Auth user proxy error:', error);
    return NextResponse.json({ message: 'Authentication service unavailable' }, { status: 503 });
  }
}