const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        printQRInTerminal: true
    });

    const botCore = require('./core/bot.js');
    botCore.init(sock);

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (u) => {
        const { connection, lastDisconnect } = u;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) start();
        }
    });
}

start();
