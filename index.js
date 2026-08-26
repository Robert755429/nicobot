import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys'

const PAIRING_NUMBER = '393887347002' // es. 393331234567

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: { level: 'silent' },
    browser: ['NicoBot','Chrome','1.0']
  })
  if(!sock.authState.creds.registered){
    setTimeout(async () => {
      let code = await sock.requestPairingCode(PAIRING_NUMBER)
      console.log('Pairing code:', code)
    }, 3000)
  }
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', ({connection}) => {
    if(connection === 'open') console.log('✅ Connesso!')
  })
}
start()
