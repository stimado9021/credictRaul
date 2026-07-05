import mysql from 'mysql2/promise';
import pkg from 'whatsapp-web.js';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const { Client, LocalAuth } = pkg;

function loadEnv() {
  try {
    const content = readFileSync('.env.local', 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch {
    console.error('No se pudo leer .env.local');
    process.exit(1);
  }
}

loadEnv();

function killOrphanedChrome() {
  try { execSync('taskkill /F /IM chrome.exe 2>nul', { stdio: 'ignore' }); } catch {}
  try { execSync('taskkill /F /IM chrome-headless-shell.exe 2>nul', { stdio: 'ignore' }); } catch {}
}

killOrphanedChrome();

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'credit_abarrotes',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  connectionLimit: 1,
});

console.log('Iniciando servicio de WhatsApp...');
console.log('Si ves errores de Chrome, cierra Chrome manualmente y vuelve a intentar.\n');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', (qr) => {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
  console.log('\n============================================');
  console.log(' ESCANEA ESTE QR EN TU CELULAR');
  console.log('============================================');
  console.log('Abre esta URL en tu navegador:');
  console.log(url);
  console.log('\nWhatsApp > 3 puntos > Dispositivos vinculados > Vincular');
  console.log('============================================\n');
});

client.on('ready', () => {
  console.log(' WhatsApp conectado');
  console.log(' IMPORTANTE: No cierres la ventana de Chrome que se abrio');
  // Esperar 5 segundos antes de empezar a enviar
  setTimeout(pollQueue, 5000);
});

client.on('disconnected', (reason) => {
  console.log(' WhatsApp desconectado:', reason);
  process.exit(0);
});

client.on('auth_failure', (msg) => {
  console.error(' Error de autenticacion:', msg);
});

client.initialize();

async function pollQueue() {
  console.log(' Esperando mensajes en la cola...');
  while (true) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM whatsapp_queue WHERE enviado = FALSE ORDER BY id ASC LIMIT 5'
      );

      for (const row of rows) {
        await new Promise((r) => setTimeout(r, 3000));
        try {
          const chatId = `${row.telefono}@c.us`;
          await client.sendMessage(chatId, row.mensaje);
          await db.query(
            'UPDATE whatsapp_queue SET enviado = TRUE, enviado_en = NOW() WHERE id = ?',
            [row.id]
          );
          console.log(' Enviado a', row.telefono);
        } catch (err) {
          const msg = err.message || '';
          if (msg.includes('detached Frame')) {
            // La pagina se recargo, reintentar en la siguiente ronda
            console.log(' Reintentando en 10s...');
            await db.query(
              'UPDATE whatsapp_queue SET error = NULL WHERE id = ?',
              [row.id]
            );
            await new Promise((r) => setTimeout(r, 10000));
          } else {
            await db.query(
              'UPDATE whatsapp_queue SET error = ? WHERE id = ?',
              [msg, row.id]
            );
            console.error(' Error al enviar a', row.telefono, ':', msg);
          }
        }
      }
    } catch (err) {
      console.error(' Error en la cola:', err.message);
    }

    await new Promise((r) => setTimeout(r, 5000));
  }
}
