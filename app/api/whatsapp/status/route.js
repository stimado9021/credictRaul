import { NextResponse } from 'next/server';
import { getClient } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = getClient();
    return NextResponse.json({
      ready: state.isReady(),
      qr: state.getQR(),
      error: state.error(),
    });
  } catch (e) {
    return NextResponse.json(
      { ready: false, qr: null, error: e.message },
      { status: 500 }
    );
  }
}
