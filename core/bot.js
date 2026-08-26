const fs = require("fs");
const PREFIX = '.';
const BOT = 'nicobot';
const OWNER = '393887347002';
const MONETA = 'schei';
const DB_FILE = './nicoschei.json';
const AVVIO = Date.now();

function db() { try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); } catch(e){ return {}; } }
function saveDB(d){ fs.writeFileSync(DB_FILE, JSON.stringify(d,null,2)); }
function getSaldo(jid){ return db()[jid]||0; }
function addSaldo(jid,n){ const d=db(); d[jid]=Math.max(0,(d[jid]||0)+n); saveDB(d); return d[jid]; }
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const at = jid => "@"+String(jid).split("@")[0];
function uptime(){ let s=Math.floor((Date.now()-AVVIO)/1000); const h=Math.floor(s/3600), mn=Math.floor((s%3600)/60); return h? h+"h "+mn+"m" : mn+"m "+(s%60)+"s"; }
function calc(expr){ if(!/^[-+*/().\d\s%]+$/.test(expr||"")) return "espressione non valida"; try{ const r=Function("return ("+expr+")")(); return (typeof r==="number"&&isFinite(r))?r:"espressione non valida"; }catch(e){ return "espressione non valida"; } }
function F(testo,V){ return String(testo==null?"":testo).replace(/\{(\w+)\}/g,(x,k)=>(V[k]!==undefined?V[k]:x)); }
function corpo(m){ const t=m.message||{}; return t.conversation || (t.extendedTextMessage&&t.extendedTextMessage.text) || (t.imageMessage&&t.imageMessage.caption) || ""; }
function menzionati(m){ const e=m.message&&m.message.extendedTextMessage&&m.message.extendedTextMessage.contextInfo; if(e&&e.mentionedJid&&e.mentionedJid.length) return e.mentionedJid[0]; if(e&&e.participant) return e.participant; return null; }

const { exec } = require("child_process");
const TMP="./tmp"; if(!fs.existsSync(TMP)) fs.mkdirSync(TMP);
function sh(cmd){ return new Promise((ok,ko)=>{ exec(cmd,{maxBuffer:1024*1024*40,timeout:120000},(e,so,se)=>{ if(e) ko(new Error((se||e.message).split("\n").slice(-3).join(" ").slice(0,160))); else ok(so); }); }); }
function pulisci(files){ for(const f of files){ try{ fs.unlinkSync(f);}catch(e){} } }
const { downloadMediaMessage } = require('@itsukichan/baileys');
async function prendiMedia(m){ const ctx=m.message&&m.message.extendedTextMessage&&m.message.extendedTextMessage.contextInfo; const q=ctx&&ctx.quotedMessage; const msg=q?{key:m.key,message:q}:m; const tipi=Object.keys(msg.message||{}); const img=tipi.includes("imageMessage"); const vid=tipi.includes("videoMessage"); const stk=tipi.includes("stickerMessage"); if(!img&&!vid&&!stk) return null; try{ const buffer=await downloadMediaMessage(msg,"buffer",{}); return {buffer,video:vid,sticker:stk,immagine:img}; }catch(e){ return null; } }

const GIORNI=["domenica","lunedì","martedì","mercoledì","giovedì","venerdì","sabato"];
const MESI=["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];
function makeV(extra){
  const n=new Date();
  return Object.assign({
    user:"",nome:"utente",chat:"",gruppo:"chat privata",membri:1,admin:"no",owner:"no",isgruppo:"no",saldo:0,
    prefix:PREFIX,bot:BOT,moneta:MONETA,cmd:"",args:"",arg1:"",target:"nessuno",
    ora:n.toTimeString().slice(0,5),orario:n.toTimeString().slice(0,8),data:n.toLocaleDateString("it-IT"),giorno:GIORNI[n.getDay()],mese:MESI[n.getMonth()],anno:n.getFullYear(),
    random:Math.floor(Math.random()*100)+1,dado:Math.floor(Math.random()*6)+1,ping:0,uptime:uptime(),ram:Math.round(process.memoryUsage().rss/1048576)+"MB",node:process.version,
    totcmd:0,risultato:""
  },extra||{});
}
makeV({}); // dummy per evitare reference

const BLOCCHI=[
  { tipo:'comando', desc:'Lista dei comandi', nomi:['menu','help','comandi','m'], async run(ctx){ const{reply,V}=ctx; let testo=F('╭─ *NICOBOT* ─────\n│ {totcmd} comandi · prefisso {prefix}\n│ attivo da {uptime}\n╰──────────────',V); V.totcmd=BLOCCHI.filter(b=>b.tipo==="comando").length; testo=F('╭─ *NICOBOT* ─────\n│ {totcmd} comandi · prefisso {prefix}\n│ attivo da {uptime}\n╰──────────────',V); for(const b of BLOCCHI){ if(b.tipo!=="comando") continue; testo+="\n"+PREFIX+b.nomi[0]+(b.desc?" · "+b.desc:""); } await reply(testo); } },
  { tipo:'comando', desc:'Test di vita', nomi:['ping','p'], async run(ctx){ const{reply,V,t0}=ctx; V.ping=Date.now()-t0; V.uptime=uptime(); await reply(F('🏓 *{ping}ms*\n⚙ {ram} · Node {node}\n⏱ attivo da {uptime}',V)); } },
  { tipo:'comando', desc:'Pannello di stato', nomi:['sicurezza','stato','status'], async run(ctx){ const{reply,V,t0}=ctx; V.ping=Date.now()-t0; V.uptime=uptime(); await reply(F('╭─ *STATO NICOBOT*\n│ 🟢 online da {uptime}\n│ 🏓 latenza {ping}ms\n│ 🧠 memoria {ram}\n│ 📦 Node {node}\n│ 🧩 {totcmd} comandi caricati\n│ 👥 chat: {gruppo} ({membri})\n╰──────────────',V)); } },
  { tipo:'comando', desc:'I miei canali', nomi:['social'], async run(ctx){ const{sock,m,from,V}=ctx; await sock.sendMessage(from,{text:F('📡 *Dove mi trovi*\n\nCanale sicurezza, aggiornamenti del bot e roba nuova.',V)}, {quoted:m}); } },
  { tipo:'comando', desc:'Quanto hai in cassa', nomi:['saldo','bal','soldi','money'], async run(ctx){ const{reply,V,sender}=ctx; V.saldo=getSaldo(sender); await reply(F('💰 *{nome}*\nSaldo: *{saldo}* {moneta}',V)); } },
  { tipo:'comando', desc:'Guadagna monete', nomi:['lavora','work'], async run(ctx){ const{reply,V,sender}=ctx; await reply(F('⛏ {nome} si mette al lavoro…',V)); await sleep(1200); const n=parseInt(V.arg1,10); const amount=isNaN(n)?250:n; addSaldo(sender,amount); V.saldo=getSaldo(sender); V.arg1=amount; await reply(F('✅ Hai guadagnato *{arg1}* {moneta}.\nTotale: *{saldo}*',V)); } },
  { tipo:'comando', desc:'Regala monete a chi tagghi', nomi:['paga','dona'], soloGruppo:true, async run(ctx){ const{reply,V,sender,target}=ctx; const n=parseInt(V.arg1,10); const amount=isNaN(n)?100:n; addSaldo(sender,-amount); addSaldo((target||sender),amount); V.saldo=getSaldo((target||sender)); await reply(F('📤 Hai mandato {arg1} {moneta} a {target}.',V)); } },
  { tipo:'comando', desc:'Tira un dado', nomi:['dado','rolla'], async run(ctx){ const{reply,V}=ctx; await reply(F('🎲 {nome} tira il dado… esce *{dado}*!',V)); } },
  { tipo:'comando', desc:'Calcolatrice', nomi:['calc','math','matematica'], async run(ctx){ const{reply,V}=ctx; V.risultato=calc(V.args); await reply(F('🧮 {args} = *{risultato}*',V)); } },
  { tipo:'comando', desc:'Immagine o video in sticker', nomi:['sticker','s','stiker'], async run(ctx){ const{sock,m,from,reply}=ctx; const md=await prendiMedia(m); if(!md){ await reply("Manda o cita un'immagine / video con questo comando."); } else { const inF=TMP+"/in"+Date.now(), outF=TMP+"/st"+Date.now()+".webp"; fs.writeFileSync(inF,md.buffer); const filtro="scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=#00000000"; const extra=md.video?"-t 7 -loop 0 -an -preset default":""; try{ await sh("ffmpeg -y -i "+inF+" -vf \""+filtro+"\" "+extra+" -c:v libwebp -q:v 60 "+outF); await sock.sendMessage(from,{sticker:fs.readFileSync(outF)},{quoted:m}); }catch(e){ await reply("ffmpeg errore: "+e.message); } pulisci([inF,outF]); } } },
  { tipo:'comando', desc:'Sticker in immagine', nomi:['toimg','toimage','img'], async run(ctx){ const{sock,m,from,reply,V}=ctx; const md=await prendiMedia(m); if(!md||!md.sticker){ await reply("Cita uno sticker con questo comando."); } else { const inF=TMP+"/sk"+Date.now()+".webp", outF=TMP+"/img"+Date.now()+".png"; fs.writeFileSync(inF,md.buffer); try{ await sh("ffmpeg -y -i "+inF+" "+outF); await sock.sendMessage(from,{image:fs.readFileSync(outF)},{quoted:m}); }catch(e){ await reply("Conversione fallita."); } pulisci([inF,outF]); } } },
  { tipo:'comando', desc:'Cerca e manda un audio', nomi:['play','musica','song'], async run(ctx){ const{sock,m,from,reply,V}=ctx; const cerca=String(V.args||"").replace(/["`$\\]/g,""); if(!cerca){ await reply("Scrivi cosa cercare, es. "+PREFIX+V.cmd+" imagine dragons"); } else { await reply(F('🔎 Cerco *{args}*, un attimo…',V)); const base=TMP+"/au"+Date.now(); try{ await sh("yt-dlp -x --audio-format mp3 --audio-quality 5 --no-playlist --match-filter \"duration < 600\" -o \""+base+".%(ext)s\" \"ytsearch1:"+cerca+"\""); const file=base+".mp3"; await sock.sendMessage(from,{audio:fs.readFileSync(file),mimetype:"audio/mpeg"},{quoted:m}); pulisci([file]); }catch(e){ await reply("Audio non trovato."); } } } },
  { tipo:'comando', desc:'Solo admin possono scrivere', nomi:['muta','mute','chiudi'], soloGruppo:true, soloAdmin:true, async run(ctx){ const{sock,from,reply,V}=ctx; await sock.groupSettingUpdate(from,'announcement'); await reply(F('🔇 *Gruppo chiuso* da {nome}.',V)); } },
  { tipo:'comando', desc:'Riapre il gruppo a tutti', nomi:['smuta','unmute','apri'], soloGruppo:true, soloAdmin:true, async run(ctx){ const{sock,from,reply,V}=ctx; await sock.groupSettingUpdate(from,'not_announcement'); await reply(F('🔊 *Gruppo riaperto* da {nome}.',V)); } },
  { tipo:'comando', desc:'Solo admin modificano le info', nomi:['blocca','lock'], soloGruppo:true, soloOwner:true, async run(ctx){ const{sock,from,reply}=ctx; await sock.groupSettingUpdate(from,'locked'); await reply('🔒 Info bloccate solo admin.'); } },
  { tipo:'comando', desc:'Tutti modificano le info', nomi:['sblocca','unlock'], soloGruppo:true, soloOwner:true, async run(ctx){ const{sock,from,reply}=ctx; await sock.groupSettingUpdate(from,'unlocked'); await reply('🔓 Info sbloccate.'); } },
  { tipo:'comando', desc:'Tagga tutto il gruppo', nomi:['tagall','everyone','all'], soloGruppo:true, soloAdmin:true, async run(ctx){ const{sock,from,V}=ctx; const mem=(await sock.groupMetadata(from)).participants.map(x=>x.id); await sock.sendMessage(from,{text:F('📢 *Avviso da {nome}*\n{args}',V)+"\n"+mem.map(at).join(" "),mentions:mem}); } },
  { tipo:'comando', desc:'Butta fuori chi tagghi', nomi:['kick','ban','rimuovi'], soloGruppo:true, soloAdmin:true, async run(ctx){ const{sock,from,target,reply,V}=ctx; await reply(F('🚪 {target} rimosso da {nome}.',V)); if(target) await sock.groupParticipantsUpdate(from,[target],"remove"); } },
  { tipo:'comando', desc:'Rende admin il taggato', nomi:['promuovi','admin','up','p'], soloGruppo:true, soloAdmin:true, async run(ctx){ const{sock,from,target,reply,V}=ctx; if(target) await sock.groupParticipantsUpdate(from,[target],'promote'); await reply(F('⬆ {target} ora è admin.',V)); } },
  { tipo:'comando', desc:'Toglie admin al taggato', nomi:['declassa','unadmin','down','d'], soloGruppo:true, soloAdmin:true, async run(ctx){ const{sock,from,target,reply,V}=ctx; if(target) await sock.groupParticipantsUpdate(from,[target],'demote'); await reply(F('⬇ {target} non è più admin.',V)); } },
  { tipo:'comando', desc:'Cancella il messaggio citato', nomi:['elimina','del','delete'], soloGruppo:true, soloAdmin:true, async run(ctx){ const{sock,m,from}=ctx; await sock.sendMessage(from,{delete:m.key}); } },
  { tipo:'comando', desc:'Dati del gruppo', nomi:['info','gruppo','gc'], soloGruppo:true, async run(ctx){ const{reply,V}=ctx; await reply(F('╭─ *{gruppo}*\n│ 👥 {membri} membri\n│ 🆔 {chat}\n╰──────────────',V)); } },
  { tipo:'benvenuto', desc:'Saluta i nuovi', async run(ctx){ const{sock,from,V}=ctx; await sock.sendMessage(from,{text:F('👋 Benvenuto {tag} in *{gruppo}*! Siamo in {membri}.',V)}); } },
  { tipo:'addio', desc:'Saluta chi esce', async run(ctx){ const{reply,V}=ctx; await reply(F('👋 {tag} ha lasciato il gruppo. Restiamo in {membri}.',V)); } },
  { tipo:'contiene', desc:'Autorisposta mattutina', testo:'buongiorno', async run(ctx){ const{sock,m,from,reply,V}=ctx; await sock.sendMessage(from,{react:{text:'☀️',key:m.key}}); await reply(F('Buongiorno {nome}! Sono le {ora} di {giorno}.',V)); } },
  { tipo:'esatto', desc:'Risponde se lo chiami', testo:'bot', async run(ctx){ const{reply,V}=ctx; await reply(F('Sono qui {nome} 👀 scrivi {prefix}menu',V)); } }
];

async function onMessage(sock,m){
  try{
    if(!m||!m.message||m.key.fromMe) return;
    const t0=Date.now();
    const from=m.key.remoteJid;
    const isGroup=from.endsWith("@g.us");
    const sender=isGroup?(m.key.participant||m.participant):from;
    const body=corpo(m).trim();
    if(!body) return;
    const low=body.toLowerCase();
    const target=menzionati(m);
    const reply=(testo)=>sock.sendMessage(from,{text:testo},{quoted:m});
    let meta=null,admins=[];
    if(isGroup){ try{ meta=await sock.groupMetadata(from); admins=meta.participants.filter(p=>p.admin).map(p=>p.id); }catch(e){} }
    const isAdmin=admins.includes(sender);
    const isOwner=String(sender).startsWith(OWNER)&&OWNER.length>5;
    for(const b of BLOCCHI){
      let ok=false,cmd="";
      if(b.tipo==="comando"&&low.startsWith(PREFIX)){ const primo=low.slice(PREFIX.length).split(/\s+/)[0]; if(b.nomi.includes(primo)){ ok=true; cmd=primo; } }
      else if(b.tipo==="esatto"){ ok=low===b.testo; }
      else if(b.tipo==='contiene'){ ok=low.includes(b.testo); }
      else if(b.tipo==='benvenuto'||b.tipo==='addio'){ continue; }
      if(!ok) continue;
      if(b.soloGruppo&&!isGroup) continue;
      if(b.soloAdmin&&!isAdmin&&!isOwner) continue;
      if(b.soloOwner&&!isOwner) continue;
      const V=makeV({
        user:sender,nome:sender.split('@')[0],tag:at(sender),chat:from,
        gruppo:meta?meta.subject:'chat privata',membri:meta?meta.participants.length:1,
        admin:isAdmin?'si':'no',owner:isOwner?'si':'no',isgruppo:isGroup?'si':'no',
        cmd:cmd,args:body.slice(PREFIX.length+cmd.length).trim(),arg1:body.split(/\s+/)[1]||'',
        target:target?at(target):'nessuno',
      });
      V.totcmd=BLOCCHI.filter(x=>x.tipo==="comando").length;
      const ctx={sock,m,from,sender,target,reply,at,V,t0};
      await b.run(ctx);
      break;
    }
  }catch(e){ console.log('errore msg:',e.message); }
}
function init(sock){
  sock.ev.on('messages.upsert', async ({messages})=>{ for(const mm of messages) await onMessage(sock,mm); });
  sock.ev.on('group-participants.update', async (anu)=>{
    try{
      const from=anu.id; const meta=await sock.groupMetadata(from);
      for(const jid of anu.participants){
        const V=makeV({user:jid,nome:jid.split('@')[0],tag:at(jid),chat:from,gruppo:meta.subject,membri:meta.participants.length});
        const m={key:{remoteJid:from},message:{}}; const ctx={sock,m,from,sender:jid,target:jid,reply:(t)=>sock.sendMessage(from,{text:t}),at,V,t0:Date.now()};
        for(const b of BLOCCHI){
          if(anu.action==='add'&&b.tipo==='benvenuto') await b.run(ctx);
          if((anu.action==='remove'||anu.action==='leave')&&b.tipo==='addio') await b.run(ctx);
        }
      }
    }catch(e){}
  });
}
module.exports={init,onMessage};
