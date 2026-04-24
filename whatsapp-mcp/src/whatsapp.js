import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  isJidBroadcast,
  downloadMediaMessage,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import pino from "pino";
import path from "path";
import { fileURLToPath } from "url";
import { EventEmitter } from "events";
import { rmSync, existsSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, "..", "auth_info");

// Silent logger - only show QR and errors
const logger = pino({ level: "silent" });

export class WhatsAppClient extends EventEmitter {
  constructor() {
    super();
    this.sock = null;
    this.isConnected = false;
    this.qrCode = null;
    this.messages = []; // in-memory message store (last 200)
    this.phoneNumber = null;
    this.retryCount = 0;
    this.maxRetries = 5;
  }

  async connect() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    this.sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false, // we handle QR ourselves
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      browser: ["WhatsApp MCP Bot", "Chrome", "120.0.0"],
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
    });

    // Connection updates
    this.sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.qrCode = qr;
        console.error("\n========== SCAN THIS QR CODE IN WHATSAPP ==========");
        qrcode.generate(qr, { small: true });
        console.error("====================================================");
        console.error("Open WhatsApp > Linked Devices > Link a Device\n");
        this.emit("qr", qr);
      }

      if (connection === "open") {
        this.isConnected = true;
        this.qrCode = null;
        this.retryCount = 0;
        this.phoneNumber = this.sock.user?.id?.split(":")[0] || null;
        console.error(`\n✅ WhatsApp connected! Number: +${this.phoneNumber}\n`);
        this.emit("connected", this.phoneNumber);
      }

      if (connection === "close") {
        this.isConnected = false;
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        const shouldReconnect = reason !== DisconnectReason.loggedOut;

        console.error(
          `❌ Connection closed. Reason: ${reason}. Reconnect: ${shouldReconnect}`
        );
        this.emit("disconnected", reason);

        if (reason === DisconnectReason.loggedOut) {
          // Clear saved credentials so next connect() shows a fresh QR
          this._clearAuth();
          console.error("🔄 Logged out — clearing auth and reconnecting for new QR...");
          setTimeout(() => this.connect(), 1000);
        } else if (shouldReconnect && this.retryCount < this.maxRetries) {
          this.retryCount++;
          const delay = Math.min(1000 * 2 ** this.retryCount, 30000);
          console.error(
            `🔄 Reconnecting in ${delay / 1000}s (attempt ${this.retryCount}/${this.maxRetries})...`
          );
          setTimeout(() => this.connect(), delay);
        }
      }
    });

    // Save credentials whenever updated
    this.sock.ev.on("creds.update", saveCreds);

    // Incoming messages
    this.sock.ev.on("messages.upsert", ({ messages: msgs, type }) => {
      if (type !== "notify") return;

      for (const msg of msgs) {
        if (msg.key.fromMe) continue; // skip our own messages
        if (isJidBroadcast(msg.key.remoteJid)) continue; // skip broadcast

        const parsed = this._parseMessage(msg);
        if (!parsed) continue;

        // Keep last 200 messages
        this.messages.unshift(parsed);
        if (this.messages.length > 200) this.messages.pop();

        console.error(
          `📨 New message from ${parsed.from}: ${parsed.text?.substring(0, 80) || "[media]"}`
        );
        this.emit("message", parsed);
      }
    });

    return this.sock;
  }

  _parseMessage(msg) {
    const jid = msg.key.remoteJid;
    const isGroup = jid.endsWith("@g.us");

    // Resolve @lid JIDs to actual phone numbers via the contact store
    const resolveJid = (j) => {
      if (!j) return "";
      if (j.endsWith("@lid")) {
        const contacts = this.sock?.contacts || {};
        for (const [cJid, c] of Object.entries(contacts)) {
          if ((c.lid === j || c.id === j) && cJid.endsWith("@s.whatsapp.net")) {
            return cJid.replace("@s.whatsapp.net", "");
          }
        }
        // Fallback: strip suffix — number may still be correct for non-lid accounts
      }
      return j.replace(/@[^@]+$/, "");
    };

    const from = isGroup
      ? resolveJid(msg.key.participant) || "unknown"
      : resolveJid(jid);

    const content = msg.message;
    if (!content) return null;

    let text = null;
    let mediaType = null;
    let mediaMime = null;

    if (content.conversation) {
      text = content.conversation;
    } else if (content.extendedTextMessage?.text) {
      text = content.extendedTextMessage.text;
    } else if (content.imageMessage) {
      text = content.imageMessage.caption || "";
      mediaType = "image";
      mediaMime = content.imageMessage.mimetype || "image/jpeg";
    } else if (content.videoMessage) {
      text = content.videoMessage.caption || "";
      mediaType = "video";
      mediaMime = content.videoMessage.mimetype || "video/mp4";
    } else if (content.audioMessage) {
      mediaType = "audio";
      mediaMime = content.audioMessage.mimetype || "audio/ogg; codecs=opus";
    } else if (content.documentMessage) {
      text = content.documentMessage.fileName || "";
      mediaType = "document";
      mediaMime = content.documentMessage.mimetype || "application/octet-stream";
    } else if (content.stickerMessage) {
      mediaType = "sticker";
      mediaMime = content.stickerMessage.mimetype || "image/webp";
    }

    return {
      id: msg.key.id,
      from,
      jid,
      isGroup,
      groupName: isGroup ? jid : null,
      text,
      mediaType,
      mediaMime,
      timestamp: msg.messageTimestamp
        ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString(),
      raw: msg,
    };
  }

  async downloadMedia(msg) {
    try {
      const buffer = await downloadMediaMessage(
        msg.raw,
        "buffer",
        {},
        { logger, reuploadRequest: this.sock.updateMediaMessage }
      );
      return { data: buffer.toString("base64"), mimeType: msg.mediaMime };
    } catch (err) {
      console.error(`⚠️  Failed to download media: ${err.message}`);
      return null;
    }
  }

  async sendMessage(to, text) {
    if (!this.isConnected) throw new Error("WhatsApp not connected");

    // Normalize number to JID
    const jid = to.includes("@")
      ? to
      : `${to.replace(/[^0-9]/g, "")}@s.whatsapp.net`;

    await this.sock.sendMessage(jid, { text });
    return { success: true, to: jid, text };
  }

  async sendGroupMessage(groupJid, text) {
    if (!this.isConnected) throw new Error("WhatsApp not connected");
    await this.sock.sendMessage(groupJid, { text });
    return { success: true, to: groupJid, text };
  }

  getRecentMessages(limit = 20, fromNumber = null) {
    let msgs = this.messages;
    if (fromNumber) {
      const normalized = fromNumber.replace(/[^0-9]/g, "");
      msgs = msgs.filter((m) => m.from.includes(normalized));
    }
    return msgs.slice(0, limit);
  }

  _clearAuth() {
    try {
      if (existsSync(AUTH_DIR)) {
        rmSync(AUTH_DIR, { recursive: true, force: true });
        console.error("🗑️  Auth cleared.");
      }
    } catch (e) {
      console.error("Failed to clear auth:", e.message);
    }
    this.isConnected = false;
    this.qrCode = null;
    this.phoneNumber = null;
    this.retryCount = 0;
  }

  async logout() {
    try {
      if (this.sock) await this.sock.logout().catch(() => {});
    } catch { /* ignore */ }
    this._clearAuth();
    // Reconnect immediately so QR appears right away
    setTimeout(() => this.connect(), 500);
  }

  getStatus() {
    return {
      connected: this.isConnected,
      phoneNumber: this.phoneNumber
        ? `+${this.phoneNumber}`
        : null,
      qrPending: this.qrCode !== null,
      storedMessages: this.messages.length,
    };
  }
}
