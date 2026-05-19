import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-key'
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = pathname.startsWith('/dashboard');

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    return redirectToSignIn(request, pathname);
  }

  try {
    await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] });
    return NextResponse.next();
  } catch (err) {
    const refreshToken = request.cookies.get('refresh_token')?.value;
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/refresh`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          }
        );

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const { access_token, refresh_token: new_refresh_token } = data;

          // Verify new access token is valid
          await jwtVerify(access_token, JWT_SECRET, { algorithms: ['HS256'] });

          const response = NextResponse.next();
          response.cookies.set('access_token', access_token, { path: '/', maxAge: 86400, sameSite: 'lax' });
          response.cookies.set('refresh_token', new_refresh_token, { path: '/', maxAge: 604800, sameSite: 'lax' });
          return response;
        }
      } catch (refreshErr) {
        console.error('Middleware token refresh failed:', refreshErr);
      }
    }

    // Invalid signature, expired token, or malformed JWT
    const response = redirectToSignIn(request, pathname);
    response.cookies.set('access_token', '', { path: '/', maxAge: 0 });
    response.cookies.set('refresh_token', '', { path: '/', maxAge: 0 });
    return response;
  }
}

function redirectToSignIn(request: NextRequest, originalPath: string) {
  const signInUrl = new URL('/auth/sign-in', request.url);
  signInUrl.searchParams.set('redirect', originalPath);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
