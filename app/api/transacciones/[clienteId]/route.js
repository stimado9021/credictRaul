import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { clienteId } = params;

    const [cliente] = await pool.query('SELECT * FROM clientes WHERE id = ?', [clienteId]);

    if (cliente.length === 0) {
      return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
    }

    const [transacciones] = await pool.query(
      'SELECT * FROM historial_transacciones WHERE cliente_id = ? ORDER BY fecha DESC',
      [clienteId]
    );

    return NextResponse.json({
      success: true,
      data: {
        cliente: cliente[0],
        transacciones,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
