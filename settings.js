'use strict';

/**
 * ─────────────────────────────────────────────────────────────
 *  GOTHIC-MD  •  Configuration
 *  Developed by KINGSLEY-XMD TECH
 *
 *  🔑  GET YOUR SESSION ID FROM THE GOTHIC MD SITE,
 *      THEN PASTE IT BELOW BETWEEN THE QUOTES.
 * ─────────────────────────────────────────────────────────────
 */

module.exports = {

    /* ══════════════════════════════════════════════════════════
     *  🔐  SESSION ID  (from the GOTHIC MD SITE)
     *  You can also set this in the SESSION_ID environment var.
     * ══════════════════════════════════════════════════════════ */
    SESSION_ID: process.env.SESSION_ID || "",

    /* ── Bot identity ─────────────────────────────────────── */
    BOT_NAME:    "GOTHIC-MD",
    BOT_VERSION: "2.0.0",
    OWNER_NAME:  "KINGSLEY-XMD TECH",
    OWNER_NUMBER: "233535502036",           // international format, no +

    /* ── Command settings ─────────────────────────────────── */
    PREFIX: ".",                             // default command prefix
    MODE:   "public",                        // "public" | "private"

    /* ── Behaviour ────────────────────────────────────────── */
    AUTO_READ:      true,
    AUTO_TYPING:    true,
    REJECT_CALLS:   true,
    WELCOME_MSG:    true,                    // greet new group members
    ANTILINK_AUTO:  false,                   // global antilink

    /* ── Messages ─────────────────────────────────────────── */
    MESSAGES: {
        WAIT:     "⏳ *Please wait a moment…*",
        SUCCESS:  "✅ *Done.*",
        ERROR:    "❌ *Something went wrong.*",
        OWNER:    "👑 *Owner command only.*",
        ADMIN:    "🛡️ *Admin command only.*",
        GROUP:    "👥 *This command only works in groups.*",
        REPLY:    "↩️ *Reply to a message.*",
        NO_MEDIA: "🖼️ *No media found — reply to an image/video/sticker.*",
    },
};
