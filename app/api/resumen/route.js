import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [ventasHoy] = await pool.query(
      "SELECT COALESCE(SUM(monto), 0) AS total FROM historial_transacciones WHERE tipo_movimiento = 'FIADO' AND DATE(fecha) = CURDATE()"
    );
    const [pendientes] = await pool.query(
      'SELECT COALESCE(SUM(saldo_actual), 0) AS total FROM clientes'
    );
    const [abonosHoy] = await pool.query(
      "SELECT COALESCE(SUM(monto), 0) AS total FROM historial_transacciones WHERE tipo_movimiento IN ('ABONO', 'CANCELACION_TOTAL') AND DATE(fecha) = CURDATE()"
    );
    const [ganancias] = await pool.query(
      "SELECT COALESCE(SUM(monto), 0) AS total FROM historial_transacciones WHERE tipo_movimiento IN ('ABONO', 'CANCELACION_TOTAL')"
    );

    return NextResponse.json({
      success: true,
      data: {
        ventas_hoy: ventasHoy[0].total,
        cuentas_pendientes: pendientes[0].total,
        abonos_hoy: abonosHoy[0].total,
        ganancias_totales: ganancias[0].total,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
