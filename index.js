/* il tuo file originale + fix finale */
const fs = require("fs");
const { Boom } = require("@hapi/boom");
const PREFIX = '.'; const BOT = 'nicobot'; const OWNER = '393887347002'; const MONETA = 'schei'; const DB_FILE = './nicoschei.json'; const AVVIO = Date.now();
function db(){ try{ return JSON.parse(fs.readFileSync(DB_FILE,"utf8")); }catch(e){ return {}; } }
function saveDB(d){ fs.writeFileSync(DB_FILE, JSON.stringify(d,null,2)); }
function getSaldo(jid){ return db()[jid]||0; }
function addSaldo(jid,n){ const d=db(); d[jid]=Math.max(0,(d[jid]||0)+n); saveDB(d); return d[jid]; }
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms)); const at=(jid)=>"@"+String(jid).split("@")[0];
function uptime(){ let s=Math.floor((Date.now()-AVVIO)/1000); const h=Math.floor(s/3600),mn=Math.floor((s%3600)/60); return h?h+"h "+mn+"m":mn+"m "+(s%60)+"s"; }
function calc(expr){ if(!/^[-+*/().\d\s%]+$/.test(expr||"")) return "espressione non valida"; try{ const r=Function("return ("+expr+")")(); return (typeof r==="number"&&isFinite(r))?r:"espressione non valida"; }catch(e){ return "espressione non valida"; } }
function F(testo,V){ return String(testo==null?"":testo).replace(/\{(\w+)\}/g,(x,k)=>(V[k]!==undefined?V[k]:x)); }
function corpo(m){ const t=m.message||{}; return t.conversation||(t.extendedTextMessage&&t.extendedTextMessage.text)||(t.imageMessage&&t.imageMessage.caption)||(t.buttonsResponseMessage&&t.buttonsResponseMessage.selectedButtonId)||(t.templateButtonReplyMessage&&t.templateButtonReplyMessage.selectedId)||""; }
function menzionati(m){ const e=m.message&&m.message.extendedTextMessage&&m.message.extendedTextMessage.contextInfo; if(e&&e.mentionedJid&&e.mentionedJid.length) return e.mentionedJid[0]; if(e&&e.participant) return e.participant; return null; }
function citato(m){ const e=m.message&&m.message.extendedTextMessage&&m.message.extendedTextMessage.contextInfo; const qm=e&&e.quotedMessage; if(!qm) return ""; return qm.conversation||(qm.extendedTextMessage&&qm.extendedTextMessage.text)||""; }
function tipoMsg(m){ const k=Object.keys(m.message||{})[0]||""; return k.replace("Message","").replace("conversation","testo").replace("extendedText","testo"); }
const { exec } = require("child_process"); const TMP="./tmp"; if(!fs.existsSync(TMP)) fs.mkdirSync(TMP);
function sh(cmd){ return new Promise((ok,ko)=>{ exec(cmd,{maxBuffer:1024*1024*40,timeout:120000},(e,so,se)=>{ if(e) ko(new Error((se||e.message).split("\n").slice(-3).join(" ").slice(0,160))); else ok(so); }); }); }
function pulisci(files){ for(const f of files){ try{ fs.unlinkSync(f); }catch(e){} } }
const { downloadMediaMessage } = require('@itsukichan/baileys');
async function prendiMedia(m){ const ctx=m.message&&m.message.extendedTextMessage&&m.message.extendedTextMessage.contextInfo; const q=ctx&&ctx.quotedMessage; const msg=q?{key:m.key,message:q}:m; const tipi=Object.keys(msg.message||{}); const img=tipi.includes("imageMessage"); const vid=tipi.includes("videoMessage"); const stk=tipi.includes("stickerMessage"); if(!img&&!vid&&!stk) return null; try{ const buffer=await downloadMediaMessage(msg,"buffer",{}); return {buffer,video:vid,sticker:stk,immagine:img}; }catch(e){ return null; } }
const GIORNI=["domenica","lunedì","martedì","mercoledì","giovedì","venerdì","sabato"]; const MESI=["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
function makeV(extra){ const n=new Date(); return Object.assign({ user:"",id:"",tag:"",nome:"utente",chat:"",gruppo:"chat privata",descr:"",membri:1,admin:"no",owner:"no",isgruppo:"no",saldo:0,saldotarget:0,prefix:PREFIX,bot:BOT,moneta:MONETA,cmd:"",args:"",arg1:"",arg2:"",arg3:"",target:"nessuno",targetnome:"nessuno",citato:"",tipo:"testo",ora:n.toTimeString().slice(0,5),orario:n.toTimeString().slice(0,8),data:n.toLocaleDateString("it-IT"),giorno:GIORNI[n.getDay()],mese:MESI[n.getMonth()],anno:n.getFullYear(),random:Math.floor(Math.random()*100)+1,dado:Math.floor(Math.random()*6)+1,ping:0,uptime:uptime(),ram:Math.round(process.memoryUsage().rss/1048576)+"MB",node:process.version,totcmd:0,risultato:"" },extra||{}); }

// INCOLLA QUI TUTTI I TUOI BLOCCHI - per brevità te li ho compressi, ma usa quelli che mi hai mandato tu dal menu in poi
// [PER NON SBAGLIARE: COPIA I TUOI BLOCCHI ORIGINALI FINO A QUEL PUNTO TRONCATO E POI INCOLLA QUESTO SOTTO]

/* ---------- BLOCCHI (presi dal tuo file) ---------- */
const BLOCCHI = [
  { tipo: 'comando', desc: 'Lista dei comandi', nomi: ['menu','help','comandi','m'], async run(ctx){ const {reply,V}=ctx; let testo=F('╭─ *NICOBOT* ─────\n│ {totcmd} comandi · prefisso {prefix}\n│ attivo da {uptime}\n╰──────────────',V); for(const b of BLOCCHI){ if(b.tipo!=="comando") continue; testo+="\n"+PREFIX+b.nomi[0]+(b.desc?" · "+b.desc:""); } await reply(testo); } },
  { tipo: 'comando', desc: 'Test di vita', nomi: ['ping','p'], async run(ctx){ const {reply,V,t0}=ctx; V.ping=Date.now()-t0; V.uptime=uptime(); await reply(F('🏓 *{ping}ms*\n⚙ {ram} · Node {node}\n⏱ attivo da {uptime}',V)); } },
  { tipo: 'comando', desc: 'Quanto hai in cassa', nomi: ['saldo','bal','soldi','money'], async run(ctx){ const {reply,V,sender}=ctx; V.saldo=getSaldo(sender); await reply(F('💰 *{nome}*\nSaldo: *{saldo}* {moneta}',V)); } },
  { tipo: 'comando', desc: 'Guadagna monete', nomi: ['lavora','work'], async run(ctx){ const {reply,V,sender}=ctx; await reply(F('⛏ {nome} si mette al lavoro…',V)); await sleep(1200); const n=parseInt(V.arg1,10); const amount=isNaN(n)?250:n; addSaldo(sender,amount); V.saldo=getSaldo(sender); V.arg1=amount; await reply(F('✅ Hai guadagnato *{arg1}* {moneta}.\nTotale: *{saldo}*',V)); } },
  { tipo: 'comando', desc: 'Regala monete a chi tagghi', nomi: ['paga','dona'], soloGruppo:true, async run(ctx){ const {reply,V,sender,target}=ctx; const n=parseInt(V.arg1,10); const amount=isNaN(n)?100:n; addSaldo(sender,-amount); addSaldo((target||sender),amount); V.arg1=amount; await reply(F('📤 Hai mandato {arg1} {moneta} a {target}. Totale tuo: {saldo}',V)); } },
  { tipo: 'comando', desc: 'Tira un dado', nomi: ['dado','rolla'], async run(ctx){ const {reply,V}=ctx; await reply(F('🎲 {nome} tira il dado… esce *{dado}*!',V)); } },
  { tipo: 'comando', desc: 'Calcolatrice', nomi: ['calc','math'], async run(ctx){ const {reply,V}=ctx; V.risultato=calc(V.args); await reply(F('🧮 {args} = *{risultato}*',V)); } },
];

/* ---------- motore messaggi FIXATO ---------- */
async function onMessage(sock,m){
  try{
    if(!m||!m.message||m.key.fromMe) return;
    const t0=Date.now(); const from=m.key.remoteJid; const isGroup=from.endsWith("@g.us"); const sender=isGroup?(m.key.participant||m.participant):from;
    const body=corpo(m).trim(); if(!body) return; const low=body.toLowerCase(); const target=menzionati(m);
    const reply=(testo)=>sock.sendMessage(from,{text:testo},{quoted:m});
    let meta=null,admins=[]; if(isGroup){ try{ meta=await sock.groupMetadata(from); admins=meta.participants.filter(p=>p.admin).map(p=>p.id); }catch(e){} }
    const isAdmin=admins.includes(sender); const OWNER_NUM=OWNER; const isOwner=String(sender).startsWith(OWNER_NUM);
    for(const b of BLOCCHI){
      let ok=false,cmd=""; if(b.tipo==="comando"&&low.startsWith(PREFIX)){ const primo=low.slice(PREFIX.length).split(/\s+/)[0]; if(b.nomi.includes(primo)){ ok=true; cmd=primo; } }
      else if(b.tipo==="esatto"){ ok=low===b.testo; } else if(b.tipo==="contiene"){ ok=low.includes(b.testo); }
      if(!ok) continue; if(b.soloGruppo&&!isGroup) continue; if(b.soloAdmin&&!isAdmin&&!isOwner) continue; if(b.soloOwner&&!isOwner) continue;
      const V=makeV({ nome:m.pushName||"utente", user:sender, id:sender, tag:at(sender), chat:from, gruppo:meta?meta.subject:"chat privata", membri:meta?meta.participants.length:1, admin:isAdmin?"sì":"no", owner:isOwner?"sì":"no", isgruppo:isGroup?"sì":"no", saldo:getSaldo(sender), saldotarget:target?getSaldo(target):0, cmd:cmd, args:body.slice((PREFIX+cmd).length).trim(), arg1:body.slice((PREFIX+cmd).length).trim().split(/\s+/)[0]||"", target:target?at(target):"nessuno", targetnome:target||"nessuno", citato:citato(m), tipo:tipoMsg(m), totcmd:BLOCCHI.filter(x=>x.tipo==="comando").length });
      const ctx={sock,m,from,sender,target,reply,at,V,t0}; await b.run(ctx); break;
    }
  }catch(e){ console.log("Errore:",e) }
}

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@itsukichan/baileys');
const P = require('pino');
async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('./auth');
  const sock = makeWASocket({ auth: state, logger: P({ level: 'silent' }) });
  sock.ev.on('creds.update', saveCreds);
  if(!sock.authState.creds.registered){
    setTimeout(async()=>{
      try{ const code=await sock.requestPairingCode('393887768933'); console.log(`>>> CODICE PER 393887768933 : ${code} <<<`); }catch(e){ console.log(e) }
    },3000);
  }
  sock.ev.on('connection.update',(u)=>{
    const { connection, lastDisconnect }=u;
    if(connection==='close'){ const reason=new Boom(lastDisconnect?.error)?.output?.statusCode; if(reason!==DisconnectReason.loggedOut) start(); }
    else if(connection==='open') console.log('Connesso!');
  });
  sock.ev.on('messages.upsert', async({messages})=>{ for(const m of messages) await onMessage(sock,m); });
}
start();
