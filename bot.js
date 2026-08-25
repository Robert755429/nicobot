/* =====================================================
 * nicobot — generato con Mazzu Builder
 * Libreria: @itsukichan/baileys - FIXATO COMPLETO
 * ===================================================== */

const fs = require("fs");
const PREFIX = '.';
const BOT = 'nicobot';
const OWNER = '393887347002';
const MONETA = 'schei';
const DB_FILE = './nicoschei.json';
const AVVIO = Date.now();

function db() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf8")); } catch (e) { return {}; }
}
function saveDB(d) { fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2)); }
function getSaldo(jid) { return db()[jid] || 0; }
function addSaldo(jid, n) {
  const d = db();
  d[jid] = Math.max(0, (d[jid] || 0) + n);
  saveDB(d);
  return d[jid];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const at = (jid) => "@" + String(jid).split("@")[0];
function uptime() {
  let s = Math.floor((Date.now() - AVVIO) / 1000);
  const h = Math.floor(s / 3600), mn = Math.floor((s % 3600) / 60);
  return h? h + "h " + mn + "m" : mn + "m " + (s % 60) + "s";
}
function calc(expr) {
  if (!/^[-+*/().\d\s%]+$/.test(expr || "")) return "espressione non valida";
  try {
    const r = Function("return (" + expr + ")")();
    return (typeof r === "number" && isFinite(r))? r : "espressione non valida";
  } catch (e) { return "espressione non valida"; }
}
function F(testo, V) {
  return String(testo == null? "" : testo).replace(/\{(\w+)\}/g, (x, k) => (V[k]!== undefined? V[k] : x));
}
function corpo(m) {
  const t = m.message || {};
  return t.conversation
    || (t.extendedTextMessage && t.extendedTextMessage.text)
    || (t.imageMessage && t.imageMessage.caption)
    || "";
}
function menzionati(m) {
  const e = m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo;
  if (e && e.mentionedJid && e.mentionedJid.length) return e.mentionedJid[0];
  if (e && e.participant) return e.participant;
  return null;
}

const { exec } = require("child_process");
const TMP = "./tmp";
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP);
function sh(cmd) {
  return new Promise((ok, ko) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 40, timeout: 120000 }, (e, so, se) => {
      if (e) ko(new Error((se || e.message).split("\n").slice(-3).join(" ").slice(0, 160)));
      else ok(so);
    });
  });
}
function pulisci(files) {
  for (const f of files) { try { fs.unlinkSync(f); } catch (e) {} }
}
const { downloadMediaMessage } = require('@itsukichan/baileys');
async function prendiMedia(m) {
  const ctx = m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo;
  const q = ctx && ctx.quotedMessage;
  const msg = q? { key: m.key, message: q } : m;
  const tipi = Object.keys(msg.message || {});
  const img = tipi.includes("imageMessage");
  const vid = tipi.includes("videoMessage");
  const stk = tipi.includes("stickerMessage");
  if (!img &&!vid &&!stk) return null;
  try {
    const buffer = await downloadMediaMessage(msg, "buffer", {});
    return { buffer, video: vid, sticker: stk, immagine: img };
  } catch (e) { return null; }
}

const GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno","luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
function makeV(extra) {
  const n = new Date();
  return Object.assign({
    user: "", id: "", tag: "", nome: "utente", chat: "",
    gruppo: "chat privata", descr: "", membri: 1,
    admin: "no", owner: "no", isgruppo: "no",
    saldo: 0, prefix: PREFIX, bot: BOT, moneta: MONETA,
    cmd: "", args: "", arg1: "", target: "nessuno",
    ora: n.toTimeString().slice(0, 5),
    giorno: GIORNI[n.getDay()], mese: MESI[n.getMonth()], anno: n.getFullYear(),
    random: Math.floor(Math.random() * 100) + 1,
    dado: Math.floor(Math.random() * 6) + 1,
    ping: 0, uptime: uptime(),
    ram: Math.round(process.memoryUsage().rss / 1048576) + "MB",
    node: process.version,
    totcmd: BLOCCHI.filter((b) => b.tipo === "comando").length,
    risultato: ""
  }, extra || {});
}

const BLOCCHI = [
  { tipo: 'comando', desc: 'Lista dei comandi', nomi: ['menu', 'help', 'comandi', 'm'], async run(ctx) { const { reply, V } = ctx; let testo = F('╭─ *NICOBOT* ─────\n│ {tot
