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

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  },
});

client.on('qr', (qr) => {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
  console.log('\n============================================');
  console.log(' ESCANEA ESTE QR EN TU CELULAR');
  console.log('============================================');
  console.log('Abre esta URL en tu navegador:');
  console.log(url);
  console.log('\nO abrela desde:');
  console.log('WhatsApp > 3 puntos > Dispositivos vinculados');
  console.log('============================================\n');
});

client.on('ready', () => {
  console.log(' WhatsApp conectado');
  pollQueue();
});

client.on('disconnected', () => {
  console.log(' WhatsApp desconectado');
  process.exit(0);
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
        try {
          const chatId = `${row.telefono}@c.us`;
          await client.sendMessage(chatId, row.mensaje);
          await db.query(
            'UPDATE whatsapp_queue SET enviado = TRUE, enviado_en = NOW() WHERE id = ?',
            [row.id]
          );
          console.log(' Enviado a', row.telefono);
        } catch (err) {
          await db.query(
            'UPDATE whatsapp_queue SET error = ? WHERE id = ?',
            [err.message, row.id]
          );
          console.error(' Error al enviar a', row.telefono, ':', err.message);
        }
      }
    } catch (err) {
      console.error(' Error en la cola:', err.message);
    }

    await new Promise((r) => setTimeout(r, 5000));
  }
}
