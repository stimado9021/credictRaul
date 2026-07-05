'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import LoadingSpinner from '@/app/components/LoadingSpinner';

export default function HistorialPage() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.clienteId) return;
    fetch(`/api/transacciones/${params.clienteId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
        else setError(res.error);
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar historial');
        setLoading(false);
      });
  }, [params.clienteId]);

  const formatCurrency = (amount) => `$${parseFloat(amount).toFixed(2)}`;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTipoStyle = (tipo) => {
    switch (tipo) {
      case 'FIADO':
        return { text: 'Fiado', class: 'bg-brand-red/15 text-brand-red' };
      case 'ABONO':
        return { text: 'Abono', class: 'bg-brand-green/15 text-brand-green' };
      case 'CANCELACION_TOTAL':
        return { text: 'Cancelacion Total', class: 'bg-brand-green/15 text-brand-green' };
      default:
        return { text: tipo, class: 'bg-gray-700 text-gray-300' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <LoadingSpinner size="lg" className="text-brand-red" />
          <span className="text-sm">Cargando historial...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-900/50 text-red-400 px-4 py-3 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { cliente, transacciones } = data;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-surface-border bg-surface-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">{cliente.nombre}</h1>
            <p className="text-sm text-gray-400">{cliente.telefono}</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Cliente desde{' '}
              {new Date(cliente.creado_en).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Saldo Actual</p>
            <p
              className={`text-2xl sm:text-3xl font-bold ${
                parseFloat(cliente.saldo_actual) > 0 ? 'text-brand-red' : 'text-brand-green'
              }`}
            >
              {formatCurrency(cliente.saldo_actual)}
            </p>
            {parseFloat(cliente.saldo_actual) === 0 && (
              <span className="inline-block mt-1 bg-brand-green/15 text-brand-green text-[10px] px-2.5 py-0.5 rounded-full font-semibold tracking-wide">
                SALVO Y PAZ
              </span>
            )}
          </div>
        </div>
      </div>

      <h2 className="text-lg font-bold text-white">Historial de Movimientos</h2>

      <div className="rounded-xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  Saldo Anterior
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Saldo Nuevo
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                  Descripcion
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {transacciones.map((t) => {
                const tipo = getTipoStyle(t.tipo_movimiento);
                return (
                  <tr key={t.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-5 py-4 text-sm text-gray-400 whitespace-nowrap">
                      {formatDate(t.fecha)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${tipo.class}`}>
                        {tipo.text}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-sm font-medium text-white whitespace-nowrap">
                      {formatCurrency(t.monto)}
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-gray-500 whitespace-nowrap hidden sm:table-cell">
                      {formatCurrency(t.saldo_anterior)}
                    </td>
                    <td
                      className={`px-5 py-4 text-right text-sm font-semibold whitespace-nowrap ${
                        parseFloat(t.saldo_nuevo) === 0
                          ? 'text-brand-green'
                          : parseFloat(t.saldo_nuevo) > parseFloat(t.saldo_anterior)
                          ? 'text-brand-red'
                          : 'text-brand-green'
                      }`}
                    >
                      {formatCurrency(t.saldo_nuevo)}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 hidden md:table-cell max-w-xs truncate">
                      {t.descripcion || '-'}
                    </td>
                  </tr>
                );
              })}
              {transacciones.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-gray-500 text-sm">
                    No hay movimientos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <a
          href="/"
          className="text-sm text-gray-400 hover:text-white font-medium transition-colors inline-flex items-center gap-1"
        >
          &larr; Volver al Dashboard
        </a>
      </div>
    </div>
  );
}
