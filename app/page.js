'use client';
import { useState, useEffect, useCallback } from 'react';
import ModalTransaccion from './components/ModalTransaccion';
import WhatsAppStatus from './components/WhatsAppStatus';
import LoadingSpinner from './components/LoadingSpinner';

export default function Dashboard() {
  const [clientes, setClientes] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [modalPreselect, setModalPreselect] = useState(null);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newTelefono, setNewTelefono] = useState('');
  const [submittingCliente, setSubmittingCliente] = useState(false);

  const fetchData = useCallback(async (query = '') => {
    setError('');
    setDataLoading(true);
    try {
      const [cliRes, sumRes] = await Promise.all([
        fetch(query.trim() ? `/api/clientes?search=${encodeURIComponent(query.trim())}` : '/api/clientes'),
        fetch('/api/resumen'),
      ]);
      const cliData = await cliRes.json();
      const sumData = await sumRes.json();
      if (cliData.success) setClientes(cliData.data);
      else setError(cliData.error);
      if (sumData.success) setResumen(sumData.data);
    } catch {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
      setDataLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(search), 300);
    return () => clearTimeout(timer);
  }, [search, fetchData]);

  const handleCreateCliente = async (e) => {
    e.preventDefault();
    setError('');
    setSubmittingCliente(true);
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newNombre, telefono: newTelefono }),
      });
      const data = await res.json();
      if (data.success) {
        setShowClienteModal(false);
        setNewNombre('');
        setNewTelefono('');
        fetchData(search);
      } else setError(data.error);
    } catch {
      setError('Error al crear cliente');
    } finally {
      setSubmittingCliente(false);
    }
  };

  const openTransaccion = (tipo, cliente = null) => {
    setModalPreselect(cliente);
    setActiveModal(tipo);
  };

  const closeTransaccion = () => {
    setActiveModal(null);
    setModalPreselect(null);
    fetchData(search);
  };

  const formatCurrency = (amount) => `$${parseFloat(amount).toFixed(2)}`;

  const cards = [
    {
      label: 'Ventas del dia',
      value: resumen ? formatCurrency(resumen.ventas_hoy) : '$0.00',
      icon: 'dinero',
    },
    {
      label: 'Cuentas pendientes',
      value: resumen ? formatCurrency(resumen.cuentas_pendientes) : '$0.00',
      icon: 'graficos',
    },
    {
      label: 'Abonos del dia',
      value: resumen ? formatCurrency(resumen.abonos_hoy) : '$0.00',
      icon: 'cash',
    },
    {
      label: 'Ganancias totales',
      value: resumen ? formatCurrency(resumen.ganancias_totales) : '$0.00',
      icon: 'balanza',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <WhatsAppStatus />
        </div>
        <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
          <button
            onClick={() => setShowClienteModal(true)}
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium border border-surface-border text-gray-300 hover:text-white hover:bg-surface-hover transition-colors whitespace-nowrap"
          >
            + Nuevo
          </button>
          <button
            onClick={() => openTransaccion('FIADO')}
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-bold text-white bg-brand-red hover:brightness-110 transition-all whitespace-nowrap"
          >
            + Fiado
          </button>
          <button
            onClick={() => openTransaccion('ABONO')}
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-bold text-white bg-brand-green hover:brightness-110 transition-all whitespace-nowrap"
          >
            + Abono
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-900/50 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card, i) => {
          const iconColor = i < 2 ? 'text-teal-400' : 'text-purple-400';
          return (
            <div
              key={i}
              className="rounded-xl border border-surface-border p-4 sm:p-5 bg-gradient-to-br from-[#0A2E28] via-surface-card to-[#3C0A5C] shadow-lg shadow-purple-900/10 hover:border-purple-600/50 transition-all duration-300"
            >
              <div className="flex items-start gap-3">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor} bg-black/20`}>
                  {card.icon === 'dinero' && (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 10h3a1.5 1.5 0 010 3H9m0 0h3a1.5 1.5 0 010 3H9" />
                    </svg>
                  )}
                  {card.icon === 'graficos' && (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  )}
                  {card.icon === 'cash' && (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125V9M5.25 12h.75a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-.75m10.5-6h.75a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-.75" />
                    </svg>
                  )}
                  {card.icon === 'balanza' && (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v18m0 0l-4-4m4 4l4-4M3 12l4-4m-4 4l4 4m14-4l-4-4m4 4l-4 4" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">
                    {card.label}
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-white truncate">
                    {card.value}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <input
          type="text"
          placeholder="Buscar por nombre o telefono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 bg-surface-input border border-surface-border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red/50 transition-all"
        />
      </div>

      <div className="rounded-xl border border-surface-border overflow-hidden relative">
        {/* Overlay de carga */}
        {dataLoading && (
          <div className="absolute inset-0 bg-surface/70 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl">
            <LoadingSpinner size="lg" className="text-brand-red" />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[550px]">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="px-4 sm:px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 sm:px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                  Telefono
                </th>
                <th className="px-4 sm:px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Saldo
                </th>
                <th className="px-4 sm:px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-4 sm:px-5 py-3.5 sm:py-4">
                    <div className="font-medium text-white text-sm sm:text-base leading-tight">{cliente.nombre}</div>
                    {/* Telefono visible solo en mobile dentro del nombre */}
                    <div className="text-[11px] text-gray-500 mt-0.5 sm:hidden">{cliente.telefono}</div>
                  </td>
                  <td className="px-4 sm:px-5 py-3.5 sm:py-4 text-gray-400 text-sm hidden sm:table-cell">{cliente.telefono}</td>
                  <td className="px-4 sm:px-5 py-3.5 sm:py-4 text-right whitespace-nowrap">
                    <span
                      className={`font-semibold text-sm sm:text-base ${
                        parseFloat(cliente.saldo_actual) > 0 ? 'text-brand-red' : 'text-brand-green'
                      }`}
                    >
                      {formatCurrency(cliente.saldo_actual)}
                    </span>
                    {parseFloat(cliente.saldo_actual) === 0 && (
                      <span className="ml-1.5 bg-brand-green/15 text-brand-green text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-semibold tracking-wide whitespace-nowrap">
                        SALVO Y PAZ
                      </span>
                    )}
                  </td>
                  <td className="px-4 sm:px-5 py-3.5 sm:py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openTransaccion('FIADO', cliente)}
                        className="text-[11px] sm:text-xs font-medium px-2 sm:px-2.5 py-1 rounded-md bg-brand-red/15 text-brand-red hover:bg-brand-red/25 transition-colors active:scale-95"
                      >
                        Fiado
                      </button>
                      <button
                        onClick={() => openTransaccion('ABONO', cliente)}
                        className="text-[11px] sm:text-xs font-medium px-2 sm:px-2.5 py-1 rounded-md bg-brand-green/15 text-brand-green hover:bg-brand-green/25 transition-colors active:scale-95"
                      >
                        Abono
                      </button>
                      <a
                        href={`/historial/${cliente.id}`}
                        className="text-[11px] sm:text-xs font-medium px-2 sm:px-2.5 py-1 rounded-md bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors active:scale-95"
                      >
                        Historial
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                    No se encontraron clientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ModalTransaccion
        tipo={activeModal}
        isOpen={activeModal !== null}
        onClose={closeTransaccion}
        preselectedCliente={modalPreselect}
      />

      {showClienteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50">
          <div className="bg-surface-card rounded-t-2xl sm:rounded-xl border border-surface-border p-5 sm:p-6 w-full sm:max-w-md sm:mx-4 shadow-2xl sm:max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">Nuevo Cliente</h2>
            <form onSubmit={handleCreateCliente}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-input border border-surface-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red/50"
                  required
                  autoFocus
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Telefono <span className="text-gray-600 font-normal">(con codigo de pais)</span>
                </label>
                <input
                  type="text"
                  value={newTelefono}
                  onChange={(e) => setNewTelefono(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-input border border-surface-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red/50"
                  placeholder="+521234567890"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowClienteModal(false)}
                  className="px-4 py-2 text-sm text-gray-400 border border-surface-border rounded-lg hover:text-white hover:bg-surface-hover transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingCliente}
                  className="px-4 py-2 text-sm font-bold text-white bg-brand-red rounded-lg hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submittingCliente && <LoadingSpinner size="sm" />}
                  {submittingCliente ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
