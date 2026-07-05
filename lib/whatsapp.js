import { Client, LocalAuth } from 'whatsapp-web.js';
import { execSync } from 'child_process';

function getState() {
  if (!global.__waState) {
    global.__waState = {
      client: null,
      qrCode: null,
      isReady: false,
      initializing: false,
      errorMsg: null,
      qrTimeout: null,
    };
  }
  return global.__waState;
}

function killOrphanedChrome() {
  try {
    execSync('taskkill /F /IM chrome.exe 2>nul', { stdio: 'ignore' });
  } catch {}
}

export function getClient() {
  const state = getState();

  if (state.client && state.isReady) {
    return {
      client: state.client,
      getQR: () => state.qrCode,
      isReady: () => state.isReady,
      error: () => state.errorMsg,
    };
  }

  if (state.initializing) {
    return {
      client: null,
      getQR: () => state.qrCode,
      isReady: () => state.isReady,
      error: () => state.errorMsg,
    };
  }

  killOrphanedChrome();

  state.initializing = true;
  state.errorMsg = null;
  state.qrCode = null;
  state.isReady = false;

  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    },
  });

  client.on('qr', (qr) => {
    state.qrCode = qr;
    state.isReady = false;
    state.errorMsg = null;
  });

  client.on('ready', () => {
    state.qrCode = null;
    state.isReady = true;
    state.initializing = false;
    state.errorMsg = null;
    if (state.qrTimeout) clearTimeout(state.qrTimeout);
    console.log(' WhatsApp conectado');
  });

  client.on('auth_failure', (msg) => {
    state.errorMsg = 'Fallo de autenticacion: ' + (msg || 'error desconocido');
    state.qrCode = null;
    state.isReady = false;
    state.initializing = false;
    state.client = null;
    if (state.qrTimeout) clearTimeout(state.qrTimeout);
  });

  client.on('disconnected', (reason) => {
    state.isReady = false;
    state.initializing = false;
    state.errorMsg = 'Desconectado: ' + reason;
    state.qrCode = null;
    state.client = null;
    if (state.qrTimeout) clearTimeout(state.qrTimeout);
  });

  // Si en 45 segundos no hay QR ni conexion, reiniciamos
  state.qrTimeout = setTimeout(() => {
    if (!state.isReady && state.initializing) {
      console.log(' Timeout: reiniciando cliente WhatsApp');
      try { client.destroy(); } catch {}
      state.client = null;
      state.qrCode = null;
      state.isReady = false;
      state.initializing = false;
      state.errorMsg = 'Tiempo de espera agotado. Reinicia el servidor.';
    }
  }, 45000);

  client.initialize().catch((err) => {
    state.errorMsg = 'Error al inicializar: ' + err.message;
    state.qrCode = null;
    state.isReady = false;
    state.initializing = false;
    state.client = null;
    if (state.qrTimeout) clearTimeout(state.qrTimeout);
  });

  state.client = client;

  return {
    client,
    getQR: () => state.qrCode,
    isReady: () => state.isReady,
    error: () => state.errorMsg,
  };
}
