import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const { cliente_id, tipo_movimiento, monto, descripcion } = await request.json();

    if (!cliente_id || !tipo_movimiento || !monto) {
      return NextResponse.json(
        { success: false, error: 'Cliente, tipo y monto son requeridos' },
        { status: 400 }
      );
    }

    if (!['FIADO', 'ABONO'].includes(tipo_movimiento)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de movimiento invalido' },
        { status: 400 }
      );
    }

    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      return NextResponse.json({ success: false, error: 'Monto invalido' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [clientes] = await connection.query(
        'SELECT * FROM clientes WHERE id = ? FOR UPDATE',
        [cliente_id]
      );

      if (clientes.length === 0) {
        await connection.rollback();
        connection.release();
        return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
      }

      const cliente = clientes[0];
      const saldoAnterior = parseFloat(cliente.saldo_actual);
      let tipoFinal = tipo_movimiento;
      let saldoNuevo;

      if (tipo_movimiento === 'FIADO') {
        saldoNuevo = saldoAnterior + montoNum;
      } else {
        if (montoNum >= saldoAnterior) {
          tipoFinal = 'CANCELACION_TOTAL';
          saldoNuevo = 0;
        } else {
          saldoNuevo = saldoAnterior - montoNum;
        }
      }

      await connection.query(
        'UPDATE clientes SET saldo_actual = ? WHERE id = ?',
        [saldoNuevo, cliente_id]
      );

      await connection.query(
        `INSERT INTO historial_transacciones (cliente_id, tipo_movimiento, monto, saldo_anterior, saldo_nuevo, descripcion)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [cliente_id, tipoFinal, montoNum, saldoAnterior, saldoNuevo, descripcion || null]
      );

      await connection.commit();
      connection.release();

      return NextResponse.json(
        {
          success: true,
          data: {
            tipo_movimiento: tipoFinal,
            monto: montoNum,
            saldo_anterior: saldoAnterior,
            saldo_nuevo: saldoNuevo,
            descripcion: descripcion || null,
          },
          cliente: {
            id: cliente.id,
            nombre: cliente.nombre,
            telefono: cliente.telefono,
            saldo_actual: saldoNuevo,
          },
        },
        { status: 201 }
      );
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
