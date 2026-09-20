'use strict';

/**
 * ─────────────────────────────────────────────────────────────
 *  GOTHIC-MD  •  WhatsApp Multi-Device Bot
 *  Developed by KINGSLEY-XMD TECH
 *
 *  🔑  Get your Session ID from the GOTHIC MD SITE and paste it
 *      into settings.js (or the SESSION_ID env var on Render).
 * ─────────────────────────────────────────────────────────────
 */

const fs      = require('fs');
const path    = require('path');
const P       = require('pino');
const chalk   = require('chalk');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    jidNormalizedUser,
} = require('@whiskeysockets/baileys');

const settings = require('./settings');
const { commands, antilinkGroups } = require('./commands');

const logger     = P({ level: 'silent' });
const SESSION_DIR = path.join(__dirname, 'session');

/* ═══════════════════════════════════════════════════════════
 *  SESSION HANDLING
 * ═══════════════════════════════════════════════════════════ */

function ensureSessionDir() {
    if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });
}

/** Decode the GOTHIC MD SITE session id (base64 → creds.json) */
function writeSessionFromEnv() {
    const raw = (settings.SESSION_ID || '').trim();
    if (!raw) return false;

    let data = raw;
    for (const p of ['GOTHIC-MD~', 'GOTHIC~', 'Gothic~', 'gothic~']) {
        if (data.startsWith(p)) { data = data.slice(p.length); break; }
    }

    const credsPath = path.join(SESSION_DIR, 'creds.json');

    // 1) Already JSON?
    if (data.trim().startsWith('{')) {
        fs.writeFileSync(credsPath, data);
        return true;
    }

    // 2) Base64-encoded creds.json?
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
    const ctx = m?.extendedTextMessage?.contextInfo || m?.imageMessage?.contextInfo || m?.videoMessage?.contextInfo;
    return ctx?.mentionedJid || [];
}

function getQuotedSender(msg) {
    const m = msg.message;
    const ctx = m?.extendedTextMessage?.contextInfo || m?.imageMessage?.contextInfo;
    return ctx?.participant || null;
}

/* ═══════════════════════════════════════════════════════════
 *  MAIN BOT
 * ═══════════════════════════════════════════════════════════ */

let prefix   = settings.PREFIX;
const startTime = Date.now();

async function startBot() {
    ensureSessionDir();
    writeSessionFromEnv();

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version }          = await fetchLatestBaileysVersion();

    console.log(chalk.magenta('╭───────────────────────────────────────────╮'));
    console.log(chalk.magenta('│') + chalk.bold.cyan('   🎭  GOTHIC-MD  •  KINGSLEY-XMD TECH  ⚡  ') + chalk.magenta('│'));
    console.log(chalk.magenta('╰───────────────────────────────────────────╯'));
    console.log(chalk.gray(`   Baileys v${version.join('.')} • Node ${process.version}`));

    const sock = makeWASocket({
        version,
        logger,
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys : makeCacheableSignalKeyStore(state.keys, logger),
        },
        browser: ['GOTHIC-MD', 'Chrome', '121.0.0'],
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
    });

    /* ── Credentials ─────────────────────────────── */
    sock.ev.on('creds.update', saveCreds);

    /* ── Connection ──────────────────────────────── */
    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
        if (connection === 'open') {
            console.log(chalk.green('   ✅  Connected to WhatsApp.'));
            console.log(chalk.green(`   🤖  ${settings.BOT_NAME} v${settings.BOT_VERSION} is online.`));
        }

        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            if (code === DisconnectReason.loggedOut) {
                console.log(chalk.red('   ❌  Logged out. Delete the session folder and paste a new Session ID.'));
                process.exit(1);
            }
            console.log(chalk.yellow('   ⚠️  Disconnected — reconnecting…'));
            setTimeout(startBot, 3000);
        }
    });

    /* ── Anti-call ───────────────────────────────── */
    sock.ev.on('call', async (calls) => {
        if (!settings.REJECT_CALLS) return;
        for (const c of calls) {
            if (c.status === 'offer') {
                try { await sock.rejectCall(c.id, c.from); } catch (_) {}
            }
        }
    });

    /* ── Group welcome ───────────────────────────── */
    sock.ev.on('group-participants.update', async (ev) => {
        if (!settings.WELCOME_MSG) return;
        if (ev.action !== 'add') return;
        try {
            const meta = await sock.groupMetadata(ev.id);
            for (const p of ev.participants) {
                await sock.sendMessage(ev.id, {
                    text: `👋 Welcome @${p.split('@')[0]} to *${meta.subject}*!\n\nType *${prefix}menu* to see the commands. 🎭`,
                    mentions: [p],
                });
            }
        } catch (_) {}
    });

    /* ── Incoming messages ───────────────────────── */
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            try { await handleMessage(sock, msg); }
            catch (e) { console.error(chalk.red('[handler] ' + e.message)); }
        }
    });

    return sock;
}

/* ═══════════════════════════════════════════════════════════
 *  MESSAGE HANDLER
 * ═══════════════════════════════════════════════════════════ */

async function handleMessage(sock, msg) {
    if (!msg.message) return;
    if (msg.key.fromMe) return;

    const jid      = msg.key.remoteJid;
    const isGroup  = jid.endsWith('@g.us');
    const sender   = isGroup ? msg.key.participant : jid;
    const pushName = msg.pushName || 'User';
    const body     = getBody(msg).trim();

    /* ── Antilink check ──────────────────────────── */
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

    if (!body.startsWith(prefix)) return;

    const args     = body.slice(prefix.length).trim().split(/\s+/);
    const cmdName  = (args.shift() || '').toLowerCase();
    const command  = commands[cmdName];
    if (!command) return;

    /* ── Private mode guard ──────────────────────── */
    if (settings.MODE === 'private' && sender.split('@')[0] !== settings.OWNER_NUMBER) {
        return;
    }

    /* ── Group / Admin guards ────────────────────── */
    if (command.group && !isGroup) return sock.sendMessage(jid, { text: settings.MESSAGES.GROUP }, { quoted: msg });

    if (command.admin || command.botAdmin) {
        const meta    = await sock.groupMetadata(jid);
        const me      = jidNormalizedUser(sock.user.id);
        const isAdmin = meta.participants.find(p => p.id === sender)?.admin;
        const botAdm  = meta.participants.find(p => p.id === me)?.admin;

        if (command.admin && !isAdmin)    return sock.sendMessage(jid, { text: settings.MESSAGES.ADMIN }, { quoted: msg });
        if (command.botAdmin && !botAdm)  return sock.sendMessage(jid, { text: '🛡️ *Make me an admin first.*' }, { quoted: msg });
    }

    if (command.owner && sender.split('@')[0] !== settings.OWNER_NUMBER) {
        return sock.sendMessage(jid, { text: settings.MESSAGES.OWNER }, { quoted: msg });
    }

    /* ── Read receipt & typing ───────────────────── */
    if (settings.AUTO_READ)   await sock.readMessages([msg.key]).catch(() => {});
    if (settings.AUTO_TYPING) await sock.sendPresenceUpdate('composing', jid).catch(() => {});

    /* ── Build context & run ─────────────────────── */
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
        console.error(chalk.red(`[${cmdName}] ` + e.message));
        await ctx.reply(settings.MESSAGES.ERROR);
    } finally {
        if (settings.AUTO_TYPING) await sock.sendPresenceUpdate('paused', jid).catch(() => {});
    }
}

/* ═══════════════════════════════════════════════════════════
 *  BOOTSTRAP
 * ═══════════════════════════════════════════════════════════ */

process.on('uncaughtException',  (e) => console.error(chalk.red('[uncaught] ' + e.message)));
process.on('unhandledRejection', (e) => console.error(chalk.red('[unhandled] ' + (e?.message || e))));

(async () => {
    if (!settings.SESSION_ID || !settings.SESSION_ID.trim()) {
        console.log(chalk.red('\n❌  SESSION_ID is empty.'));
        console.log(chalk.yellow('   1. Get your session id from the GOTHIC MD SITE'));
        console.log(chalk.yellow('   2. Paste it into settings.js  (SESSION_ID field)'));
        console.log(chalk.yellow('   3. Or set the SESSION_ID environment variable on Render.\n'));
        process.exit(1);
    }
    await startBot();
})();
