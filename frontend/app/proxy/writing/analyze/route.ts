import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Allows up to 5 minutes locally/Vercel (if on Pro)

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Proxy the request to the backend using native fetch.
    // Native fetch does not have the strict 30s timeout that Next.js rewrites (http-proxy) have.
    const backendUrl = process.env.BACKEND_URL || 'http://backend:8000';
    
    const res = await fetch(`${backendUrl}/writing/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      // No explicit timeout, defaults to Node's undici timeout (usually 300s)
    });

    if (!res.ok) {
      throw new Error(`Backend returned ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Proxy Error:", error);
    return NextResponse.json(
      { error: "Analysis failed or timed out", details: error.message },
      { status: 500 }
    );
  }
}
