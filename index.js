import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import pino from 'pino'
import { onMessage, handleWelcome } from './bot.js'

const PAIRING_NUMBER = '393887347002'

async function start(){
 const { state, saveCreds } = await useMultiFileAuthState('./auth')
 const sock = makeWASocket({ auth: state, logger: pino({level:'silent'}), printQRInTerminal:false, browser:['NicoBot','Chrome','1.0'] })
 if(!sock.authState.creds.registered){
   setTimeout(async()=>{
     try{ const code=await sock.requestPairingCode(PAIRING_NUMBER); console.log('CODICE PAIRING:',code) }catch(e){console.log('Err pairing:',e.message)}
   },3000)
 }
 sock.ev.on('creds.update', saveCreds)
 sock.ev.on('connection.update', u=>{
   if(u.connection==='close'){ const r=u.lastDisconnect?.error?.output?.statusCode; if(r!==DisconnectReason.loggedOut) start() }
   if(u.connection==='open') console.log('✅ NicoBot V3 connesso')
 })
 sock.ev.on('group-participants.update', a=>handleWelcome(sock,a))
 sock.ev.on('messages.upsert', async ({messages})=>{ for(const m of messages) await onMessage(sock,m) })
}
start()
