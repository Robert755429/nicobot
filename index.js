const { default: makeWASocket, useMultiFileAuthState, delay } = require('@itsukichan/baileys');
const P = require('pino');
const OWNER = '393887347002';

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const sock = makeWASocket({ auth: state, logger: P({ level: 'silent' }), browser: ['Ubuntu','Chrome','120'] });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (u) => {
    const { connection } = u;
    if (connection === 'open') {
      console.log('CONNESSO ✅');
      require('./core/bot.js').init(sock);
    }
    if (connection === 'close') { await delay(3000); start(); }
  });
  if (!state.creds.registered) {
    await delay(4000);
    const code = await sock.requestPairingCode(OWNER);
    console.log(`CODICE: ${code}`);
  }
}
start();
