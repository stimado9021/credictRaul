'use client';

import { useState, useEffect, useCallback } from 'react';

export default function WhatsAppStatus() {
  const [status, setStatus] = useState('cargando');
  const [qr, setQr] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [cerrando, setCerrando] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();

      if (data.error) {
        setStatus('error');
        setErrorMsg(data.error);
        setQr(null);
      } else if (data.ready) {
        setStatus('conectado');
        setQr(null);
        setErrorMsg(null);
      } else if (data.qr) {
        setStatus('qr');
        setQr(data.qr);
        setErrorMsg(null);
      } else {
        setStatus('inicializando');
        setErrorMsg(null);
      }
    } catch {
      setStatus('error');
      setErrorMsg('Error de conexion con el servidor');
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(checkStatus, 3000);
    checkStatus();
    return () => clearInterval(interval);
  }, [checkStatus]);

  const cerrarSesion = async () => {
    setCerrando(true);
    try {
      await fetch('/api/whatsapp/logout', { method: 'POST' });
      setStatus('inicializando');
      setQr(null);
    } catch {
      setErrorMsg('Error al cerrar sesion');
    } finally {
      setCerrando(false);
    }
  };

  if (status === 'conectado') {
    return (
      <div className="group relative">
        <div className="flex items-center gap-2 text-xs text-green-400 cursor-default">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>WhatsApp conectado</span>
        </div>
        <div className="absolute top-full right-0 mt-2 hidden group-hover:block z-50">
          <button
            onClick={cerrarSesion}
            disabled={cerrando}
            className="text-[11px] text-red-400 hover:text-red-300 bg-surface-card border border-surface-border px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors disabled:opacity-50"
          >
            {cerrando ? 'Cerrando...' : 'Cambiar numero'}
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="group relative">
        <div className="flex items-center gap-2 text-xs text-red-400 cursor-pointer">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          WhatsApp error
        </div>
        <div className="absolute top-full right-0 mt-2 bg-red-900/90 text-red-200 text-[11px] px-3 py-2 rounded-lg border border-red-800 max-w-[90vw] overflow-hidden text-ellipsis whitespace-nowrap hidden group-hover:block z-50">
          {errorMsg || 'Error desconocido'}
        </div>
      </div>
    );
  }

  if (status === 'qr' && qr) {
    return (
      <div className="fixed bottom-0 right-0 left-0 sm:bottom-4 sm:right-4 sm:left-auto z-50 bg-surface-card border border-surface-border rounded-t-2xl sm:rounded-xl p-4 sm:p-4 shadow-2xl shadow-black/50 sm:w-72">
        <p className="text-xs text-gray-400 font-medium mb-2">
          Escanea el QR con WhatsApp para conectar
        </p>
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qr)}`}
          alt="WhatsApp QR"
          className="w-full rounded-lg"
        />
        <p className="text-[10px] text-gray-500 mt-2 text-center">
          Abre WhatsApp {'>'} 3 puntos {'>'} Dispositivos vinculados {'>'} Vincular
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-yellow-400">
      <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
      Iniciando WhatsApp...
    </div>
  );
}
