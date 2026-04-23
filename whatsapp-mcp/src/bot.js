/**
 * Amudhu Ice Creams WhatsApp Bot — simple relay.
 * Every message goes to the AI agent. The AI handles all logic via tool calling.
 * No intent detection, no templates, no state machines here.
 *
 * Run: node src/bot.js
 */

import { setDefaultResultOrder } from "dns";
setDefaultResultOrder("ipv4first");

import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { WhatsAppClient } from "./whatsapp.js";
import { agentReply, getProviderStatus } from "./ai.js";
import { startControlServer } from "./server.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load .env ─────────────────────────────────────────────────────────────────
const envFile = path.join(__dirname, "..", ".env");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const processingSet = new Set();

async function handleMessage(wa, msg) {
  if (!msg.text) return;
  if (processingSet.has(msg.id)) return;
  processingSet.add(msg.id);

  const from  = msg.from;
  const phone = from.replace(/[^0-9]/g, "");
  const text  = msg.text.trim();

  try {
    console.error(`\n📨 [${from}] ${text.substring(0, 120)}`);
    await wa.sock.sendPresenceUpdate("composing", msg.jid);

    const reply = await agentReply(from, phone, text);

    await wa.sock.sendPresenceUpdate("paused", msg.jid);
    await wa.sock.sendMessage(msg.jid, { text: reply, quoted: msg.raw });

    console.error(`🤖 ${reply.substring(0, 100)}${reply.length > 100 ? "…" : ""}`);
  } catch (err) {
    console.error(`❌ [${from}] ${err.message}`);
    await wa.sock.sendPresenceUpdate("paused", msg.jid).catch(() => {});
    await wa.sendMessage(from, "Sorry, something went wrong. Please try again!").catch(() => {});
  } finally {
    processingSet.delete(msg.id);
  }
}

async function main() {
  console.error("🤖 Amudhu Ice Creams WhatsApp Bot starting...");
  console.error("📋 AI:", JSON.stringify(getProviderStatus()));
  console.error(`🌐 Backend: ${process.env.BACKEND_API_URL || "http://localhost:7999"}`);
  console.error("📱 Connecting to WhatsApp...\n");

  const wa = new WhatsAppClient();

  // Start admin control server
  startControlServer(wa);

  wa.on("connected", (number) => {
    console.error(`✅ Connected as +${number} — bot is live! 🍦\n`);
  });

  wa.on("message", (msg) => handleMessage(wa, msg));

  wa.on("disconnected", (reason) => {
    console.error(`⚠️  Disconnected (${reason}) — reconnecting...`);
  });

  await wa.connect();

  process.on("SIGINT", () => {
    console.error("\n👋 Shutting down...");
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
