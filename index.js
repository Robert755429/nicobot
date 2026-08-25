/* =====================================================
 * NICOBOT - FIXED per Render
 * Libreria: @whiskeysockets/baileys
 * Ora funziona con QR + Codice
 * ===================================================== */

const fs = require("fs");
const P = require('pino');
const qrcode = require('qrcode-terminal');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, downloadMediaMessage } = require('@whiskeysockets/baileys');

const PREFIX = '.';
const BOT = 'nicobot';
const OWNER = '393887347002';
const MONETA = 'schei';
const DB_FILE = './nicoschei.json';
const AVVIO = Date.now();

function db() { try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); } catch (e) { return {}; } }
function saveDB(d) { fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2)); }
function getSaldo(jid) { return db()[jid] || 0; }
function addSaldo(jid, n) { const d = db(); d[jid] = Math.max(0, (d[jid] || 0) + n); saveDB(d); return d[jid]; }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const at = (jid) => "@" + String(jid).split("@")[0];
function uptime() { let s = Math.floor((Date.now() - AVVIO) / 1000); const h = Math.floor(s / 3600), mn = Math.floor((s % 3600) / 60); return h? h + "h " + mn + "m" : mn + "m " + (s % 60) + "s"; }
function calc(expr) { if (!/^[-+*/().\d\s%]+$/.test(expr || "")) return "espressione non valida"; try { const r = Function("return (" + expr + ")")(); return (typeof r === "number" && isFinite(r))? r : "espressione non valida"; } catch (e) { return "espressione non valida"; } }
function F(testo, V) { return String(testo == null? "" : testo).replace(/\{(\w+)\}/g, (x, k) => (V[k]!== undefined? V[k] : x)); }
function corpo(m) { const t = m.message || {}; return t.conversation || (t.extendedTextMessage && t.extendedTextMessage.text) || (t.imageMessage && t.imageMessage.caption) || (t.buttonsResponseMessage && t.buttonsResponseMessage.selectedButtonId) || (t.templateButtonReplyMessage && t.templateButtonReplyMessage.selectedId) || ""; }
function menzionati(m) { const e = m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo; if (e && e.mentionedJid && e.mentionedJid.length) return e.mentionedJid[0]; if (e && e.participant) return e.participant; return null; }
function citato(m) { const e = m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo; const qm = e && e.quotedMessage; if (!qm) return ""; return qm.conversation || (qm.extendedTextMessage && qm.extendedTextMessage.text) || ""; }
function tipoMsg(m) { const k = Object.keys(m.message || {})[0] || ""; return k.replace("Message", "").replace("conversation", "testo").replace("extendedText", "testo"); }

const { exec } = require("child_process");
const TMP = "./tmp";
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP);
function sh(cmd) { return new Promise((ok, ko) => { exec(cmd, { maxBuffer: 1024 * 1024 * 40, timeout: 120000 }, (e, so, se) => { if (e) ko(new Error((se || e.message).split("\n").slice(-3).join(" ").slice(0, 160))); else ok(so); }); }); }
function pulisci(files) { for (const f of files) { try { fs.unlinkSync(f); } catch (e) {} } }
async function prendiMedia(m) {
  const ctx = m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo;
  const q = ctx && ctx.quotedMessage;
  const msg = q? { key: m.key, message: q } : m;
  const tipi = Object.keys(msg.message || {});
  const img = tipi.includes("imageMessage"); const vid = tipi.includes("videoMessage"); const stk = tipi.includes("stickerMessage");
  if (!img &&!vid &&!stk) return null;
  try { const buffer = await downloadMediaMessage(msg, "buffer", {}); return { buffer, video: vid, sticker: stk, immagine: img }; } catch (e) { return null; }
}

const GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno","luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
function makeV(extra) {
  const n = new Date();
  return Object.assign({ user: "", id: "", tag: "", nome: "utente", chat: "", gruppo: "chat privata", descr: "", membri: 1, admin: "no", owner: "no", isgruppo: "no", saldo: 0, saldotarget: 0, prefix: PREFIX, bot: BOT, moneta: MONETA, cmd: "", args: "", arg1: "", arg2: "", arg3: "", target: "nessuno", targetnome: "nessuno", citato: "", tipo: "testo", ora: n.toTimeString().slice(0, 5), orario: n.toTimeString().slice(0, 8), data: n.toLocaleDateString("it-IT"), giorno: GIORNI[n.getDay()], mese: MESI[n.getMonth()], anno: n.getFullYear(), random: Math.floor(Math.random() * 100) + 1, dado: Math.floor(Math.random() * 6) + 1, ping: 0, uptime: uptime(), ram: Math.round(process.memoryUsage().rss / 1048576) + "MB", node: process.version, totcmd: 0, risultato: "" }, extra || {});
}

/* ---------- BLOCCHI - I TUOI COMANDI ---------- */
const BLOCCHI = [
  { tipo: 'comando', desc: 'Lista dei comandi', nomi: ['menu', 'help', 'comandi', 'm'], async run(ctx) { const { reply, V } = ctx; V.totcmd = BLOCCHI.filter(b=>b.tipo==='comando').length; let testo = F('╭─ *NICOBOT* ─────\n│ {totcmd} comandi · prefisso {prefix}\n│ attivo da {uptime}\n╰──────────────', V); for (const b of BLOCCHI) { if (b.tipo!== "comando") continue; testo += "\n" + PREFIX + b.nomi[0] + (b.desc? " · " + b.desc : ""); } await reply(testo); } },
  { tipo: 'comando', desc: 'Test di vita', nomi: ['ping', 'p'], async run(ctx) { const { reply, V, t0 } = ctx; V.ping = Date.now() - t0; V.uptime = uptime(); await reply(F('🏓 *{ping}ms*\n⚙ {ram} · Node {node}\n⏱ attivo da {uptime}', V)); } },
  { tipo: 'comando', desc: 'Pannello di stato', nomi: ['sicurezza', 'stato', 'status'], async run(ctx) { const { reply, V, t0 } = ctx; V.ping = Date.now() - t0; V.uptime = uptime(); await reply(F('╭─ *STATO NICOBOT*\n│ 🟢 online da {uptime}\n│ 🏓 latenza {ping}ms\n│ 🧠 memoria {ram}\n│ 📦 Node {node}\n│ 🧩 {totcmd} comandi caricati\n│ 👥 chat: {gruppo} ({membri})\n│ 🕒 {orario} · {giorno} {data}\n╰──────────────', V)); } },
  { tipo: 'comando', desc: 'Quanto hai in cassa', nomi: ['saldo', 'bal', 'soldi', 'money'], async run(ctx) { const { reply, V, sender } = ctx; V.saldo = getSaldo(sender); await reply(F('💰 *{nome}*\nSaldo: *{saldo}* {moneta}', V)); } },
  { tipo: 'comando', desc: 'Guadagna monete', nomi: ['lavora', 'work'], async run(ctx) { const { reply, V, sender } = ctx; await reply(F('⛏ {nome} si mette al lavoro…', V)); await sleep(1200); const n = parseInt(V.arg1, 10); const amount = isNaN(n)? 250 : n; addSaldo(sender, amount); V.saldo = getSaldo(sender); V.arg1 = amount; await reply(F('✅ Hai guadagnato *{arg1}* {moneta}.\nTotale: *{saldo}*', V)); } },
  { tipo: 'comando', desc: 'Regala monete a chi tagghi', nomi: ['paga', 'dona'], soloGruppo: true, async run(ctx) { const { reply, V, sender, target } = ctx; const n = parseInt(V.arg1, 10); const amount = isNaN(n)? 100 : n; addSaldo(sender, -amount); addSaldo((target || sender), amount); V.arg1 = amount; await reply(F('📤 Hai mandato {arg1} {moneta} a {target}. Saldo tuo: {saldo}', V)); } },
  { tipo: 'comando', desc: 'Tira un dado', nomi: ['dado', 'rolla'], async run(ctx) { const { reply, V } = ctx; await reply(F('🎲 {nome} tira il dado… esce *{dado}*!', V)); } },
  { tipo: 'comando', desc: 'Calcolatrice', nomi: ['calc', 'math', 'matematica'], async run(ctx) { const { reply, V } = ctx; V.risultato = calc(V.args); await reply(F('🧮 {args} = *{risultato}*', V)); } },
  { tipo: 'comando', desc: 'Immagine o video in sticker', nomi: ['sticker', 's', 'stiker'], async run(ctx) { const { sock, m, from, reply, V } = ctx; const md = await prendiMedia(m); if (!md) { await reply("Manda o cita un'immagine / video con questo comando."); } else { const inF = TMP + "/in" + Date.now(), outF = TMP + "/st" + Date.now() + ".webp"; fs.writeFileSync(inF, md.buffer); const filtro = "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=#00000000"; const extra = md.video? "-t 7 -loop 0 -an -preset default" : ""; try { await sh("ffmpeg -y -i " + inF + " -vf \"" + filtro + "\" " + extra + " -c:v libwebp -q:v 60 " + outF); await sock.sendMessage(from, { sticker: fs.readFileSync(outF) }, { quoted: m }); } catch (e) { await reply("ffmpeg non ce l'ha fatta: " + e.message); } pulisci([inF, outF]); } } },
  { tipo: 'comando', desc: 'Sticker in immagine', nomi: ['toimg', 'toimage', 'img'], async run(ctx) { const { sock, m, from, reply, V } = ctx; const md = await prendiMedia(m); if (!md ||!md.sticker) { await reply("Cita uno sticker con questo comando."); } else { const inF = TMP + "/sk" + Date.now() + ".webp", outF = TMP + "/img" + Date.now() + ".png"; fs.writeFileSync(inF, md.buffer); try { await sh("ffmpeg -y -i " + inF + " " + outF); await sock.sendMessage(from, { image: fs.readFileSync(outF), caption: F('🖼 Ecco la tua immagine, {nome}.', V) }, { quoted: m }); } catch (e) { await reply("Conversione fallita."); } pulisci([inF, outF]); } } },
  { tipo: 'comando', desc: 'Solo admin possono scrivere', nomi: ['muta', 'mute', 'chiudi'], soloGruppo: true, soloAdmin: true, async run(ctx) { const { sock, from, reply, V } = ctx; await sock.groupSettingUpdate(from, 'announcement'); await reply(F('🔇 *Gruppo chiuso* da {nome}.', V)); } },
  { tipo: 'comando', desc: 'Riapre il gruppo a tutti', nomi: ['smuta', 'unmute', 'apri'], soloGruppo: true, soloAdmin: true, async run(ctx) { const { sock, from, reply, V } = ctx; await sock.groupSettingUpdate(from, 'not_announcement'); await reply(F('🔊 *Gruppo riaperto* da {nome}.', V)); } },
  { tipo: 'comando', desc: 'Tagga tutto il gruppo', nomi: ['tagall', 'everyone', 'all'], soloGruppo: true, soloAdmin: true, async run(ctx) { const { sock, from, V } = ctx; const mem = (await sock.groupMetadata(from)).participants.map(x => x.id); await sock.sendMessage(from, { text: F('📢 *Avviso da {nome}*\n{args}', V) + "\n" + mem.map(at).join(" "), mentions: mem }); } },
  { tipo: 'comando', desc: 'Butta fuori chi tagghi', nomi: ['kick', 'ban', 'rimuovi'], soloGruppo: true, soloAdmin: true, async run(ctx) { const { sock, from, reply, V, target } = ctx; await reply(F('🚪 {target} rimosso da {nome}.', V)); if (target) await sock.groupParticipantsUpdate(from, [target], "remove"); } },
  { tipo: 'comando', desc: 'Rende admin', nomi: ['promuovi', 'admin', 'up'], soloGruppo: true, soloAdmin: true, async run(ctx) { const { sock, from, reply, V, target } = ctx; if (target) await sock.groupParticipantsUpdate(from, [target], 'promote'); await reply(F('⬆ {target} ora è admin.', V)); } },
  { tipo: 'comando', desc: 'Toglie admin', nomi: ['declassa', 'unadmin', 'down'], soloGruppo: true, soloAdmin: true, async run(ctx) { const { sock, from, reply, V, target } = ctx; if (target) await sock.groupParticipantsUpdate(from, [target], 'demote'); await reply(F('⬇ {target} non è più admin.', V)); } },
  { tipo: 'contiene', desc: 'Autorisposta mattutina', testo: 'buongiorno', async run(ctx) { const { sock, m, from, reply, V } = ctx; await sock.sendMessage(from, { react: { text: '☀️', key: m.key } }); await reply(F('Buongiorno {nome}! Sono le {ora} di {giorno}.', V)); } },
  { tipo: 'esatto', desc: 'Risponde se lo chiami', testo: 'bot', async run(ctx) { const { reply, V } = ctx; await reply(F('Sono qui {nome} 👀 scrivi {prefix}menu', V)); } }
];

/* ---------- motore messaggi ---------- */
async function onMessage(sock, m) {
  try {
    if (!m ||!m.message || m.key.fromMe) return;
    const t0 = Date.now();
    const from = m.key.remoteJid;
    const isGroup = from.endsWith("@g.us");
    const sender = isGroup? (m.key.participant || m.participant) : from;
    const body = corpo(m).trim();
    if (!body) return;
    const low = body.toLowerCase();
    const target = menzionati(m);

    let meta = null, admins = [];
    if (isGroup) { try { meta = await sock.groupMetadata(from); admins = meta.participants.filter((p) => p.admin).map((p) => p.id); } catch (e) {} }
    const isAdmin = admins.includes(sender);
    const isOwner = String(sender).includes(OWNER);

    const V = makeV({ nome: String(sender).split('@')[0], id: sender, tag: at(sender), chat: from, gruppo: meta? meta.subject : 'chat privata', descr: meta? (meta.desc||'') : '', membri: meta? meta.participants.length : 1, admin: isAdmin?'si':'no', owner: isOwner?'si':'no', isgruppo: isGroup?'si':'no', saldo: getSaldo(sender), tipo: tipoMsg(m), args: body.slice(1).split(' ').slice(1).join(' ').trim(), arg1: body.split(/\s+/)[1]||'', arg2: body.split(/\s+/)[2]||'', arg3: body.split(/\s+/)[3]||'', target: target?at(target):'nessuno', targetnome: target?String(target).split('@')[0]:'nessuno', citato: citato(m) });
    V.cmd = low.startsWith(PREFIX)? low.slice(1).split(/\s+/)[0] : '';
    if (V.args) V.arg1 = V.args.split(/\s+/)[0];

    const reply = (testo) => sock.sendMessage(from, { text: testo }, { quoted: m });
    const ctx = { sock, m, from, sender, target, reply, at, V, t0 };

    for (const b of BLOCCHI) {
      let ok = false;
      if (b.tipo === "comando" && low.startsWith(PREFIX)) { const primo = low.slice(PREFIX.length).split(/\s+/)[0]; if (b.nomi.includes(primo)) ok = true; }
      else if (b.tipo === "esatto" && low === b.testo) ok = true;
      else if (b.tipo === "contiene" && low.includes(b.testo)) ok = true;
      if (!ok) continue;
      if (b.soloGruppo &&!isGroup) { await reply('Solo nei gruppi.'); continue; }
      if (b.soloAdmin &&!isAdmin &&!isOwner) { await reply('Solo admin.'); continue; }
      if (b.soloOwner &&!isOwner) { await reply('Solo owner.'); continue; }
      await b.run(ctx);
      break;
    }
  } catch (e) { console.log('Errore messaggio:', e.message); }
}

/* ---------- AVVIO BOT FIXATO ---------- */
async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const sock = makeWASocket({ auth: state, logger: P({ level: 'silent' }), browser: ['Chrome','Chrome','1.0'] });
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) { console.log('QR GENERATO - Scansiona:'); qrcode.generate(qr, { small: true }); }
        if (!state.creds.registered) {
            try {
                await sleep(3000);
                const code = await sock.requestPairingCode(OWNER);
                console.log(`>>> CODICE PER ${OWNER}: ${code} <<<`);
            } catch(e) {}
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
            if (shouldReconnect) start(); else console.log('Logout - cancella cartella auth_info su Render');
        } else if (connection === 'open') {
            console.log('BOT CONNESSO! ✅');
        }
    });
    sock.ev.on('messages.upsert', async ({ messages }) => { for (const m of messages) await onMessage(sock, m); });
}
start();
