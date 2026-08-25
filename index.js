import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import P from 'pino';
import * as baileys from '@whiskeysockets/baileys';

const { default: makeWASocket, useMultiFileAuthState } = baileys;

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"]
  });
  sock.ev.on('creds.update', saveCreds);

  try {
    const core = require('./core/bot.js');
    (core.default || core)(sock);
  } catch(e) {
    console.log("core/bot non caricato:", e.message);
  }

  if (!state.creds.registered) {
    const numero = "393887347002"; // <--- METTI IL TUO NUMERO QUI
    await new Promise(r => setTimeout(r, 3000));
    const code = await sock.requestPairingCode(numero);
    console.log("\n=================================");
    console.log("CODICE PER " + numero + ": " + code);
    console.log("=================================\n");
  }
}
start();
