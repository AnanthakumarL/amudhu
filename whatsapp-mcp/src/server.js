/**
 * WhatsApp Bot Control Server
 * Exposes HTTP API for the Admin Panel to control the bot, view QR code, and read chat logs.
 */

import express from "express";
import QRCode from "qrcode";
import { getChatLog, getAllChatSummaries, getProviderStatus, clearHistory } from "./ai.js";

const PORT = parseInt(process.env.PORT || process.env.BOT_SERVER_PORT || "7998", 10);
const ADMIN_ORIGINS = (process.env.ADMIN_ORIGINS || "http://localhost:5173,http://localhost:5174,http://localhost:3000").split(",").map(s => s.trim());

export function startControlServer(waClient) {
  const app = express();
  app.use(express.json());

  // CORS — allow admin panel origins
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (!origin || ADMIN_ORIGINS.includes(origin) || origin.endsWith(".vercel.app")) {
      res.setHeader("Access-Control-Allow-Origin", origin || "*");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  // ── Status ────────────────────────────────────────────────────────────────
  app.get("/api/status", (_req, res) => {
    const s = waClient.getStatus();
    res.json({
      connected: s.connected,
      phoneNumber: s.phoneNumber,
      qrPending: s.qrPending,
      storedMessages: s.storedMessages,
      ai: getProviderStatus(),
    });
  });

  // ── QR Code as base64 PNG ─────────────────────────────────────────────────
  app.get("/api/qr", async (_req, res) => {
    const raw = waClient.qrCode;
    if (!raw) {
      return res.json({ qr: null, connected: waClient.isConnected });
    }
    try {
      const dataUrl = await QRCode.toDataURL(raw, { width: 300, margin: 2 });
      res.json({ qr: dataUrl, connected: false });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Chat list (one entry per user) ───────────────────────────────────────
  app.get("/api/chats", (_req, res) => {
    res.json(getAllChatSummaries());
  });

  // ── Chat log for a specific phone ─────────────────────────────────────────
  app.get("/api/chats/:phone", (req, res) => {
    const logs = getChatLog(req.params.phone);
    res.json(logs);
  });

  // ── Recent WhatsApp messages (raw, from Baileys) ──────────────────────────
  app.get("/api/messages", (req, res) => {
    const { phone, limit = 50 } = req.query;
    const msgs = waClient.getRecentMessages(Number(limit), phone || null);
    res.json(msgs);
  });

  // ── Analytics summary ─────────────────────────────────────────────────────
  app.get("/api/analytics", (_req, res) => {
    const summaries = getAllChatSummaries();
    const totalMessages  = summaries.reduce((s, u) => s + u.messageCount, 0);
    const totalInputTokens  = summaries.reduce((s, u) => s + u.totalInputTokens, 0);
    const totalOutputTokens = summaries.reduce((s, u) => s + u.totalOutputTokens, 0);
    const totalCostINR   = summaries.reduce((s, u) => s + u.totalCostINR, 0);
    res.json({
      totalUsers: summaries.length,
      totalMessages,
      totalInputTokens,
      totalOutputTokens,
      totalCostINR: +totalCostINR.toFixed(4),
      users: summaries,
    });
  });

  // ── Logout from WhatsApp (clears auth + reconnects for fresh QR) ─────────
  app.post("/api/logout", async (_req, res) => {
    try {
      await waClient.logout();
      res.json({ success: true, message: "Logged out. QR code will appear shortly." });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Send a message (admin → user) ─────────────────────────────────────────
  app.post("/api/send", async (req, res) => {
    const { to, text } = req.body;
    if (!to || !text) return res.status(400).json({ error: "to and text are required" });
    try {
      const result = await waClient.sendMessage(to, text);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Clear history for a user ──────────────────────────────────────────────
  app.post("/api/chats/:phone/clear", (req, res) => {
    clearHistory(req.params.phone);
    res.json({ success: true });
  });

  app.listen(PORT, () => {
    console.error(`🌐 Bot control server running on http://localhost:${PORT}`);
  });

  return app;
}
