#!/usr/bin/env node
'use strict';

/**
 * yunserver-bulk-apikey CLI — mint yunserver.cn API keys, one account per key.
 *
 * Zero dependencies (Node builtins + `curl` as the proxied transport) and **no
 * browser**: this panel is a new-api fork with `turnstile_check: false`, so the
 * whole gate is e-mail + password + a 6-character code from the mailbox. Your
 * proxy list is OPTIONAL: pass `--pool` (or `DDDDAI_POOL`); without one the tool
 * connects directly.
 *
 * Flow, per account, every panel call over one exit:
 *   1. mailbox  Emailnator plain `@gmail.com` (the panel refuses dots / `+`),
 *               broker inboxes behind it as a fallback rail
 *   2. code     `GET /api/verification?email=…` → 6-char code in the inbox
 *   3. register `POST /api/user/register` {username,password,email,verification_code}
 *   4. login    `POST /api/user/login` → access_token, then `New-Api-User: <id>`
 *   5. key      `POST /api/token/` {group} then `POST /api/token/<id>/key`
 *   6. gate     `POST /v1/chat/completions` → 200 with real content = keep
 *               (a closed group is answered `No available channel … under group`;
 *               the token is re-bound to another group from `/api/pricing` and
 *               the gate is retried before the account is given up on)
 *
 * A key reaches `keys.txt` only after step 6 answers 200 — anything else is
 * recorded in `accounts.json` and retried on the next run.
 *
 * Usage:
 *   node src/cli.js --count 5                 # five verified keys
 *   node src/cli.js --verify-only             # re-prove every key in keys.txt
 *   node src/cli.js --screen                  # vet the exit list against the panel
 *   node src/cli.js --connect-9router         # register the keys with a local 9Router
 */

// Captcha-wall classifier (walls are named in the account record; a rail is used only
// if the operator wired one — see ADVANCED.md).
const solver = require('./solver.js');
require('dns').setDefaultResultOrder('ipv4first');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const crypto = require('crypto');

const IS_SRC = path.basename(__dirname) === 'src';
const ROOT = IS_SRC ? path.resolve(__dirname, '..') : __dirname;
const KEYS_FILE = path.join(ROOT, 'keys.txt');
const ACCOUNTS_FILE = path.join(ROOT, 'accounts.json');
const OUT_DIR = path.join(ROOT, 'out');

// --------------------------------------------------------------- provider
const BASE = 'https://api.yunserver.cn';
const HOST = 'api.yunserver.cn';
const ENV = 'YUNSERVER_PROXIES';
const BRAND = /yunserver/i;                 // sender / subject fence for the code mail
// Measured on the sibling dddai panel (same fork family) and kept alongside the
// panel's own domain: the code mail arrives from the shared template relay.
const SENDER = /@(yunserver\.(cn|com)|email\.cheliz\.ai)$/i;   // the panel's own relay domain
const DEFAULT_GROUP = 'default';       // `default` answers "No available channel…"
const GROUP_TRY = ['default', 'deepseek'];
const PROMPT = 'Reply with the single word: pong';
// Two-prompt sanity + a function-calling round: a key reaches keys.txt only when
// the panel answers 200, the second answer differs from the first, and the model
// emits the `get_time` tool call (mirrors the fleet's pre-add gate).
const PROMPT2 = 'Name three colours, comma separated.';
const TOOLS = [{ type: 'function', function: { name: 'get_time', description: 'Returns the current time', parameters: { type: 'object', properties: {} } } }];
const MODEL_PREFS = [/deepseek-v4\.1-flash/i, /deepseek/i, /flash|mini|nano|turbo|free/i];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36';
const EMAILNATOR = 'https://www.emailnator.com';
const BROKER = 'http://127.0.0.1:9700';

// ------------------------------------------------------------------- options
const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const has = (n) => argv.includes(`--${n}`);

const HELP = `${path.basename(ROOT)}-bulk-apikey — mint keys for ${HOST} (one account per key, every key chat-verified)

  --count N        accounts to mint (default 1)
  --pool FILE      exit list, one proxy per line (env ${ENV}; without one the tool runs direct)
  --proxy URL      pin a single exit for the panel calls
  --exits K        exit candidates tried per key (default 6)
  --model ID       model used for the live gate (default: cheapest chat model)
  --group NAME     token group (default ${DEFAULT_GROUP})
  --inbox CHAIN    mailbox rail order (default emailnator,temptf,broker)
  --broker URL     inbox broker base (default ${BROKER})
  --verify-only    re-prove every key in keys.txt, mint nothing
  --screen         test the exit list against the panel
  --connect-9router  register the keys with a local 9Router (src/connect-9router.js)
  --help           this text

Env: YUNSERVER_MODEL, ${ENV}`;
if (has('help') || argv.length === 0) { console.log(HELP); process.exit(0); }

const COUNT = Math.max(1, parseInt(arg('count', '1'), 10) || 1);
const MODEL = arg('model', process.env.YUNSERVER_MODEL || '');
const TRIES = Math.max(1, parseInt(arg('exits', '6'), 10) || 6);
const GROUP = arg('group', DEFAULT_GROUP);
const VERIFY_ONLY = has('verify-only');
const SCREEN = has('screen');
const CONNECT = has('connect-9router');
const POOL_ARG = arg('pool', process.env[ENV] || '');
const FIXED = arg('proxy', '');
const BROKER_URL = arg('broker', BROKER);
const INBOX = arg('inbox', 'emailnator,temptf,broker').split(',').map((s) => s.trim()).filter(Boolean);
const CODE_WAIT_MS = Math.max(30000, (parseInt(arg('code-timeout', '240'), 10) || 240) * 1000);

fs.mkdirSync(OUT_DIR, { recursive: true });
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randUser = () => 'ys' + crypto.randomBytes(3).toString('hex');
const randPass = () => `Ys${crypto.randomBytes(4).toString('hex')}${10 + Math.floor(Math.random() * 89)}!x`;

// --------------------------------------------------------------------- exits
const proxyOf = (line) => {
  const s = String(line).trim().split(/\s+/)[0];
  return /^(socks4|socks5|https?):\/\//i.test(s) ? s : null;
};
const POOL_FILE = FIXED ? '' : POOL_ARG || (fs.existsSync(path.join(ROOT, 'proxies.txt')) ? path.join(ROOT, 'proxies.txt') : '');
function readPool() {
  if (FIXED) return [proxyOf(FIXED)].filter(Boolean);
  if (!POOL_FILE || !fs.existsSync(POOL_FILE)) return [];
  return [...new Set(fs.readFileSync(POOL_FILE, 'utf8').split(/\r?\n/).map(proxyOf).filter(Boolean))];
}
let exits = readPool();
let cursor = 0;
let poolStamp = Date.now();
// Free exits live minutes, so the pool file is refreshed by an external screener
// while a mint runs and the list is re-read as it moves — a dying exit is then
// replaced instead of being retried forever.
function nextExit() {
  if (!FIXED && POOL_FILE && Date.now() - poolStamp > 60000) {
    poolStamp = Date.now();
    try {
      const fresh = readPool();
      if (fresh.length) { exits = fresh; cursor = 0; }
    } catch (e) { /* keep the old list */ }
  }
  return exits.length ? exits[cursor++ % exits.length] : null;
}
const exitLabel = (e) => e || '(direct)';

/** Transport: curl, one process per call, `windowsHide` so a mint never flashes a
 *  console. The process-free rewrite (Node https + the shared proxy tunnel) is the next
 *  step for the fleet rule, but it is an async cut through every caller and was left out
 *  rather than land half-done (2026-10-23). */
function curl(url, { method = 'GET', headers = {}, body = null, exit = null, jar = null, timeoutMs = 30000, origin = BASE } = {}) {
  const a = ['-sS', '-m', String(Math.round(timeoutMs / 1000)), '-A', UA, '-H', 'accept: application/json', '-H', `Origin: ${origin}`, '-H', `Referer: ${origin}/`];
  if (exit) {
    if (exit.startsWith('socks5')) a.push('--socks5-hostname', exit.split('//')[1]);
    else if (exit.startsWith('socks4')) a.push('--socks4a', exit.split('//')[1]);
    else a.push('-x', exit);
  }
  if (jar) a.push('-b', jar, '-c', jar);
  for (const [k, v] of Object.entries(headers)) a.push('-H', `${k}: ${v}`);
  if (body !== null) a.push('-X', method, '-H', 'content-type: application/json', '--data-binary', JSON.stringify(body));
  a.push('-w', '\n__HTTP__%{http_code}', url);
  const r = spawnSync('curl', a, { encoding: 'utf8', timeout: timeoutMs + 12000, maxBuffer: 16 * 1024 * 1024, windowsHide: true });
  const raw = r.stdout || '';
  const i = raw.lastIndexOf('__HTTP__');
  const status = i >= 0 ? parseInt(raw.slice(i + 8).trim(), 10) || 0 : 0;
  const text = i >= 0 ? raw.slice(0, i) : raw;
  let json = null;
  try { json = JSON.parse(text); } catch (e) { /* html/empty */ }
  return { status, json, text };
}
const msg = (r) => (r.json && (r.json.message || r.json.error)) || String(r.text || '').slice(0, 160);

// ---------------------------------------------------------------------- mail
// Rails in order: Emailnator (a plain @gmail.com — the only family this class of
// account), Emailnator (a plain @gmail.com), the local inbox broker. A panel
// that enforces an e-mail domain whitelist refuses the broker's disposable
// domains, so the Microsoft and Gmail rails come first — and every rail call
// rides the same exit pool as the panel calls, because it is our own address
// that gets throttled.
const TEMPTF = 'https://temp.tf';

const CODE_RE = /(?:verification code is:?|code|verification|验证码)[^0-9a-z]{1,24}(?=[0-9a-z]*\d)([0-9a-z]{4,8})(?![0-9a-z])/i;
// A code token must carry a digit: a shared inbox is full of prose, and the bare
// [0-9a-z]{4,8} shape once matched the word "Verify" out of the panel's own subject.
const ANY_CODE_RE = /\b(?=[0-9a-z]*\d)([0-9a-z]{4,8})\b/i;

/** A rail request; a dying free exit is retried, never fatal. */
function railCall(url, { method = 'GET', body = null, timeoutMs = 20000, origin = null } = {}) {
  for (let i = 0; i < 4; i++) {
    const r = curl(url, { method, body, exit: nextExit(), timeoutMs, origin: origin || BASE });
    if (r.status && r.json === null && /content|message/.test(url)) continue; // body came back unreadable (truncated)
    if (r.status !== 0) return r;
  }
  return { status: 0, json: null, text: 'unreachable on every exit' };
}

function json_https(pathname, { method = 'GET', body = null } = {}) {
  const r = railCall(EMAILNATOR + pathname, { method, body, origin: EMAILNATOR });
  return { status: r.status, json: r.json, text: r.text };
}

/** One address from the rail chain; returns { address, kind, box }. */
async function newMailbox() {
  for (const kind of INBOX) {
    if (kind === 'temptf') {
      const r = await railCall(`${TEMPTF}/api/account?providers=outlook,hotmail&dot=0&plus=1`);
      const a = r.json && r.json.email;
      if (a && /@/.test(String(a))) return { address: String(a).trim(), kind, box: {} };
      continue;
    }
    if (kind === 'emailnator') {
      const deadline = Date.now() + 180000;
      while (Date.now() < deadline) {
        for (const ids of [[3], [2], [3, 2]]) {
          const r = await json_https('/api/generate-email', { method: 'POST', body: { ids } });
          const dotted = r.json && r.json.email;
          if (dotted && /@gmail\.com$/i.test(dotted)) {
            const [local, domain] = dotted.split('@');
            const plain = `${local.replace(/\./g, '')}@${domain}`;
            return { address: plain, kind, box: { dotted, plain } };
          }
        }
        await sleep(8000);
      }
      continue;
    }
    if (kind === 'broker') {
      const r = await brokerHttp('/create', { method: 'POST', body: { folder: `${path.basename(ROOT)}-bulk`, tag: path.basename(ROOT).slice(0, 8) } });
      if (r.json && r.json.address) return { address: r.json.address, kind, box: r.json };
    }
  }
  throw new Error('no mailbox from rail: ' + INBOX.join(','));
}

/** Normalised inbox: `{ id, from, subject, text }`. */
async function inbox(mb) {
  try {
    if (mb.kind === 'temptf') {
      const r = await railCall(`${TEMPTF}/api/check`, { method: 'POST', body: { email: mb.address, wait: false } });
      const list = r.json && (Array.isArray(r.json) ? r.json : r.json.data || r.json.messages);
      return (Array.isArray(list) ? list : []).map((m, i) => ({
        id: String(m.id || m.messageId || i),
        from: String(m.from || m.sender || ''),
        subject: String(m.subject || m.title || ''),
        text: String(m.text || m.textBody || m.plain || m.body || m.html || m.htmlBody || '').replace(/<[^>]+>/g, ' '),
      }));
    }
    if (mb.kind === 'emailnator') {
      // Only heads here: the body is one more request per message, and most of a
      // shared public inbox is other people's mail (fetched lazily in waitForCode).
      // The list is keyed by the exact address form: the panel mails the dot-stripped
      // address, so mail to it is invisible under the dotted query and vice versa
      // (measured 2026-10-23). Both forms are queried and merged.
      const forms = [...new Set([mb.box.dotted, mb.box.plain, mb.address].filter(Boolean))];
      const out = [];
      const ids = new Set();
      for (const f of forms) {
        const r = await json_https('/api/message-list', { method: 'POST', body: { email: f, limit: 20 } });
        for (const m of ((r.json && r.json.messages) || [])) {
          const id = String(m.id);
          if (!id || ids.has(id)) continue;
          ids.add(id);
          out.push({ id, from: m.from, subject: m.subject });
        }
      }
      return out;
    }
    const r = await brokerHttp(`/list?token=${encodeURIComponent(mb.box.token || '')}`);
    return ((r.json && r.json.messages) || []).map((m) => ({ id: String(m.id), from: m.from, subject: m.subject, text: `${m.text || ''} ${m.html || ''}` }));
  } catch (e) {
    return [];
  }
}

async function inboxIds(mb) {
  return (await inbox(mb)).map((m) => m.id);
}

async function waitForCode(mb, { timeoutMs = CODE_WAIT_MS, pre = [] } = {}) {
  const started = Date.now();
  const deadline = started + timeoutMs;
  // A shared inbox already holds other people's mail: only messages that land
  // AFTER the code request may carry the panel's code (measured: the first run
  // picked a freedns activation mail out of a stale box).
  const seen = new Set(pre);
  // The loose fallback only opens for a PRIVATE box, and only after the panel's own
  // mail has had a fair run. On the shared emailnator pool it must stay shut: a
  // "QuickConnect 441707" / "Verificar la Dirección…" message was read as our code
  // and register answered "Verification code is incorrect or has expired"
  // (measured 2026-10-23, 2 accounts burned) — a no-mail miss is cheaper.
  const looseAt = mb.kind === 'emailnator' ? Number.POSITIVE_INFINITY : started + Math.min(Math.round(timeoutMs / 2), 120000);
  while (Date.now() < deadline) {
    const msgs = await inbox(mb);
    const passes = Date.now() >= looseAt ? [1, 2] : [1];
    for (const pass of passes) {
      for (const m of msgs) {
        if (seen.has(m.id)) continue;
        const hay = `${m.from || ''} ${m.subject || ''}`;
        const brandish = BRAND.test(hay) || SENDER.test(String(m.from || ''));
        const codeish = brandish || /verif|code|注册|验证|confirm|activ|安全/i.test(hay);
        if (pass === 1 && !brandish) continue;
        let raw = m.text;
        if (raw === undefined && mb.kind === 'emailnator') {
          const full = await json_https(`/api/message/${encodeURIComponent(m.id)}`);
          raw = String((full.json && full.json.content) || '');
        }
        const text = String(raw || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;?/g, ' ').replace(/\s+/g, ' ');
        // The panel ships `<p>Your verification code</p><p>284284</p>`; the phrase
        // first, then a bare 6-digit token only inside a code-ish message.
        const code =
          ((text.match(CODE_RE) || [])[1]) ||
          ((pass === 2 && codeish) ? (text.match(/\b(\d{6})\b/) || [])[1] : null) ||
          ((pass === 2 && codeish) ? (text.match(ANY_CODE_RE) || [])[1] : null);
        // Pass 1 is sender-pinned; pass 2 only ever sees a message that ALREADY
        // looks like a verification mail, because a shared inbox is full of other
        // people's codes (measured: \"Do not share: 3297\", \"Seedance⋯Sign-In Code\").
        if (code && !/\d/.test(code)) continue;
        if (code) return { code, subject: m.subject, from: m.from };
      }
    }
    for (const m of msgs) seen.add(m.id);
    await sleep(5000);
  }
  return { code: null };
}

// ---------------------------------------------------------------------- keys
const readKeys = () => (fs.existsSync(KEYS_FILE) ? fs.readFileSync(KEYS_FILE, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith('#')) : []);
function appendKey(key) {
  if (readKeys().includes(key)) return false;
  fs.appendFileSync(KEYS_FILE, (fs.existsSync(KEYS_FILE) && fs.statSync(KEYS_FILE).size ? '\n' : '') + key + '\n');
  return true;
}
function appendAccount(rec) {
  const all = (() => { try { const j = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8')); return Array.isArray(j) ? j : []; } catch (e) { return []; } })();
  all.push(rec);
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(all, null, 1) + '\n');
}
const DAY = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const MINT_JSONL = path.join(OUT_DIR, `mint-100-${path.basename(ROOT)}-${DAY}.jsonl`);
const DEAD_FILE = path.join(ROOT, 'keys-dead.txt');
/** A minted-but-dead key keeps its class (401/403/quota/ban/429 or a gate miss). */
function deadClass(p) {
  if (!p) return 'unverified';
  const s = p.chat && p.chat.status;
  if (s === 401) return '401';
  if (s === 403) return '403';
  if (s === 429) return '429';
  if (s === 402) return 'quota';
  if (p.sanity && (!p.sanity.live || !p.sanity.different)) return 'sanity-fail';
  if (p.tools && !p.tools.present) return 'tools-fail';
  if (!s) return 'transport';
  return 'unverified';
}
function appendDead(key, cls) {
  const old = fs.existsSync(DEAD_FILE) ? fs.readFileSync(DEAD_FILE, 'utf8') : '';
  if (old.includes(key)) return;
  fs.appendFileSync(DEAD_FILE, (old && !old.endsWith('\n') ? '\n' : '') + `${key}\t# ${cls}` + '\n');
}
/** One evidence row per account, whatever the outcome. */
function rowOf(rec) {
  const key = rec.apiKey;
  const p = rec.proof;
  return {
    at: rec.at, n: rec.n, email: rec.email, mailbox: rec.mailbox || '?', exit: rec.exit,
    code: rec.steps && rec.steps.mail ? rec.steps.mail.code || null : null,
    register: rec.steps && rec.steps.register ? rec.steps.register.status : null,
    self: rec.self || null, group: rec.group || null,
    key: key ? key.slice(0, 8) + '…' : null,
    proof: p ? {
      models: p.models, chat: { model: p.chat.model, status: p.chat.status, content: String(p.chat.content || '').slice(0, 60) },
      sanity: p.sanity ? { status: p.sanity.status, different: p.sanity.different, content: String(p.sanity.content || '').slice(0, 60) } : null,
      tools: p.tools || null, exit: p.exit, live: !!p.live,
    } : null,
    verdict: rec.verdict, deadClass: rec.verdict === 'minted' ? null : deadClass(p),
  };
}
function finish(rec) {
  appendAccount(rec);
  fs.appendFileSync(MINT_JSONL, JSON.stringify(rowOf(rec)) + '\n');
  return rec;
}

// ---------------------------------------------------------------------- proof
function listModels(key, exit) {
  const r = curl(`${BASE}/v1/models`, { headers: { authorization: `Bearer ${key}` }, exit });
  const ids = (r.json && (r.json.data || r.json.models)) || [];
  return { status: r.status, ids: ids.map((m) => (typeof m === 'string' ? m : m.id)).filter(Boolean), text: r.text };
}

function pickModels(ids) {
  if (MODEL) return [MODEL];
  const usable = ids.filter((id) => id && !/embed|rerank|whisper|tts|image|audio|video|vision|bge/i.test(id));
  const out = [];
  for (const re of MODEL_PREFS) for (const id of usable) if (re.test(id) && !out.includes(id)) out.push(id);
  for (const id of usable) if (!out.includes(id)) out.push(id);
  return out.slice(0, 4);
}

/** One chat call; returns content, any tool-call names, and the raw status. */
function chatCall(key, model, exit, group, body) {
  if (!model) return { status: 0, content: null, names: [], live: false, text: 'no model id' };
  const r = curl(`${BASE}/v1/chat/completions`, {
    method: 'POST', exit, headers: { authorization: `Bearer ${key}`, 'x-group': group || '' },
    body: { model, max_tokens: 256, stream: false, ...body },
  });
  const m0 = r.json && r.json.choices && r.json.choices[0] && r.json.choices[0].message;
  const content = (m0 && (m0.content || m0.reasoning_content || m0.reasoning)) || null;
  const names = ((m0 && m0.tool_calls) || []).map((x) => x && x.function && x.function.name).filter(Boolean);
  return { status: r.status, content, names, live: r.status === 200 && !!content, text: String(r.text || '').slice(0, 200) };
}
const chatGate = (key, model, exit, group) => chatCall(key, model, exit, group, { messages: [{ role: 'user', content: PROMPT }], max_tokens: 64 });

function prove(key, group) {
  // 6 exits is plenty to prove a key; the whole pool made a dead key burn every
  // exit at ~10 s per models call.
  const attempts = Math.min(Math.max(exits.length, 3), 6);
  let last = null;
  for (let i = 0; i < attempts; i++) {
    const exit = nextExit();
    const models = listModels(key, exit);
    if (models.status !== 200) { last = { models: { status: models.status, count: 0 }, chat: { model: null, status: 0, content: null, live: false, text: 'models unreachable' }, exit, live: false }; continue; }
    for (const model of pickModels(models.ids)) {
      const p1 = chatGate(key, model, exit, group);
      const res = { models: { status: models.status, count: models.ids.length }, chat: { model, ...p1 }, exit, live: false };
      if (!p1.live) { last = res; if (p1.status === 200) return res; continue; }
      const s = chatCall(key, model, exit, group, { messages: [{ role: 'user', content: PROMPT2 }], max_tokens: 64 });
      res.sanity = { status: s.status, content: s.content, different: !!s.content && String(s.content).trim().toLowerCase() !== String(p1.content).trim().toLowerCase(), live: s.live };
      const t = chatCall(key, model, exit, group, { messages: [{ role: 'user', content: 'What time is it right now? Use the get_time tool.' }], tools: TOOLS, tool_choice: 'auto' });
      res.tools = { status: t.status, present: t.names.length > 0, names: t.names };
      res.live = res.sanity.live && res.sanity.different && res.tools.present;
      return res;
    }
  }
  return last || { models: { status: 0, count: 0 }, chat: { model: null, status: 0, content: null, live: false, text: 'relay unreachable' }, exit: null, live: false };
}

// ----------------------------------------------------------------------- mint
async function mintOne(n) {
  let exit = nextExit();
  const jar = path.join(os.tmpdir(), `yunserver-jar-${crypto.randomBytes(4).toString('hex')}.txt`);
  const username = randUser();
  const password = randPass();
  const rec = { at: new Date().toISOString(), n, username, password, exit: exitLabel(exit), steps: {} };
  log(`#${n} user=${username} exit=${exitLabel(exit)}`);

  // Free exits die between calls; a step that dies on the transport gets the next exit.
  const call = (p, opts = {}) => {
    for (let i = 0; i < 4; i++) {
      const r = curl(BASE + p, { ...opts, exit, jar, timeoutMs: opts.timeoutMs || 20000 });
      if (r.status !== 0) return r;
      exit = nextExit();
    }
    return { status: 0, json: null, text: 'transport failed on every exit' };
  };

  // Emailnator is a shared pool: an address is regularly already registered on the
  // panel ("Email address is already in use"), so a fresh box is pulled instead of
  // giving the account up (measured 2026-10-23: 2 of 8 attempts died this way).
  let mb = null;
  let email = null;
  let pre = [];
  let send = null;
  for (let attempt = 1; attempt <= 5; attempt++) {
    mb = await newMailbox();
    email = mb.address;
    pre = await inboxIds(mb);
    send = call(`/api/verification?email=${encodeURIComponent(email)}`);
    rec.steps[`sendCode@${attempt}`] = { status: send.status, email, body: msg(send) };
    log(`  send-code@${attempt} ${email} (${mb.kind}) → ${send.status} ${msg(send)}`);
    if (send.json && send.json.success) break;
    if (!/already|已被|已经被/i.test(String(msg(send)))) break;
  }
  rec.email = email;
  rec.mailbox = mb.kind;
  rec.steps.sendCode = { status: send.status, body: msg(send) };
  if (!(send.json && send.json.success)) { rec.verdict = 'send-code-failed'; rec.captcha = solver.classify(msg(send)); return finish(rec); }
  const mail = await waitForCode(mb, { pre });
  rec.steps.mail = { code: mail.code, subject: mail.subject || null, from: mail.from || null };
  log(`  code ${mail.code || 'NONE'} «${String(mail.subject || '').slice(0, 50)}»`);
  if (!mail.code) { rec.verdict = 'no-mail'; return finish(rec); }

  const reg = call('/api/user/register', {
    method: 'POST',
    body: { username, password, password2: password, email, verification_code: String(mail.code), aff_code: '' },
  });
  rec.steps.register = { status: reg.status, body: msg(reg) };
  log(`  register → ${reg.status} ${msg(reg)}`);
  if (!(reg.json && reg.json.success)) { rec.verdict = 'register-failed'; return finish(rec); }

  let auth = (reg.json.data && reg.json.data.access_token) || null;
  if (!auth) {
    const li = call('/api/user/login', { method: 'POST', body: { username, password } });
    rec.steps.login = { status: li.status, body: msg(li) };
    log(`  login → ${li.status} ${msg(li)}`);
    auth = (li.json && li.json.data && li.json.data.access_token) || null;
  }
  let uid = null;
  const authed = (p, opts = {}) => call(p, { ...opts, headers: { ...(auth ? { authorization: `Bearer ${auth}` } : {}), ...(uid ? { 'New-Api-User': String(uid) } : {}), ...(opts.headers || {}) } });

  const self = authed('/api/user/self');
  if (self.json && self.json.data && self.json.data.id) uid = self.json.data.id;
  rec.self = self.json && self.json.data ? { id: self.json.data.id, quota: self.json.data.quota, group: self.json.data.group } : null;
  log(`  self → ${self.status} uid=${uid || '?'} quota=${rec.self ? rec.self.quota : '?'}`);

  const ci = authed('/api/user/checkin', { method: 'POST', body: {} });
  rec.steps.checkin = { status: ci.status, body: String(ci.text).slice(0, 200) };
  log(`  checkin → ${ci.status} ${String(ci.text).slice(0, 110)}`);

  // token group: try the configured group, then any other group the panel lists
  const pricing = authed('/api/pricing');
  const groupRatio = (pricing.json && pricing.json.data && pricing.json.data.group_ratio) || (pricing.json && pricing.json.group_ratio) || {};
  const groups = [...new Set([GROUP, ...GROUP_TRY, ...Object.keys(groupRatio)])].filter(Boolean);
  rec.groups = groups.slice(0, 8);

  let key = null;
  let tokenId = null;
  let usedGroup = groups[0];
  for (const group of groups) {
    const created = authed('/api/token/', { method: 'POST', body: { name: `ys${Date.now().toString(36)}`, remain_quota: 0, expired_time: -1, unlimited_quota: true, model_limits_enabled: false, model_limits: '', allow_ips: '', group } });
    const list = authed('/api/token/?p=0&size=100');
    const items = (list.json && list.json.data && (list.json.data.items || list.json.data)) || [];
    const item = items.find((t) => t && t.name && String(t.name).startsWith('ys')) || items[0];
    rec.steps[`createToken@${group}`] = { status: created.status, body: msg(created), tokenId: item && item.id };
    if (!item || !item.id) { log(`  token@${group} → ${created.status} ${msg(created)} (no token id)`); continue; }
    const kk = authed(`/api/token/${item.id}/key`, { method: 'POST', body: {} });
    const k2 = kk.json && kk.json.data && (kk.json.data.key || kk.json.data);
    rec.steps.tokenKey = { status: kk.status, body: String(kk.text).slice(0, 160) };
    const cand = typeof k2 === 'string' && !k2.includes('*') ? k2 : (item.key && !String(item.key).includes('*') ? item.key : null);
    if (!cand) { log(`  token@${group} → key NONE`); continue; }
    tokenId = item.id;
    usedGroup = item.group || group;
    const proof = prove(cand, usedGroup);
    rec.proof = proof;
    log(`  gate@${usedGroup}: models=${proof.models.status}(${proof.models.count}) chat[${proof.chat.model}]=${proof.chat.status} sanity=${proof.sanity ? (proof.sanity.different ? 'farklı' : 'aynı/boş') : '-'} tools=${proof.tools ? (proof.tools.present ? proof.tools.names.join('+') : 'yok') : '-'} ${proof.live ? '✔ LIVE' : '✖ ' + String(proof.chat.text || '').slice(0, 90)}`);
    if (proof.live || proof.chat.status === 200) { key = cand; break; }
    // a closed group is the only reason to keep the token and re-bind it
    if (!/group|分组|channel|模型/i.test(String(proof.chat.text || ''))) { key = cand; break; }
  }

  rec.apiKey = key;
  rec.group = usedGroup;
  rec.tokenId = tokenId;
  log(`  key ${key ? key.slice(0, 12) + '…' : 'NONE'} (group ${usedGroup})`);
  if (key && rec.proof && rec.proof.live) {
    rec.verdict = 'minted';
    appendKey(key);
  } else if (key) {
    rec.verdict = 'key-unverified';
    appendDead(key, deadClass(rec.proof));
  } else {
    rec.verdict = 'no-key';
  }
  return finish(rec);
}

// --------------------------------------------------------------------- modes
function screen() {
  if (!exits.length) {
    const r = curl(`${BASE}/api/status`);
    log(`(direct) /api/status=${r.status} ${r.status === 200 ? 'OK' : 'DEAD'}`);
    return;
  }
  let ok = 0;
  for (const e of exits) {
    const r = curl(`${BASE}/api/status`, { exit: e, timeoutMs: 15000 });
    const live = r.status === 200 && !!r.json && !!r.json.data;
    if (live) ok++;
    log(`${exitLabel(e).padEnd(34)} status=${r.status} ${live ? 'OK' : 'DEAD'}`);
  }
  log(`${ok}/${exits.length} exits answered`);
}

function verifyOnly() {
  const keys = readKeys();
  if (!keys.length) return log(`no keys in ${KEYS_FILE}`);
  let live = 0;
  for (const key of keys) {
    const p = prove(key);
    if (p.live) live++;
    log(`${key.slice(0, 10)}… models=${p.models.status}(${p.models.count}) chat[${p.chat.model}]=${p.chat.status} ${JSON.stringify(String(p.chat.content || '').slice(0, 20))} ${p.live ? 'LIVE' : 'DEAD'}`);
  }
  log(`live: ${live}/${keys.length}`);
}

function connect9router() {
  const script = path.join(__dirname, 'connect-9router.js');
  if (!fs.existsSync(script)) { log(`connect-9router.js not found next to this CLI (expected ${script})`); return; }
  const args = [script];
  for (const n of ['base', 'password', 'name', 'prefix', 'base-url', 'model']) { const v = arg(n, ''); if (v) args.push(`--${n}`, v); }
  log(`9Router → node ${path.basename(script)} ${args.slice(1).join(' ')}`);
  const r = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (r.status !== 0) log(`connect-9router exited ${r.status}`);
}

(async () => {
  if (SCREEN) return screen();
  if (VERIFY_ONLY) return verifyOnly();
  if (CONNECT) return connect9router();
  log(`${path.basename(ROOT)} mint · ${COUNT} account(s) · ${exits.length ? `${exits.length} exits` : 'DIRECT (no proxy)'} · mail ${INBOX.join('>')}`);
  let minted = 0;
  for (let i = 1; i <= COUNT; i++) {
    try {
      const rec = await mintOne(i);
      if (rec.verdict === 'minted') minted++;
    } catch (e) {
      log(`  ✖ ${String(e.message).slice(0, 160)}`);
    }
    await sleep(1000);
  }
  log(`done: ${minted}/${COUNT} keys minted · keys.txt → ${KEYS_FILE}`);
})().catch((e) => { console.error('FATAL', e && e.message ? e.message : e); process.exit(1); });
