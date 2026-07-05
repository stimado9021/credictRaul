import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS pendientes FROM whatsapp_queue WHERE enviado = FALSE'
    );
    const pendientes = rows[0].pendientes;

    const [ultimo] = await pool.query(
      'SELECT enviado_en FROM whatsapp_queue WHERE enviado = TRUE ORDER BY enviado_en DESC LIMIT 1'
    );

    const conectado = ultimo.length > 0 &&
      Date.now() - new Date(ultimo[0].enviado_en).getTime() < 120000;

    return NextResponse.json({
      ready: conectado,
      pendientes,
      ultimo_envio: ultimo.length > 0 ? ultimo[0].enviado_en : null,
    });
  } catch (e) {
    return NextResponse.json({ ready: false, error: e.message });
  }
}
