import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = 'SELECT * FROM clientes ORDER BY creado_en DESC';
    let params = [];

    if (search && search.trim()) {
      query = 'SELECT * FROM clientes WHERE nombre LIKE ? OR telefono LIKE ? ORDER BY creado_en DESC';
      params = [`%${search.trim()}%`, `%${search.trim()}%`];
    }

    const [rows] = await pool.query(query, params);
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { nombre, telefono } = await request.json();

    if (!nombre || !telefono) {
      return NextResponse.json(
        { success: false, error: 'Nombre y telefono son requeridos' },
        { status: 400 }
      );
    }

    const [result] = await pool.query(
      'INSERT INTO clientes (nombre, telefono) VALUES (?, ?)',
      [nombre, telefono]
    );

    const [cliente] = await pool.query('SELECT * FROM clientes WHERE id = ?', [result.insertId]);

    return NextResponse.json({ success: true, data: cliente[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
