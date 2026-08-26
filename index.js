import * as baileys from '@whiskeysockets/baileys';
const { default: makeWASocket, useMultiFileAuthState } = baileys;

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"]
  });
  sock.ev.on('creds.update', saveCreds);
  
  if (!state.creds.registered) {
    const numero = "393887347002";
    await new Promise(r => setTimeout(r, 3000));
    const code = await sock.requestPairingCode(numero);
    console.log("CODICE PAIRING: " + code);
  }
}
start();
