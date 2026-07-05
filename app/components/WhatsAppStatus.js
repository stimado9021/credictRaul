'use client';

import { useState, useEffect, useCallback } from 'react';

export default function WhatsAppStatus() {
  const [conectado, setConectado] = useState(false);
  const [pendientes, setPendientes] = useState(0);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();
      setConectado(data.ready || false);
      setPendientes(data.pendientes || 0);
    } catch {}
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={`w-2 h-2 rounded-full ${
          conectado ? 'bg-green-400 animate-pulse' : 'bg-yellow-500'
        }`}
      />
      <span className={conectado ? 'text-green-400' : 'text-yellow-400'}>
        {conectado ? 'WhatsApp activo' : 'Servicio local desconectado'}
      </span>
      {pendientes > 0 && (
        <span className="text-gray-500">
          ({pendientes} pendiente{pendientes !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  );
}
