import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const authDir = path.join(process.cwd(), '.wwebjs_auth');
    const cacheDir = path.join(process.cwd(), '.wwebjs_cache');

    if (global.__waState) {
      if (global.__waState.client) {
        try {
          global.__waState.client.destroy();
        } catch {}
      }
      global.__waState.client = null;
      global.__waState.qrCode = null;
      global.__waState.isReady = false;
      global.__waState.initializing = false;
      global.__waState.errorMsg = null;
    }

    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true });
    }
    if (fs.existsSync(cacheDir)) {
      fs.rmSync(cacheDir, { recursive: true, force: true });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
