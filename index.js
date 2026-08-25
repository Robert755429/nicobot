const fs = require("fs");
const { Boom } = require("@hapi/boom");
const P = require("pino");
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@itsukichan/baileys');

const PREFIX = '.';
const BOT = 'nicobot';
const OWNER = '393887347002';
const MONETA = 'schei';
const DB_FILE = './nicoschei.json';
const AVVIO = Date.now();
const MIO_NUMERO = '393887347002'; // <--- TUO NUMERO GIUSTO

function db(){ try{ return JSON.parse(fs.readFileSync(DB_FILE,"utf8")); }catch(e){ return {}; } }
function saveDB(d){ fs.writeFileSync(DB_FILE, JSON.stringify(d,null,2)); }
function getSaldo(jid){ return db()[jid]||0; }
function addSaldo(jid,n){ const d=db(); d[jid]=Math.max(0,(d[jid]||0)+n); saveDB(d); return d[jid]; }
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const at=(jid)=>"@"+String(jid).split("@")[0];
function uptime(){ let s=Math.floor((Date.now()-AVVIO)/1000); const h=Math.floor(s/3600),mn=Math.floor((s%3600)/60); return h?h+"h "+mn+"m":mn+"m "+(s%60)+"s"; }
function corpo(m){ const t=m.message||{}; return t.conversation||(t.extendedTextMessage&&t.extendedTextMessage.text)||(t.imageMessage&&t.imageMessage.caption)||""; }
function menzionati(m){ const e=m.message&&m.message.extendedTextMessage&&m.message.extendedTextMessage.contextInfo; if(e&&e.mentionedJid&&e.mentionedJid.length) return e.mentionedJid[0]; return null; }
function citato(m){ const e=m.message&&m.message.extendedTextMessage&&m.message.extendedTextMessage.contextInfo; const qm=e&&e.quotedMessage; if(!qm) return ""; return qm.conversation||(qm.extendedTextMessage&&qm.extendedTextMessage.text)||""; }

const BLOCCHI = [
  { tipo: 'comando', desc: 'Lista dei comandi', nomi: ['menu','help','comandi','m'], async run(ctx){ const {reply,V}=ctx; let testo=`╭─ *NICOBOT* ─────\n│ ${BLOCCHI.length} comandi · prefisso ${PREFIX}\n╰──────────────`; for(const b of BLOCCHI){ if(b.tipo!=="comando") continue; testo+="\n"+PREFIX+b.nomi[0]+(b.desc?" · "+b.desc:""); } await reply(testo); } },
  { tipo: 'comando', desc: 'Test di vita', nomi: ['ping','p'], async run(ctx){ const {reply,V,t0}=ctx; V.ping=Date.now()-t0; await reply(`🏓 *${V.ping}ms*\n⏱ attivo da ${uptime()}`); } },
  { tipo: 'comando', desc: 'Quanto hai in cassa', nomi: ['saldo','bal','soldi','money'], async run(ctx){ const {reply,V,sender}=ctx; V.saldo=getSaldo(sender); await reply(`💰 *${V.nome}*\nSaldo: *${V.saldo}* ${MONETA}`); } },
  { tipo: 'comando', desc: 'Guadagna monete', nomi: ['lavora','work'], async run(ctx){ const {reply,V,sender}=ctx; await reply(`⛏ ${V.nome} si mette al lavoro…`); await sleep(1200); const n=parseInt(V.arg1,10); const amount=isNaN(n)?250:n; addSaldo(sender,amount); V.saldo=getSaldo(sender); await reply(`✅ Hai guadagnato *${amount}* ${MONETA}.\nTotale: *${V.saldo}*`); } },
  { tipo: 'comando', desc: 'Regala monete', nomi: ['paga','dona'], async run(ctx){ const {reply,V,sender,target}=ctx; const n=parseInt(V.arg1,10); const amount=isNaN(n)?100:n; const dest=target||sender; addSaldo(sender,-amount); addSaldo(dest,amount); V.saldo=getSaldo(sender); await reply(`📤 Hai mandato ${amount} ${MONETA} a ${V.target}. Totale tuo: ${V.saldo}`); } },
];

async function onMessage(sock,m){
  try{
    if(!m||!m.message||m.key.fromMe) return;
    const from=m.key.remoteJid; const isGroup=from.endsWith("@g.us"); const sender=isGroup?(m.key.participant||m.participant):from;
    const body=corpo(m).trim(); if(!body) return; const low=body.toLowerCase(); const target=menzionati(m);
    const reply=(testo)=>sock.sendMessage(from,{text:testo},{quoted:m});
    let meta=null,admins=[]; if(isGroup){ try{ meta=await sock.groupMetadata(from); admins=meta.participants.filter(p=>p.admin).map(p=>p.id); }catch(e){} }
    const isAdmin=admins.includes(sender); const isOwner=String(sender).startsWith(OWNER);
    for(const b of BLOCCHI){
      let ok=false,cmd=""; if(b.tipo==="comando"&&low.startsWith(PREFIX)){ const primo=low.slice(PREFIX.length).split(/\s+/)[0]; if(b.nomi.includes(primo)){ ok=true; cmd=primo; } }
      if(!ok) continue;
      const V={ nome:m.pushName||"utente", saldo:getSaldo(sender), args:body.slice((PREFIX+cmd).length).trim(), arg1:body.slice((PREFIX+cmd).length).trim().split(/\s+/)[0]||"", target:target?at(target):"nessuno", totcmd:BLOCCHI.length };
      const ctx={sock,m,from,sender,target,reply,at,V,t0:Date.now()}; await b.run(ctx); break;
    }
  }catch(e){ console.log("Errore:",e) }
}

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const sock = makeWASocket({ auth: state, logger: P({ level: 'silent' }) });
  sock.ev.on('creds.update', saveCreds);
  if(!sock.authState.creds.registered){
    setTimeout(async()=>{
      try{
        const code=await sock.requestPairingCode(MIO_NUMERO);
        console.log(`>>> CODICE PER ${MIO_NUMERO} : ${code} <<<`);
      }catch(e){ console.log(e) }
    },3000);
  }
  sock.ev.on('connection.update',(u)=>{
    const { connection, lastDisconnect }=u;
    if(connection==='close'){ const reason=new Boom(lastDisconnect?.error)?.output?.statusCode; if(reason!==DisconnectReason.loggedOut) start(); }
    else if(connection==='open') console.log('Connesso! Bot attivo');
  });
  sock.ev.on('messages.upsert', async({messages})=>{ for(const m of messages) await onMessage(sock,m); });
}
start();
