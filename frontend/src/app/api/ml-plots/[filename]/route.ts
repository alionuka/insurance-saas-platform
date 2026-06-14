import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Proxies a single ML training plot PNG from the backend to the browser.
// Used by the admin ML-models dashboard so that <img src="..."> requests can
// authenticate via the httpOnly access_token cookie (which the browser cannot
// attach to direct cross-origin requests against the backend).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
): Promise<NextResponse> {
  const { filename } = await params;

  // Defensive: only allow simple PNG filenames — no path traversal.
  if (!/^[a-z0-9_]+\.png$/i.test(filename)) {
    return new NextResponse('Invalid filename', { status: 400 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  if (!token) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const upstream = await fetch(
      `${API_URL}/admin/ml-models/plots/${filename}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      },
    );

    if (!upstream.ok) {
      return new NextResponse('Plot not available', { status: upstream.status });
    }

    const buffer = await upstream.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    console.error(`Failed to proxy ML plot ${filename}:`, err);
    return new NextResponse('Plot service unavailable', { status: 503 });
  }
}
