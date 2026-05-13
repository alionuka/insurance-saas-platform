import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-key'
);

export async function middleware(request: NextRequest) {
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
    // Invalid signature, expired token, or malformed JWT
    const response = redirectToSignIn(request, pathname);
    response.cookies.set('access_token', '', { path: '/', maxAge: 0 });
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
