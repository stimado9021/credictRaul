import { NextResponse } from 'next/server';
import { getClient } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { telefono, mensaje } = await request.json();
    const { client, isReady } = getClient();

    if (!isReady()) {
      return NextResponse.json(
        { error: 'WhatsApp no conectado. Escanea el QR primero.' },
        { status: 400 }
      );
    }

    const numero = telefono.replace(/[^0-9]/g, '');
    const chatId = `${numero}@c.us`;

    await client.sendMessage(chatId, mensaje);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
