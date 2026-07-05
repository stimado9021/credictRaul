'use client';
import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function ModalTransaccion({ tipo, isOpen, onClose, preselectedCliente }) {
  const isFiado = tipo === 'FIADO';
  const [clientes, setClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [enviandoWa, setEnviandoWa] = useState(false);
  const [waEnviado, setWaEnviado] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setResult(null);
      if (preselectedCliente) {
        setSelectedCliente(preselectedCliente);
        setSearchTerm('');
      } else {
        setSelectedCliente(null);
        setSearchTerm('');
      }
      setMonto('');
      setDescripcion('');
      fetch('/api/clientes')
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setClientes(data.data);
        })
        .catch(() => setError('Error al cargar clientes'));
    }
  }, [isOpen, preselectedCliente]);

  const filteredClientes = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.telefono.includes(searchTerm)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/transacciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: selectedCliente.id,
          tipo_movimiento: tipo,
          monto: parseFloat(monto),
          descripcion,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error);
      }
    } catch {
      setError(`Error al registrar ${isFiado ? 'el fiado' : 'el abono'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCliente(null);
    setSearchTerm('');
    setMonto('');
    setDescripcion('');
    setResult(null);
    setWaEnviado(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const enviarWhatsApp = async () => {
    if (!result || enviandoWa || waEnviado) return;
    setEnviandoWa(true);
    try {
      const telefono = result.cliente.telefono.replace(/[^0-9]/g, '');
      const d = result.data;
      const montoStr = `$${parseFloat(d.monto).toFixed(2)}`;
      const anteriorStr = `$${parseFloat(d.saldo_anterior).toFixed(2)}`;
      const nuevoStr = `$${parseFloat(d.saldo_nuevo).toFixed(2)}`;
      const esLiquidacion = d.tipo_movimiento === 'CANCELACION_TOTAL';

      let mensaje;
      if (esLiquidacion) {
        mensaje =
          `Hola ${result.cliente.nombre}, has cancelado tu cuenta en su totalidad.\n\n` +
          `Resumen:\n` +
          (d.descripcion ? `Concepto: ${d.descripcion}\n` : '') +
          `Saldo anterior: ${anteriorStr}\n` +
          `Abono: ${montoStr}\n` +
          `Saldo actual: $0.00\n\n` +
          `Estado: SALVO Y PAZ! Gracias por tu responsabilidad.`;
      } else if (isFiado) {
        mensaje =
          `Hola ${result.cliente.nombre}, se registro un consumo a credito.\n\n` +
          `Detalle:\n` +
          (d.descripcion ? `Productos: ${d.descripcion}\n` : '') +
          `Saldo anterior: ${anteriorStr}\n` +
          `Fiado: ${montoStr}\n` +
          `Nuevo saldo: ${nuevoStr}\n\n` +
          `Gracias!`;
      } else {
        mensaje =
          `Hola ${result.cliente.nombre}, recibimos tu abono.\n\n` +
          `Detalle:\n` +
          (d.descripcion ? `Concepto: ${d.descripcion}\n` : '') +
          `Saldo anterior: ${anteriorStr}\n` +
          `Abono: ${montoStr}\n` +
          `Saldo pendiente: ${nuevoStr}\n\n` +
          `Gracias!`;
      }

      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono, mensaje }),
      });

      const data = await res.json();
      if (data.success) {
        setWaEnviado(true);
      } else {
        alert(data.error || 'Error al enviar WhatsApp');
      }
    } catch {
      alert('Error al enviar el mensaje');
    } finally {
      setEnviandoWa(false);
    }
  };

  if (!isOpen) return null;

  const esLiquidacion = result?.data?.tipo_movimiento === 'CANCELACION_TOTAL';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50">
      <div className="bg-surface-card border border-surface-border rounded-t-2xl sm:rounded-xl w-full sm:max-w-lg sm:mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface-card border-b border-surface-border px-4 sm:px-5 py-3.5 sm:py-4 flex justify-between items-center rounded-t-2xl sm:rounded-t-xl">
          <h2 className="text-lg font-bold text-white">
            {result
              ? 'Comprobante'
              : isFiado
              ? 'Registrar Fiado'
              : 'Registrar Abono'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-white text-2xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {result ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-brand-green/15">
                <svg className="w-7 h-7 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-3">
                {esLiquidacion ? 'Cuenta Liquidada' : isFiado ? 'Fiado Registrado' : 'Abono Registrado'}
              </h2>
              {esLiquidacion && (
                <div className="bg-brand-green/15 text-brand-green font-bold py-1.5 px-5 rounded-full inline-block mb-4 text-sm tracking-wide">
                  SALVO Y PAZ
                </div>
              )}
              <div className="bg-surface border border-surface-border rounded-lg p-4 mb-5 text-left space-y-1.5">
                <p className="text-gray-300 text-sm">
                  <span className="text-gray-500">Cliente:</span> {result.cliente.nombre}
                </p>
                <p className="text-gray-300 text-sm">
                  <span className="text-gray-500">Monto:</span>{' '}
                  <span className="text-white font-semibold">
                    ${parseFloat(result.data.monto).toFixed(2)}
                  </span>
                </p>
                {esLiquidacion ? (
                  <p className="text-brand-green text-sm font-semibold">
                    <span className="text-gray-500">Saldo:</span> $0.00
                  </p>
                ) : (
                  <p className="text-gray-300 text-sm">
                    <span className="text-gray-500">Saldo actual:</span>{' '}
                    <span className="text-brand-red font-semibold">
                      ${parseFloat(result.cliente.saldo_actual).toFixed(2)}
                    </span>
                  </p>
                )}
                {result.data.descripcion && (
                  <p className="text-gray-300 text-sm">
                    <span className="text-gray-500">Descripcion:</span> {result.data.descripcion}
                  </p>
                )}
              </div>
              <button
                onClick={enviarWhatsApp}
                disabled={enviandoWa || waEnviado}
                className={`block w-full py-2.5 rounded-lg font-bold text-sm text-center transition-all mb-2.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                  waEnviado
                    ? 'bg-brand-green/20 text-brand-green border border-brand-green/30'
                    : 'bg-brand-green text-white hover:brightness-110'
                }`}
              >
                {enviandoWa
                  ? 'Enviando...'
                  : waEnviado
                  ? 'Comprobante Enviado'
                  : 'Enviar Comprobante por WhatsApp'}
              </button>
              <div className="flex gap-2.5">
                <button
                  onClick={resetForm}
                  className="flex-1 text-sm text-gray-400 border border-surface-border py-2 rounded-lg hover:text-white hover:bg-surface-hover transition-colors"
                >
                  Registrar {isFiado ? 'otro fiado' : 'otro abono'}
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 text-sm font-bold text-white bg-brand-red py-2 rounded-lg hover:brightness-110 transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-900/30 border border-red-900/50 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              {!selectedCliente ? (
                <div>
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Buscar cliente por nombre o telefono..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface-input border border-surface-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red/50"
                      autoFocus
                    />
                  </div>
                  <div className="divide-y divide-surface-border max-h-60 overflow-y-auto border border-surface-border rounded-lg">
                    {filteredClientes.map((cliente) => (
                      <button
                        key={cliente.id}
                        onClick={() => setSelectedCliente(cliente)}
                        className="w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors"
                      >
                        <div className="font-medium text-white text-sm">{cliente.nombre}</div>
                        <div className="text-xs text-gray-400">
                          {cliente.telefono}
                          <span
                            className={`ml-2 font-semibold ${
                              parseFloat(cliente.saldo_actual) > 0 ? 'text-brand-red' : 'text-brand-green'
                            }`}
                          >
                            ${parseFloat(cliente.saldo_actual).toFixed(2)}
                          </span>
                        </div>
                      </button>
                    ))}
                    {filteredClientes.length === 0 && (
                      <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        No se encontraron clientes
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="bg-surface border border-surface-border rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-white">{selectedCliente.nombre}</p>
                        <p className="text-xs text-gray-400">{selectedCliente.telefono}</p>
                        <p
                          className={`text-xs font-semibold mt-1 ${
                            parseFloat(selectedCliente.saldo_actual) > 0 ? 'text-brand-red' : 'text-brand-green'
                          }`}
                        >
                          Saldo actual: ${parseFloat(selectedCliente.saldo_actual).toFixed(2)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCliente(null)}
                        className="text-xs text-gray-500 hover:text-white font-medium transition-colors"
                      >
                        Cambiar
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Monto ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface-input border border-surface-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red/50"
                      placeholder="0.00"
                      required
                      autoFocus
                    />
                  </div>

                  {!isFiado && selectedCliente && parseFloat(monto || 0) >= parseFloat(selectedCliente.saldo_actual || 0) && parseFloat(monto) > 0 && (
                    <div className="bg-brand-green/10 border border-brand-green/20 text-brand-green px-4 py-2.5 rounded-lg mb-4 font-semibold text-sm">
                      Con este abono se liquidara la cuenta por completo. Estado: SALVO Y PAZ
                    </div>
                  )}

                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Descripcion <span className="text-gray-600 font-normal">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface-input border border-surface-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red/50"
                      placeholder={isFiado ? 'Ej: Bolsa de viveres...' : 'Ej: Pago en efectivo...'}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full text-white py-2.5 rounded-lg font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      isFiado
                        ? 'bg-brand-red hover:brightness-110'
                        : 'bg-brand-green hover:brightness-110'
                    }`}
                  >
                    {submitting && <LoadingSpinner size="sm" />}
                    {submitting ? 'Registrando...' : isFiado ? 'Registrar Fiado' : 'Registrar Abono'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
