'use strict';

/**
 * ─────────────────────────────────────────────────────────────
 *  GOTHIC-MD  •  Command Registry
 *  Developed by KINGSLEY-XMD TECH
 *  All commands are contained inside this single file.
 * ─────────────────────────────────────────────────────────────
 */

const axios   = require('axios');
const sharp   = require('sharp');
const math    = require('mathjs');
const QRCode  = require('qrcode');
const moment  = require('moment-timezone');
const {
    downloadContentFromMessage,
} = require('@whiskeysockets/baileys');

const settings = require('./settings');

/* ═══════════════════════════════════════════════════════════
 *  Helpers
 * ═══════════════════════════════════════════════════════════ */

const antilinkGroups = new Set();   // group jids with antilink enabled

const rand   = (a) => a[Math.floor(Math.random() * a.length)];
const pickType = (m) => {
    if (!m) return null;
    return Object.keys(m).find(
        (k) => k !== 'senderKeyDistributionMessage' && k !== 'messageContextInfo'
    );
};

/** Resolve the effective content (handles replies + viewOnce) */
function resolveContent(msg) {
    const m = msg.message;
    if (!m) return null;
    const type = pickType(m);

    if (type === 'extendedTextMessage') {
        const q = m.extendedTextMessage?.contextInfo?.quotedMessage;
        if (q) return resolveContent({ message: q });
        return null;
    }
    if (type === 'viewOnceMessage' || type === 'viewOnceMessageV2') {
        return resolveContent({ message: m[type].message });
    }
    return { type, content: m[type] };
}

/** Download the media referenced by a message (or its quoted msg) */
async function downloadMedia(msg) {
    const resolved = resolveContent(msg);
    if (!resolved) return null;
    const { type, content } = resolved;
    const kind = type.replace('Message', '');          // image, video, audio, sticker …
    const stream = await downloadContentFromMessage(content, kind);
    let buf = Buffer.from([]);
    for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
    return { buffer: buf, mime: content.mimetype || '', type };
}

/** Build the full command menu */
function buildMenu(ctx) {
    const { prefix, pushName, sender } = ctx;
    const cats = {};
    for (const [name, cmd] of Object.entries(commands)) {
        const c = cmd.category || 'Misc';
        (cats[c] = cats[c] || []).push(name);
    }

    const total = Object.keys(commands).length;
    const time  = moment().tz('Africa/Kampala').format('HH:mm:ss • DD/MM/YYYY');

    let out  = '╭━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n';
    out     += '┃  🎭  *G O T H I C - M D*  🎭\n';
    out     += '┃  ⚡ KINGSLEY-XMD TECH ⚡\n';
    out     += '╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n';
    out     += `👤 *User*     : ${pushName || 'User'}\n`;
    out     += `📞 *Number*   : ${sender.split('@')[0]}\n`;
    out     += `🕒 *Time*     : ${time}\n`;
    out     += `📦 *Prefix*   : \`${prefix}\`\n`;
    out     += `🧩 *Commands* : ${total}\n\n`;

    const order = ['Main', 'Tools', 'Fun', 'Group', 'Owner', 'Misc'];
    const keys  = Object.keys(cats).sort(
        (a, b) => (order.indexOf(a) + 99) % 99 - (order.indexOf(b) + 99) % 99
    );

    const icons = {
        Main: '📋', Tools: '🛠️', Fun: '🎮',
        Group: '👥', Owner: '👑', Misc: '📦',
    };

    for (const cat of keys) {
        out += `\n╭─「 ${icons[cat] || '📁'} *${cat.toUpperCase()}* 」\n`;
        for (const n of cats[cat]) out += `│ ◦ \`${prefix}${n}\`\n`;
        out += '╰───────────────\n';
    }

    out += '\n> _GOTHIC-MD • Powered by KINGSLEY-XMD TECH_';
    return out;
}

/* ═══════════════════════════════════════════════════════════
 *  COMMANDS
 * ═══════════════════════════════════════════════════════════ */

const commands = {

/* ─────────────── MAIN ─────────────── */

menu: {
    category: 'Main',
    desc: 'Show the full command menu',
    handler: async (ctx) => ctx.reply(buildMenu(ctx)),
},

help: {
    category: 'Main',
    desc: 'Alias of .menu',
    handler: async (ctx) => ctx.reply(buildMenu(ctx)),
},

ping: {
    category: 'Main',
    desc: 'Check bot latency',
    handler: async (ctx) => {
        const t = Date.now();
        await ctx.reply('🏓 *Pinging…*');
        await ctx.reply(`🏓 *Pong!*\n⚡ Speed: *${Date.now() - t} ms*`);
    },
},

alive: {
    category: 'Main',
    desc: 'Check if the bot is alive',
    handler: async (ctx) => {
        const up = process.uptime();
        const h = Math.floor(up / 3600);
        const m = Math.floor((up % 3600) / 60);
        const s = Math.floor(up % 60);
        await ctx.reply(
            `╭━━━「 *GOTHIC-MD* 」━━━╮\n` +
            `┃ ✅ Status  : *ONLINE*\n` +
            `┃ ⏱️ Uptime  : *${h}h ${m}m ${s}s*\n` +
            `┃ 📦 Version : *${settings.BOT_VERSION}*\n` +
            `┃ 👑 Owner   : *${settings.OWNER_NAME}*\n` +
            `╰━━━━━━━━━━━━━━━━━━╯`
        );
    },
},

owner: {
    category: 'Main',
    desc: 'Show owner contact',
    handler: async (ctx) => {
        await ctx.sock.sendMessage(ctx.jid, {
            contacts: {
                displayName: settings.OWNER_NAME,
                contacts: [{ vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${settings.OWNER_NAME}\nTEL;waid=${settings.OWNER_NUMBER}:+${settings.OWNER_NUMBER}\nEND:VCARD` }],
            },
        }, { quoted: ctx.msg });
    },
},

restart: {
    category: 'Owner',
    desc: 'Restart the bot process',
    owner: true,
    handler: async (ctx) => {
        await ctx.reply('♻️ *Restarting GOTHIC-MD…*');
        setTimeout(() => process.exit(0), 1500);
    },
},

/* ─────────────── TOOLS ─────────────── */

sticker: {
    category: 'Tools',
    desc: 'Convert image/video to sticker',
    handler: async (ctx) => {
        try {
            const media = await downloadMedia(ctx.msg);
            if (!media || !['imageMessage', 'videoMessage', 'stickerMessage'].includes(media.type)) {
                return ctx.reply(settings.MESSAGES.NO_MEDIA);
            }
            let buf;
            if (media.type === 'imageMessage') {
                buf = await sharp(media.buffer)
                    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                    .webp({ quality: 90 })
                    .toBuffer();
            } else {
                buf = media.buffer; // already webp / video sticker
            }
            await ctx.sock.sendMessage(ctx.jid, { sticker: buf }, { quoted: ctx.msg });
        } catch (e) {
            ctx.reply(settings.MESSAGES.ERROR + '\n' + e.message);
        }
    },
},

toimg: {
    category: 'Tools',
    desc: 'Convert a sticker back to image',
    handler: async (ctx) => {
        try {
            const media = await downloadMedia(ctx.msg);
            if (!media || media.type !== 'stickerMessage') return ctx.reply('↩️ *Reply to a sticker.*');
            const buf = await sharp(media.buffer).png().toBuffer();
            await ctx.sock.sendMessage(ctx.jid, { image: buf, caption: '🖼️ *Converted by GOTHIC-MD*' }, { quoted: ctx.msg });
        } catch (e) { ctx.reply(settings.MESSAGES.ERROR); }
    },
},

vv: {
    category: 'Tools',
    desc: 'Reveal a view-once media',
    handler: async (ctx) => {
        try {
            const m = ctx.msg.message;
            const vo = m?.viewOnceMessageV2?.message || m?.viewOnceMessage?.message;
            if (!vo) return ctx.reply('↩️ *Reply to a view-once message.*');
            const type = pickType(vo);
            const stream = await downloadContentFromMessage(vo[type], type.replace('Message',''));
            let buf = Buffer.from([]);
            for await (const c of stream) buf = Buffer.concat([buf, c]);
            const out = type === 'imageMessage'
                ? { image: buf, caption: '👁️ *View-once revealed*' }
                : { video: buf, caption: '👁️ *View-once revealed*' };
            await ctx.sock.sendMessage(ctx.jid, out, { quoted: ctx.msg });
        } catch (e) { ctx.reply(settings.MESSAGES.ERROR); }
    },
},

qr: {
    category: 'Tools',
    desc: 'Generate a QR code — .qr <text>',
    handler: async (ctx) => {
        if (!ctx.args.length) return ctx.reply('📌 Usage: *.qr <text>*');
        const buf = await QRCode.toBuffer(ctx.args.join(' '), { width: 512 });
        await ctx.sock.sendMessage(ctx.jid, { image: buf, caption: '✅ *QR generated*' }, { quoted: ctx.msg });
    },
},

shorturl: {
    category: 'Tools',
    desc: 'Shorten a long URL — .shorturl <url>',
    handler: async (ctx) => {
        const url = ctx.args[0];
        if (!url) return ctx.reply('📌 Usage: *.shorturl <url>*');
        try {
            const { data } = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
            ctx.reply(`🔗 *Short URL:*\n${data}`);
        } catch { ctx.reply(settings.MESSAGES.ERROR); }
    },
},

fliptext: {
    category: 'Tools',
    desc: 'Flip text upside down',
    handler: async (ctx) => {
        const text = ctx.args.join(' ');
        if (!text) return ctx.reply('📌 Usage: *.fliptext <text>*');
        const map = { a:'ɐ',b:'q',c:'ɔ',d:'p',e:'ǝ',f:'ɟ',g:'ƃ',h:'ɥ',i:'ᴉ',j:'ɾ',k:'ʞ',l:'l',m:'ɯ',n:'u',o:'o',p:'d',q:'b',r:'ɹ',s:'s',t:'ʇ',u:'n',v:'ʌ',w:'ʍ',x:'x',y:'ʎ',z:'z' };
        ctx.reply(text.toLowerCase().split('').reverse().map(c => map[c] || c).join(''));
    },
},

reverse: {
    category: 'Tools',
    desc: 'Reverse text — .reverse <text>',
    handler: async (ctx) => {
        const t = ctx.args.join(' ');
        if (!t) return ctx.reply('📌 Usage: *.reverse <text>*');
        ctx.reply(t.split('').reverse().join(''));
    },
},

upper: {
    category: 'Tools',
    desc: 'Uppercase text',
    handler: async (ctx) => ctx.reply(ctx.args.join(' ').toUpperCase() || '📌 Usage: *.upper <text>*'),
},

lower: {
    category: 'Tools',
    desc: 'Lowercase text',
    handler: async (ctx) => ctx.reply(ctx.args.join(' ').toLowerCase() || '📌 Usage: *.lower <text>*'),
},

calc: {
    category: 'Tools',
    desc: 'Calculate a math expression — .calc 2+2*5',
    handler: async (ctx) => {
        const expr = ctx.args.join(' ');
        if (!expr) return ctx.reply('📌 Usage: *.calc 2+2*5*');
        try { ctx.reply(`🧮 *${expr}* = *${math.evaluate(expr)}*`); }
        catch { ctx.reply('❌ Invalid expression.'); }
    },
},

password: {
    category: 'Tools',
    desc: 'Generate a random password — .password [length]',
    handler: async (ctx) => {
        const len = Math.min(parseInt(ctx.args[0]) || 16, 64);
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%&*';
        let out = '';
        for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
        ctx.reply(`🔐 *Password (${len} chars):*\n\`\`\`${out}\`\`\``);
    },
},

time: {
    category: 'Tools',
    desc: 'Show current time',
    handler: async (ctx) => ctx.reply(`🕒 *Time:* ${moment().tz('Africa/Kampala').format('HH:mm:ss')}\n📅 *Date:* ${moment().tz('Africa/Kampala').format('DD MMMM YYYY')}`),
},

date: {
    category: 'Tools',
    desc: 'Show today\'s date',
    handler: async (ctx) => ctx.reply(`📅 *${moment().format('dddd, DD MMMM YYYY')}*`),
},

weather: {
    category: 'Tools',
    desc: 'Get weather — .weather <city>',
    handler: async (ctx) => {
        const city = ctx.args.join(' ');
        if (!city) return ctx.reply('📌 Usage: *.weather Kampala*');
        try {
            const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
            const c = data.current_condition[0];
            ctx.reply(
                `🌤️ *Weather — ${city}*\n` +
                `🌡️ Temp     : *${c.temp_C}°C* (feels ${c.FeelsLikeC}°C)\n` +
                `☁️ Condition: *${c.weatherDesc[0].value}*\n` +
                `💧 Humidity : *${c.humidity}%*\n` +
                `💨 Wind     : *${c.windspeedKmph} km/h*`
            );
        } catch { ctx.reply(settings.MESSAGES.ERROR); }
    },
},

/* ─────────────── FUN ─────────────── */

joke: {
    category: 'Fun',
    desc: 'Get a random joke',
    handler: async (ctx) => {
        try {
            const { data } = await axios.get('https://official-joke-api.appspot.com/random_joke');
            ctx.reply(`😂 *${data.setup}*\n\n👉 ${data.punchline}`);
        } catch { ctx.reply(settings.MESSAGES.ERROR); }
    },
},

quote: {
    category: 'Fun',
    desc: 'Get a random quote',
    handler: async (ctx) => {
        try {
            const { data } = await axios.get('https://api.quotable.io/random');
            ctx.reply(`💭 _"${data.content}"_\n\n— *${data.author}*`);
        } catch { ctx.reply(settings.MESSAGES.ERROR); }
    },
},

fact: {
    category: 'Fun',
    desc: 'Get a random fact',
    handler: async (ctx) => {
        try {
            const { data } = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
            ctx.reply(`🧠 *Did you know?*\n\n${data.text}`);
        } catch { ctx.reply(settings.MESSAGES.ERROR); }
    },
},

dice: {
    category: 'Fun',
    desc: 'Roll a dice',
    handler: async (ctx) => ctx.reply(`🎲 *You rolled:* *${Math.floor(Math.random() * 6) + 1}*`),
},

coin: {
    category: 'Fun',
    desc: 'Flip a coin',
    handler: async (ctx) => ctx.reply(`🪙 *${rand(['HEADS', 'TAILS'])}*`),
},

/* ─────────────── GROUP ─────────────── */

tagall: {
    category: 'Group',
    desc: 'Mention every member — .tagall [message]',
    group: true,
    admin: true,
    handler: async (ctx) => {
        const meta = await ctx.sock.groupMetadata(ctx.jid);
        const note = ctx.args.join(' ') || 'Attention everyone!';
        let text = `📢 *${note}*\n\n`;
        for (const p of meta.participants) text += `◦ @${p.id.split('@')[0]}\n`;
        await ctx.sock.sendMessage(ctx.jid, { text, mentions: meta.participants.map(p => p.id) }, { quoted: ctx.msg });
    },
},

groupinfo: {
    category: 'Group',
    desc: 'Show group information',
    group: true,
    handler: async (ctx) => {
        const meta = await ctx.sock.groupMetadata(ctx.jid);
        const created = moment(meta.creation * 1000).format('DD MMM YYYY');
        const admins = meta.participants.filter(p => p.admin).length;
        ctx.reply(
            `╭━━━「 *GROUP INFO* 」━━━╮\n` +
            `┃ 📛 Name    : *${meta.subject}*\n` +
            `┃ 🆔 JID     : \`${meta.id}\`\n` +
            `┃ 👥 Members : *${meta.participants.length}*\n` +
            `┃ 🛡️ Admins  : *${admins}*\n` +
            `┃ 📅 Created : *${created}*\n` +
            `┃ 📝 Desc    : ${meta.desc || '—'}\n` +
            `╰━━━━━━━━━━━━━━━━━━━╯`
        );
    },
},

kick: {
    category: 'Group',
    desc: 'Remove a member — reply or .kick @user',
    group: true, admin: true, botAdmin: true,
    handler: async (ctx) => {
        const target = ctx.mentioned[0] || ctx.quotedSender;
        if (!target) return ctx.reply('↩️ *Reply to or mention the member.*');
        await ctx.sock.groupParticipantsUpdate(ctx.jid, [target], 'remove');
        ctx.reply('✅ *Member removed.*');
    },
},

promote: {
    category: 'Group',
    desc: 'Promote a member to admin',
    group: true, admin: true, botAdmin: true,
    handler: async (ctx) => {
        const target = ctx.mentioned[0] || ctx.quotedSender;
        if (!target) return ctx.reply('↩️ *Reply to or mention the member.*');
        await ctx.sock.groupParticipantsUpdate(ctx.jid, [target], 'promote');
        ctx.reply('✅ *Member promoted to admin.*');
    },
},

demote: {
    category: 'Group',
    desc: 'Demote an admin',
    group: true, admin: true, botAdmin: true,
    handler: async (ctx) => {
        const target = ctx.mentioned[0] || ctx.quotedSender;
        if (!target) return ctx.reply('↩️ *Reply to or mention the admin.*');
        await ctx.sock.groupParticipantsUpdate(ctx.jid, [target], 'demote');
        ctx.reply('✅ *Admin demoted.*');
    },
},

linkgc: {
    category: 'Group',
    desc: 'Get the group invite link',
    group: true, admin: true, botAdmin: true,
    handler: async (ctx) => {
        const code = await ctx.sock.groupInviteCode(ctx.jid);
        ctx.reply(`🔗 *Group link:*\nhttps://chat.whatsapp.com/${code}`);
    },
},

mute: {
    category: 'Group',
    desc: 'Mute the group (admins only)',
    group: true, admin: true, botAdmin: true,
    handler: async (ctx) => {
        await ctx.sock.groupSettingUpdate(ctx.jid, 'announcement');
        ctx.reply('🔇 *Group muted — only admins can send.*');
    },
},

unmute: {
    category: 'Group',
    desc: 'Unmute the group',
    group: true, admin: true, botAdmin: true,
    handler: async (ctx) => {
        await ctx.sock.groupSettingUpdate(ctx.jid, 'not_announcement');
        ctx.reply('🔊 *Group unmuted — everyone can send.*');
    },
},

antilink: {
    category: 'Group',
    desc: 'Toggle antilink — .antilink on|off',
    group: true, admin: true,
    handler: async (ctx) => {
        const mode = (ctx.args[0] || '').toLowerCase();
        if (mode === 'on')  { antilinkGroups.add(ctx.jid); return ctx.reply('✅ *Antilink enabled.*'); }
        if (mode === 'off') { antilinkGroups.delete(ctx.jid); return ctx.reply('❌ *Antilink disabled.*'); }
        ctx.reply(`📌 Usage: *.antilink on|off*\nStatus: *${antilinkGroups.has(ctx.jid) ? 'ON' : 'OFF'}*`);
    },
},

};

module.exports = { commands, buildMenu, antilinkGroups };
