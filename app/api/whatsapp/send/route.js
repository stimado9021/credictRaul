import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { telefono, mensaje } = await request.json();

    if (!telefono || !mensaje) {
      return NextResponse.json(
        { error: 'Telefono y mensaje requeridos' },
        { status: 400 }
      );
    }

    const numero = telefono.replace(/[^0-9]/g, '');

    await pool.query(
      'INSERT INTO whatsapp_queue (telefono, mensaje) VALUES (?, ?)',
      [numero, mensaje]
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
