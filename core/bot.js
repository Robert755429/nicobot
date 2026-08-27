import fs from "fs"
const OWNER_NUMBER='393887347002'
const DB_FILE='./nicoschei.json'; const SET_FILE='./nicosettings.json'; const WARN_FILE='./nicowarn.json'; const AVVIO=Date.now()
function db(){try{return JSON.parse(fs.readFileSync(DB_FILE,"utf8"))}catch(e){return{}}}
function saveDB(d){fs.writeFileSync(DB_FILE,JSON.stringify(d,null,2))}
function getSaldo(j){return db()[j]||0}
function addSaldo(j,n){const d=db();d[j]=Math.max(0,(d[j]||0)+n);saveDB(d);return d[j]}
function getSet(){try{return JSON.parse(fs.readFileSync(SET_FILE,"utf8"))}catch(e){return{}}}
function saveSet(d){fs.writeFileSync(SET_FILE,JSON.stringify(d,null,2))}
function getWarn(){try{return JSON.parse(fs.readFileSync(WARN_FILE,"utf8"))}catch(e){return{}}}
function saveWarn(d){fs.writeFileSync(WARN_FILE,JSON.stringify(d,null,2))}
function getWarnsCount(gid,uid){const w=getWarn();return w[gid]?.[uid]||0}
function addWarn(gid,uid){const w=getWarn();if(!w[gid])w[gid]={};w[gid][uid]=(w[gid][uid]||0)+1;saveWarn(w);return w[gid][uid]}
function delWarn(gid,uid){const w=getWarn();if(!w[gid])w[gid]={};w[gid][uid]=Math.max(0,(w[gid][uid]||0)-1);if(w[gid][uid]===0)delete w[gid][uid];saveWarn(w);return w[gid][uid]||0}
function resetWarn(gid,uid){const w=getWarn();if(w[gid]){delete w[gid][uid];saveWarn(w)}}
function isOnWelcome(j){const s=getSet();return s[j]?.welcome!==false}
function isAntilinkOn(j){const s=getSet();return s[j]?.antilink===true}
function setOn(j,k,v){const s=getSet();if(!s[j])s[j]={};s[j][k]=v;saveSet(s)}
const LINK_REGEX=/(https?:\/\/|www\.|chat\.whatsapp\.com|wa\.me\/|t\.me\/|discord\.gg|instagram\.com|tiktok\.com)/i
const at=j=>"@"+String(j).split("@")[0]
const uptime=()=>{let s=Math.floor((Date.now()-AVVIO)/1000);const h=Math.floor(s/3600),m=Math.floor((s%3600)/60);return h?`${h}h ${m}m`: `${m}m ${s%60}s`}
function corpo(m){const t=m.message||{};return t.conversation||t.extendedTextMessage?.text||t.imageMessage?.caption||t.videoMessage?.caption||""}
function menzionati(m){return m.message?.extendedTextMessage?.contextInfo?.mentionedJid||[]}
function menzionato(m){return menzionati(m)[0]||null}
function getMenu(){return `┏━━━━━━━━━━━━━━┓\n┃ *⚡ NICOBOT V3* ⚡\n┃ ⏱️ ${uptime()} | Prefix:.\n┗━━━━━━━━━━━━━━┛\n\n*GENERALE*\n.menu.ping.groupinfo\n\n*ADMIN*\n.chiudi.apri.kick.promote.demote.tag\n.antilink on/off\n\n*WARN*\n.warn @.delwarn @.warns.resetwarn @\n\n*ECONOMIA*\n.saldo.lavora.paga @.classifica`.trim()}
const BLOCCHI=[
{desc:'menu',nomi:['menu','help'],async run(c){await c.reply(getMenu())}},
{desc:'ping',nomi:['ping','alive'],async run(c){await c.reply(`🏓 PONG ${Date.now()-c.t0}ms\n⏱️ ${uptime()}`)}},
{desc:'chiudi',nomi:['chiudi','close'],soloGruppo:true,soloAdmin:true,async run(c){await c.sock.groupSettingUpdate(c.from,'announcement');await c.reply('🔒 Chiuso')}},
{desc:'apri',nomi:['apri','open'],soloGruppo:true,soloAdmin:true,async run(c){await c.sock.groupSettingUpdate(c.from,'not_announcement');await c.reply('🔓 Aperto')}},
{desc:'kick',nomi:['kick','ban'],soloGruppo:true,soloAdmin:true,async run(c){const t=menzionato(c.m);if(!t)return c.reply('.kick @utente');await c.sock.groupParticipantsUpdate(c.from,[t],"remove");await c.reply(`🚪 ${at(t)} rimosso`,{mentions:[t]})}},
{desc:'promote',nomi:['promote'],soloGruppo:true,soloAdmin:true,async run(c){const t=menzionato(c.m);if(!t)return c.reply('.promote @utente');await c.sock.groupParticipantsUpdate(c.from,[t],"promote");await c.reply(`⬆️ ${at(t)} admin`,{mentions:[t]})}},
{desc:'demote',nomi:['demote'],soloGruppo:true,soloAdmin:true,async run(c){const t=menzionato(c.m);if(!t)return c.reply('.demote @utente');await c.sock.groupParticipantsUpdate(c.from,[t],"demote");await c.reply(`⬇️ ${at(t)}`,{mentions:[t]})}},
{desc:'tag',nomi:['tag','tagall','hidetag'],soloGruppo:true,soloAdmin:true,async run(c){const meta=await c.sock.groupMetadata(c.from);await c.sock.sendMessage(c.from,{text:`📢 ${c.V.args||'Avviso'}\n${meta.participants.map(p=>at(p.id)).join(" ")}`,mentions:meta.participants.map(p=>p.id)})}},
{desc:'antilink',nomi:['antilink'],soloGruppo:true,soloAdmin:true,async run(c){const a=c.V.args.toLowerCase();if(a==='on'){setOn(c.from,'antilink',true);await c.reply('🔗 Antilink ON - Cancello link + warn auto')}else if(a==='off'){setOn(c.from,'antilink',false);await c.reply('🔗 Antilink OFF')}else{await c.reply(`🔗 Antilink è ${isAntilinkOn(c.from)?'ON':'OFF'}\nUsa:.antilink on/off`)}}},
{desc:'warn',nomi:['warn','setwarn'],soloGruppo:true,soloAdmin:true,async run(c){const t=menzionato(c.m);if(!t)return c.reply('.warn @utente');const n=addWarn(c.from,t);if(n>=3){await c.sock.sendMessage(c.from,{text:`⚠️ ${at(t)} 3/3 → kick`,mentions:[t]});try{await c.sock.groupParticipantsUpdate(c.from,[t],"remove");resetWarn(c.from,t)}catch(e){}}else{await c.sock.sendMessage(c.from,{text:`⚠️ Warn a ${at(t)} [${n}/3]`,mentions:[t]})}}},
{desc:'delwarn',nomi:['delwarn','unsetwarn'],soloGruppo:true,soloAdmin:true,async run(c){const t=menzionato(c.m);if(!t)return c.reply('.delwarn @utente');const n=delWarn(c.from,t);await c.reply(`✅ ${at(t)} ora ${n}/3`,{mentions:[t]})}},
{desc:'warns',nomi:['warns','warnings'],soloGruppo:true,async run(c){const t=menzionato(c.m)||c.sender;const n=getWarnsCount(c.from,t);await c.reply(n?`⚠️ ${at(t)}: ${n}/3`:`✅ ${at(t)} 0 warn`,{mentions:[t]})}},
{desc:'resetwarn',nomi:['resetwarn'],soloGruppo:true,soloAdmin:true,async run(c){const t=menzionato(c.m);if(!t)return c.reply('.resetwarn @utente');resetWarn(c.from,t);await c.reply(`♻️ Azzerati per ${at(t)}`,{mentions:[t]})}},
{desc:'economia',nomi:['saldo','bal','lavora','work','giornaliero','paga','classifica','groupinfo','jid'],async run(c){
  if(['saldo','bal'].includes(c.command))await c.reply(`💰 Saldo: ${getSaldo(c.sender)}`);
  else if(['lavora','work','giornaliero'].includes(c.command)){addSaldo(c.sender,250);await c.reply(`⛏️ +250 Tot: ${getSaldo(c.sender)}`)}
  else if(c.command==='paga'){const t=menzionato(c.m);const n=parseInt(c.V.args.split(' ').pop());if(!t||isNaN(n))return c.reply('.paga @utente <n>');if(getSaldo(c.sender)<n)return c.reply('❌ Schei insufficienti');addSaldo(c.sender,-n);addSaldo(t,n);await c.reply(`💸 ${n} a ${at(t)}`,{mentions:[t]})}
  else if(c.command==='classifica'){const d=db();const top=Object.entries(d).sort((a,b)=>b[1]-a[1]).slice(0,5);let txt='🏆 Classifica\n';top.forEach(([jid,val],i)=>txt+=`${i+1}. ${at(jid)} - ${val}\n`);await c.sock.sendMessage(c.from,{text:txt,mentions:top.map(x=>x[0])})}
  else{const meta=await c.sock.groupMetadata(c.from).catch(()=>null);await c.reply(meta?`📋 ${meta.subject}\n👥 ${meta.participants.length}`:'Info')}
}},
]
export async function handleWelcome(sock,anu){try{const{id,participants}=anu;if(!isOnWelcome(id))return;const meta=await sock.groupMetadata(id).catch(()=>null);if(!meta)return;for(const p of participants){await sock.sendMessage(id,{text:`👋 Benvenuto ${at(p)}!`,mentions:[p]})}}catch(e){}}
export async function onMessage(sock,m){
 try{
  if(!m||!m.message) return; const from=m.key.remoteJid||""; if(from==="status@broadcast") return;
  const isGroup=from.endsWith("@g.us"); const senderRaw=isGroup?(m.key.participantAlt||m.key.participant||m.participant||""):from; const sender=senderRaw||from;
  const body=corpo(m).trim();
  let meta=null,admins=[]; if(isGroup){try{meta=await sock.groupMetadata(from);admins=meta.participants.filter(p=>p.admin).map(p=>p.id)}catch(e){}}
  const isSelf=m.key.fromMe===true; const isOwner=isSelf||String(sender).includes(OWNER_NUMBER); const isAdmin=isOwner||admins.includes(sender);
  if(isGroup && body && isAntilinkOn(from) &&!isAdmin &&!isOwner){
    if(LINK_REGEX.test(body)){
      try{ await sock.sendMessage(from,{delete:m.key}) }catch(e){}
      const n=addWarn(from,sender);
      if(n>=3){ await sock.sendMessage(from,{text:`🔗 ${at(sender)} link [${n}/3] → kick`,mentions:[sender]}); try{ await sock.groupParticipantsUpdate(from,[sender],"remove"); resetWarn(from,sender) }catch(e){} }
      else{ await sock.sendMessage(from,{text:`🔗 Link vietato! Warn a ${at(sender)} [${n}/3]`,mentions:[sender]}); }
      return;
    }
  }
  if(!body||!body.startsWith('.')) return;
  const primoRaw=body.slice(1).split(/\s+/)[0].toLowerCase(); if(!primoRaw) return;
  const reply=(t,opt={})=>sock.sendMessage(from,{text:t,...opt},{quoted:m});
  for(const b of BLOCCHI){ if(!b.nomi.includes(primoRaw)) continue; if(b.soloGruppo&&!isGroup)continue; if(b.soloAdmin&&!isAdmin&&!isOwner)continue;
   const args=body.slice(('.'+primoRaw).length).trim();
   await b.run({sock,m,from,sender,isGroup,isAdmin,isOwner,reply,V:{args},command:primoRaw,t0:Date.now()}); return;
  }
 }catch(e){console.log("ERR:",e.message)}
}
