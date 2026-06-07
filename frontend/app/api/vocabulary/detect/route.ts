import { NextRequest, NextResponse } from 'next/server';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Increase body size limit for this route
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const backendUrl = process.env.INTERNAL_BACKEND_URL || 'http://backend:8000';
    
    const response = await fetch(`${backendUrl}/vocabulary/detect`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: text, items: [] }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API Route] detect error:', error);
    return NextResponse.json({ error: error.message, items: [] }, { status: 500 });
  }
}
