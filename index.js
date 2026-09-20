'use strict';

/**
 * ─────────────────────────────────────────────────────────────
 *  ██████╗  ██████╗ ████████╗██╗  ██╗██╗ ██████╗    ███╗   ███╗██████╗
 *  ██╔══██╗██╔═══██╗╚══██╔══╝██║  ██║██║██╔════╝    ████╗ ████║██╔══██╗
 *  ██║  ██║██║   ██║   ██║   ███████║██║██║         ██╔████╔██║██║  ██║
 *  ██║  ██║██║   ██║   ██║   ██╔══██║██║██║         ██║╚██╔╝██║██║  ██║
 *  ██████╔╝╚██████╔╝   ██║   ██║  ██║██║╚██████╗    ██║ ╚═╝ ██║██████╔╝
 *  ╚═════╝  ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚═╝ ╚═════╝    ╚═╝     ╚═╝╚═════╝
 *
 *  GOTHIC-MD  •  WhatsApp Multi-Device Bot
 *  Developed by KINGSLEY-XMD TECH
 *
 *  🔑  Get your Session ID from the GOTHIC MD SITE and paste it into
 *      settings.js (SESSION_ID field) — or set the SESSION_ID env var.
 * ─────────────────────────────────────────────────────────────
 */

const fs    = require('fs');
const path  = require('path');
const http  = require('http');
const P     = require('pino');
const chalk = require('chalk');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    jidNormalizedUser,
    Browsers,
} = require('@whiskeysockets/baileys');

const settings = require('./settings');
const { commands, antilinkGroups } = require('./commands');

/* ═══════════════════════════════════════════════════════════
 *  CONSTANTS
 * ═══════════════════════════════════════════════════════════ */

const logger      = P({ level: 'silent' });
const SESSION_DIR = path.join(__dirname, 'session');
const PORT        = process.env.PORT || 3000;
const START_TIME  = Date.now();

let prefix = settings.PREFIX;
let sock   = null;
let botNumber = 'unknown';

/* ═══════════════════════════════════════════════════════════
 *  CONSOLE LOGO
 * ═══════════════════════════════════════════════════════════ */

function printLogo() {
    const g1 = chalk.hex('#8A2BE2');
    const g2 = chalk.hex('#00FFFF');
    const g3 = chalk.hex('#FF00FF');
    const g4 = chalk.hex('#00FF88');

    console.log('');
    console.log(g1('  ╔══════════════════════════════════════════════════════╗'));
    console.log(g1('  ║') + g2('        ██████╗  ██████╗ ████████╗██╗  ██╗██╗ ██████╗ ') + g1('║'));
    console.log(g1('  ║') + g2('       ██╔════╝ ██╔═══██╗╚══██╔══╝██║  ██║██║██╔════╝ ') + g1('║'));
    console.log(g1('  ║') + g3('       ██║  ███╗██║   ██║   ██║   ███████║██║██║      ') + g1('║'));
    console.log(g1('  ║') + g3('       ██║   ██║██║   ██║   ██║   ██╔══██║██║██║      ') + g1('║'));
    console.log(g1('  ║') + g4('       ╚██████╔╝╚██████╔╝   ██║   ██║  ██║██║╚██████╗ ') + g1('║'));
    console.log(g1('  ║') + g4('        ╚═════╝  ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚═╝ ╚═════╝ ') + g1('║'));
    console.log(g1('  ╠══════════════════════════════════════════════════════╣'));
    console.log(g1('  ║') + chalk.bold.yellow('          🎭  GOTHIC-MD  •  KINGSLEY-XMD TECH  ⚡        ') + g1('║'));
    console.log(g1('  ╠══════════════════════════════════════════════════════╣'));
    console.log(g1('  ║') + chalk.white(`          Version : ${settings.BOT_VERSION.padEnd(34)}`) + g1('║'));
    console.log(g1('  ║') + chalk.white(`          Owner   : ${settings.OWNER_NAME.padEnd(34)}`) + g1('║'));
    console.log(g1('  ║') + chalk.white(`          Node    : ${process.version.padEnd(34)}`) + g1('║'));
    console.log(g1('  ║') + chalk.white(`          Port    : ${String(PORT).padEnd(34)}`) + g1('║'));
    console.log(g1('  ╚══════════════════════════════════════════════════════╝'));
    console.log('');
}

/* ═══════════════════════════════════════════════════════════
 *  KEEP-ALIVE HTTP SERVER (for Render / Koyeb / Heroku)
 * ═══════════════════════════════════════════════════════════ */

function startKeepAliveServer() {
    const server = http.createServer((req, res) => {
        const up = Math.floor((Date.now() - START_TIME) / 1000);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status   : 'online',
            bot      : settings.BOT_NAME,
            version  : settings.BOT_VERSION,
            developer: settings.OWNER_NAME,
            number   : botNumber,
            uptime   : `${Math.floor(up / 3600)}h ${Math.floor((up % 3600) / 60)}m ${up % 60}s`,
            memory   : `${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)} MB`,
            time     : new Date().toISOString(),
        }, null, 2));
    });

    server.listen(PORT, () => {
        console.log(chalk.green(`  ✅  Keep-alive server listening on port ${chalk.bold(PORT)}`));
        console.log(chalk.gray (`      → http://localhost:${PORT}/`));
    });

    server.on('error', (e) => {
        console.log(chalk.yellow(`  ⚠️  HTTP server error: ${e.message}`));
    });
}

/* ═══════════════════════════════════════════════════════════
 *  SESSION DECODER (GOTHIC MD SITE)
 * ═══════════════════════════════════════════════════════════ */

function ensureSessionDir() {
    if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
}

function writeSessionFromEnv() {
    const raw = (settings.SESSION_ID || '').trim();
    if (!raw) return false;

    let data = raw;
    for (const p of ['GOTHIC-MD~', 'GOTHIC~', 'Gothic~', 'gothic~', 'KINGSLEY~']) {
        if (data.startsWith(p)) { data = data.slice(p.length); break; }
    }

    const credsPath = path.join(SESSION_DIR, 'creds.json');

    // 1) Already JSON?
    if (data.trim().startsWith('{')) {
        fs.writeFileSync(credsPath, data);
        return true;
    }

    // 2) Base64 encoded creds.json?
    try {
        const decoded = Buffer.from(data, 'base64').toString('utf-8');
        if (decoded.trim().startsWith('{')) {
            fs.writeFileSync(credsPath, decoded);
            return true;
        }
    } catch (_) {}

    return false;
}

/* ═══════════════════════════════════════════════════════════
 *  MESSAGE HELPERS
 * ═══════════════════════════════════════════════════════════ */

function getBody(msg) {
    const m = msg.message;
    if (!m) return '';
    return (
        m.conversation ||
        m.extendedTextMessage?.text ||
        m.imageMessage?.caption ||
        m.videoMessage?.caption ||
        m.buttonsResponseMessage?.selectedButtonId ||
        m.listResponseMessage?.singleSelectReply?.selectedRowId ||
        ''
    );
}

function getMentions(msg) {
    const m = msg.message;
    const ctx = m?.extendedTextMessage?.contextInfo
             || m?.imageMessage?.contextInfo
             || m?.videoMessage?.contextInfo;
    return ctx?.mentionedJid || [];
}

function getQuotedSender(msg) {
    const m = msg.message;
    const ctx = m?.extendedTextMessage?.contextInfo
             || m?.imageMessage?.contextInfo
             || m?.videoMessage?.contextInfo;
    return ctx?.participant || null;
}

/* ═══════════════════════════════════════════════════════════
 *  BOT START
 * ═══════════════════════════════════════════════════════════ */

async function startBot() {
    ensureSessionDir();
    writeSessionFromEnv();

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version }          = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys : makeCacheableSignalKeyStore(state.keys, logger),
        },
        browser: Browsers.macOS('Chrome'),
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        markOnlineOnConnect: true,
    });

    /* ── Save credentials ─────────────────────── */
    sock.ev.on('creds.update', saveCreds);

    /* ── Connection lifecycle ─────────────────── */
    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {

        if (connection === 'connecting') {
            console.log(chalk.yellow('  🔄  Connecting to WhatsApp…'));
        }

        if (connection === 'open') {
            botNumber = jidNormalizedUser(sock.user.id).split('@')[0];

            console.log('');
            console.log(chalk.hex('#00FF88')('  ╔══════════════════════════════════════════════════╗'));
            console.log(chalk.hex('#00FF88')('  ║') + chalk.bold.green('     ✅  CONNECTED TO WHATSAPP SUCCESSFULLY!     ') + chalk.hex('#00FF88')('║'));
            console.log(chalk.hex('#00FF88')('  ╠══════════════════════════════════════════════════╣'));
            console.log(chalk.hex('#00FF88')('  ║') + chalk.white(`     📱  Bot Number : ${chalk.bold.yellow('+' + botNumber).padEnd(22)}`) + chalk.hex('#00FF88')('║'));
            console.log(chalk.hex('#00FF88')('  ║') + chalk.white(`     🤖  Bot Name   : ${chalk.bold.cyan(settings.BOT_NAME).padEnd(22)}`) + chalk.hex('#00FF88')('║'));
            console.log(chalk.hex('#00FF88')('  ║') + chalk.white(`     👑  Owner      : ${chalk.bold.magenta(settings.OWNER_NAME.slice(0, 18)).padEnd(22)}`) + chalk.hex('#00FF88')('║'));
            console.log(chalk.hex('#00FF88')('  ║') + chalk.white(`     🔣  Prefix     : ${chalk.bold.white(prefix).padEnd(22)}`) + chalk.hex('#00FF88')('║'));
            console.log(chalk.hex('#00FF88')('  ║') + chalk.white(`     🧩  Commands   : ${chalk.bold.white(String(Object.keys(commands).length)).padEnd(22)}`) + chalk.hex('#00FF88')('║'));
            console.log(chalk.hex('#00FF88')('  ║') + chalk.white(`     🌐  Mode       : ${chalk.bold.white(settings.MODE).padEnd(22)}`) + chalk.hex('#00FF88')('║'));
            console.log(chalk.hex('#00FF88')('  ╚══════════════════════════════════════════════════╝'));
            console.log('');
            console.log(chalk.gray(`  💬  Send ${chalk.bold.white(prefix + 'menu')} in any chat to open the command menu.`));
            console.log('');
        }

        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;

            if (code === DisconnectReason.loggedOut) {
                console.log('');
                console.log(chalk.red('  ❌  Logged out from WhatsApp.'));
                console.log(chalk.yellow('  →  Delete the /session folder and paste a fresh SESSION_ID from the GOTHIC MD SITE.'));
                process.exit(1);
            }

            console.log(chalk.yellow(`  ⚠️  Connection closed (code ${code}) — reconnecting in 3s…`));
            setTimeout(startBot, 3000);
        }
    });

    /* ── Anti-call ───────────────────────────── */
    sock.ev.on('call', async (calls) => {
        if (!settings.REJECT_CALLS) return;
        for (const c of calls) {
            if (c.status === 'offer') {
                try { await sock.rejectCall(c.id, c.from); } catch (_) {}
            }
        }
    });

    /* ── Group welcome ───────────────────────── */
    sock.ev.on('group-participants.update', async (ev) => {
        if (!settings.WELCOME_MSG) return;
        if (ev.action !== 'add') return;
        try {
            const meta = await sock.groupMetadata(ev.id);
            for (const p of ev.participants) {
                await sock.sendMessage(ev.id, {
                    text: `👋 Welcome @${p.split('@')[0]} to *${meta.subject}*!\n\nType *${prefix}menu* to see my commands. 🎭`,
                    mentions: [p],
                });
            }
        } catch (_) {}
    });

    /* ── Incoming messages → dispatch to commands.js ── */
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        for (const msg of messages) {
            try { await handleMessage(sock, msg); }
            catch (e) { console.error(chalk.red('  [handler] ' + e.message)); }
        }
    });

    return sock;
}

/* ═══════════════════════════════════════════════════════════
 *  MESSAGE HANDLER  (connects to commands.js)
 * ═══════════════════════════════════════════════════════════ */

async function handleMessage(sock, msg) {
    if (!msg.message) return;
    if (msg.key.fromMe) return;

    const jid      = msg.key.remoteJid;
    if (!jid) return;
    const isGroup  = jid.endsWith('@g.us');
    const sender   = isGroup ? msg.key.participant : jid;
    const pushName = msg.pushName || 'User';
    const body     = getBody(msg).trim();

    /* ── Antilink check ─────────────────────── */
    if (isGroup && antilinkGroups.has(jid)) {
        if (/chat\.whatsapp\.com|https?:\/\//i.test(body)) {
            const meta = await sock.groupMetadata(jid);
            const isAdmin = meta.participants.find(p => p.id === sender)?.admin;
            if (!isAdmin) {
                try {
                    await sock.sendMessage(jid, { delete: msg.key });
                    await sock.groupParticipantsUpdate(jid, [sender], 'remove');
                } catch (_) {}
                return;
            }
        }
    }

    /* ── Prefix check ───────────────────────── */
    if (!body.startsWith(prefix)) return;

    const args    = body.slice(prefix.length).trim().split(/\s+/);
    const cmdName = (args.shift() || '').toLowerCase();
    const command = commands[cmdName];

    if (!command) return;

    /* ── Private mode guard ─────────────────── */
    if (settings.MODE === 'private' && sender.split('@')[0] !== settings.OWNER_NUMBER) {
        return;
    }

    /* ── Group guard ────────────────────────── */
    if (command.group && !isGroup) {
        return sock.sendMessage(jid, { text: settings.MESSAGES.GROUP }, { quoted: msg });
    }

    /* ── Admin / bot-admin guards ───────────── */
    if ((command.admin || command.botAdmin) && isGroup) {
        const meta    = await sock.groupMetadata(jid);
        const me      = jidNormalizedUser(sock.user.id);
        const isAdmin = meta.participants.find(p => p.id === sender)?.admin;
        const botAdm  = meta.participants.find(p => p.id === me)?.admin;

        if (command.admin   && !isAdmin) return sock.sendMessage(jid, { text: settings.MESSAGES.ADMIN }, { quoted: msg });
        if (command.botAdmin && !botAdm) return sock.sendMessage(jid, { text: '🛡️ *Make me an admin first.*' }, { quoted: msg });
    }

    /* ── Owner guard ────────────────────────── */
    if (command.owner && sender.split('@')[0] !== settings.OWNER_NUMBER) {
        return sock.sendMessage(jid, { text: settings.MESSAGES.OWNER }, { quoted: msg });
    }

    /* ── Read + typing presence ─────────────── */
    if (settings.AUTO_READ)   await sock.readMessages([msg.key]).catch(() => {});
    if (settings.AUTO_TYPING) await sock.sendPresenceUpdate('composing', jid).catch(() => {});

    /* ── Build context & run the command ────── */
    const ctx = {
        sock, msg, jid, sender, pushName,
        args, body, command: cmdName, prefix,
        isGroup,
        mentioned    : getMentions(msg),
        quotedSender : getQuotedSender(msg),
        reply: (text) => sock.sendMessage(jid, { text }, { quoted: msg }),
        settings,
    };

    try {
        await command.handler(ctx);
    } catch (e) {
        console.error(chalk.red(`  [${cmdName}] ${e.message}`));
        await ctx.reply(settings.MESSAGES.ERROR);
    } finally {
        if (settings.AUTO_TYPING) await sock.sendPresenceUpdate('paused', jid).catch(() => {});
    }
}

/* ═══════════════════════════════════════════════════════════
 *  BOOTSTRAP
 * ═══════════════════════════════════════════════════════════ */

process.on('uncaughtException',  (e) => console.error(chalk.red('  [uncaught] '  + (e?.message || e))));
process.on('unhandledRejection', (e) => console.error(chalk.red('  [unhandled] ' + (e?.message || e))));

(async () => {
    printLogo();

    if (!settings.SESSION_ID || !settings.SESSION_ID.trim()) {
        console.log(chalk.red('  ❌  SESSION_ID is empty.\n'));
        console.log(chalk.yellow('     1. Get your session id from the GOTHIC MD SITE'));
        console.log(chalk.yellow('     2. Paste it into settings.js  (SESSION_ID field)'));
        console.log(chalk.yellow('     3. Or set the SESSION_ID environment variable on Render.\n'));
        process.exit(1);
    }

    startKeepAliveServer();

    console.log(chalk.cyan(`  🧩  Loaded ${chalk.bold(Object.keys(commands).length)} commands from commands.js`));
    console.log(chalk.gray (`      ${Object.keys(commands).join(', ')}\n`));

    await startBot();
})();
