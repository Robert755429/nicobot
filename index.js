import P from 'pino';
import * as baileys from '@whiskeysockets/baileys';

const { default: makeWASocket, useMultiFileAuthState } = baileys;

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"]
  });

  if (!sock.authState.creds.registered) {
    const numero = "393387347002"; // <--- CAMBIA QUI COL TUO NUMERO
    setTimeout(async () => {
      let code = await sock.requestPairingCode(numero);
      console.log("=================================");
      console.log("IL TUO CODICE: " + code);
      console.log("=================================");
    }, 3000);
  }

  sock.ev.on('creds.update', saveCreds);
  
  const botCore = await import('./core/bot.js');
  (botCore.default || botCore).init(sock);
}

start();
