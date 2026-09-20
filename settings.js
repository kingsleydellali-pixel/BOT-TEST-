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
    SESSION_ID: process.env.SESSION_ID || "GOTHIC-MD:~eyJub2lzZUtleSI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoieUJtUkVVRDRCblZJUmlnVmZJOFJPRWYvWXJ0dXBZYlp4bVJSaVV4ZTNGcz0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoialBkdjhZY0tKems3bUJFNnFvNXU2TW1YRVdKS05zZzZOTHRMKzdxd0VCWT0ifX0sInBhaXJpbmdFcGhlbWVyYWxLZXlQYWlyIjp7InByaXZhdGUiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJLSWRydVJJOXhkUXZVWnFIZ3lnbVpZM1lGdTQ0MHVGRE9waUdFZE0ySGswPSJ9LCJwdWJsaWMiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJMbFZqa05RZmNTbFVhNG9UY0tlQ1RscklTbHlETnU2ZmdWVlNDU05KWHhFPSJ9fSwic2lnbmVkSWRlbnRpdHlLZXkiOnsicHJpdmF0ZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6ImVOUjRZUVNDVlE2eFlWTU8xdjlsdWFGZTY1amp5Q0k0clJFb0VEOGNnSGc9In0sInB1YmxpYyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IkozM3RhRjk0RFp5RU05WFhxZkpsN1hObnZZRUFSd2NEQVlZcGJtR2J3bkE9In19LCJzaWduZWRQcmVLZXkiOnsia2V5UGFpciI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiNkpiTVg2WDVRWjVrMVpkeWtmMXpGSzNmUXprNWhBaDN6NWFLcTNOeGQydz0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiMUpaOHRVZlpOSjNWNUtvSFpxRysyQ2FLM0VyaHF3czNncDcwdGYzWEpSdz0ifX0sInNpZ25hdHVyZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IlRIZlRUSjNRa1RrRUR4dUo3SHNsTHFpbkRyblZyZk5reVl4OWtyN3RBOENaT3R6SlluWSs5MlVJNklxNlhGL3hUazIwRXJveWdIRkRSa2dBekV1dGdBPT0ifSwia2V5SWQiOjF9LCJyZWdpc3RyYXRpb25JZCI6MjAyLCJhZHZTZWNyZXRLZXkiOiJMblpHaGRCRWxEaVN1WU1GR1hCdVVXK2ZMSVVSVytPMHFUeDlLZXVsdU4wPSIsInByb2Nlc3NlZEhpc3RvcnlNZXNzYWdlcyI6W10sIm5leHRQcmVLZXlJZCI6MzIsImZpcnN0VW51cGxvYWRlZFByZUtleUlkIjozMiwiYWNjb3VudFN5bmNDb3VudGVyIjowLCJhY2NvdW50U2V0dGluZ3MiOnsidW5hcmNoaXZlQ2hhdHMiOmZhbHNlfSwicmVnaXN0ZXJlZCI6dHJ1ZSwicGFpcmluZ0NvZGUiOiJRUVgzQ1JDRiIsIm1lIjp7ImlkIjoiMjMzNTM1NTAyMDM2OjcwQHMud2hhdHNhcHAubmV0IiwibGlkIjoiMTIyOTQ4MjAzNTkzOTE5OjcwQGxpZCIsIm5hbWUiOiLilpHilpLilpPiloggS0lOR1NMRVktWE1EIFRFQ0gg4paIIn0sImFjY291bnQiOnsiZGV0YWlscyI6IkNMT3ZucFVDRUlQK3dOVUdHQUVnQUNnQSIsImFjY291bnRTaWduYXR1cmVLZXkiOiJ5UzJia01OcVY1L0dpS29kUnNYamkxb1NoQUdlZUxhT2VUNnJqeSsrWDJFPSIsImFjY291bnRTaWduYXR1cmUiOiJ3VThMWVh3TS9qSWRqOWREWm8rRWRDTVFtUEVtWFUrYjRFckQwK3IyTDVOV2FtOUdqcjFGa3ZnNEhUNFJzUUFJdGs0ZXhaV0Y0aHJYa3NoUDJoUlVEQT09IiwiZGV2aWNlU2lnbmF0dXJlIjoiSUZTeVJib0I3TXdvaUJjUEZwUEJQVmVVeUFIZnNoWUllRklhZTJBQ20zZXNSb01JQWNNTVdOZ1NBcU1tWVUxYjhacVJycG5uTnJ1WG9Ibnl0ZlNOaHc9PSJ9LCJzaWduYWxJZGVudGl0aWVzIjpbeyJpZGVudGlmaWVyIjp7Im5hbWUiOiIyMzM1MzU1MDIwMzY6NzBAcy53aGF0c2FwcC5uZXQiLCJkZXZpY2VJZCI6MH0sImlkZW50aWZpZXJLZXkiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJCY2t0bTVERGFsZWZ4b2lxSFViRjQ0dGFFb1FCbm5pMmpuaytxNDh2dmw5aCJ9fV0sInBsYXRmb3JtIjoiYW5kcm9pZCIsInJvdXRpbmdJbmZvIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiQ0FJSUVnZ04ifSwibGFzdEFjY291bnRTeW5jVGltZXN0YW1wIjoxNzg5OTM1Mzc2LCJteUFwcFN0YXRlS2V5SWQiOiJBQUFBQUhmeiJ9",

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
