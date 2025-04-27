import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Clone the request headers
  const requestHeaders = new Headers(request.headers);

  // Add the COOP and COEP headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add the required headers for SharedArrayBuffer support
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  return response;
}

// Apply this middleware to all routes
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
}; 