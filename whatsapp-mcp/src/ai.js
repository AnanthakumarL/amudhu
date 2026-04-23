/**
 * AI agent module — Gemini with tool calling (function calling).
 * The AI drives all logic: it decides when to fetch products, create orders,
 * check order status, manage profiles. No hardcoded intent detection.
 * Responds naturally in whatever language the customer uses.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  fetchProducts,
  fetchOrdersByPhone,
  fetchOrderById,
  createOrder,
  fetchAccountByPhone,
  fetchAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  updateOrder,
  deleteOrder,
  fetchOrderStatistics,
  fetchOrderByNumber,
} from "./api.js";

const __envDir = path.dirname(fileURLToPath(import.meta.url));
const __envFile = path.join(__envDir, "..", ".env");
if (existsSync(__envFile)) {
  for (const line of readFileSync(__envFile, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

// ── Keys & models ─────────────────────────────────────────────────────────────
const GEMINI_KEYS = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "")
  .split(",").map((k) => k.trim()).filter(Boolean);

const GEMINI_MODELS = (process.env.GEMINI_FALLBACK_MODELS || process.env.GEMINI_MODEL || "gemini-2.5-flash-lite")
  .split(",").map((m) => m.trim()).filter(Boolean);

const DEEPSEEK_KEY  = process.env.DEEPSEEK_API_KEY  || "";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

if (!GEMINI_KEYS.length && !DEEPSEEK_KEY) {
  throw new Error("No AI API keys found. Set GEMINI_API_KEYS or DEEPSEEK_API_KEY in .env");
}

// ── Key rotation ──────────────────────────────────────────────────────────────
let geminiKeyIdx   = 0;
let geminiModelIdx = 0;
const keyFailures  = new Map();
const KEY_FAIL_THRESHOLD = 3;

function nextKey() {
  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const idx = (geminiKeyIdx + i) % GEMINI_KEYS.length;
    const key = GEMINI_KEYS[idx];
    if ((keyFailures.get(key) || 0) < KEY_FAIL_THRESHOLD) {
      geminiKeyIdx = (idx + 1) % GEMINI_KEYS.length;
      return key;
    }
  }
  keyFailures.clear();
  geminiKeyIdx = 0;
  return GEMINI_KEYS[0];
}

// ── DeepSeek (text-only fallback) ─────────────────────────────────────────────
const deepseek = DEEPSEEK_KEY
  ? new OpenAI({ baseURL: "https://api.deepseek.com", apiKey: DEEPSEEK_KEY })
  : null;

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the WhatsApp assistant for Amudhu Ice Creams, Chennai.

LANGUAGE: Always reply in the same language the customer uses. If they mix languages (e.g. Tamil + English), match their style.

PERSONALITY: Warm, helpful, natural. Never use templated or robotic messages. Write like a friendly shop assistant texting on WhatsApp — short, clear, with emojis where appropriate.

YOU HAVE TOOLS — use them proactively:
- get_products: Call this whenever you need to show the menu, check prices, or match what the customer wants to real products.
- user_management: Use this for anything related to the customer's own account — view profile, update name/address/email, delete account, verify their info.
- order_management: Use this for creating, viewing, updating, or cancelling orders. Always call get_products first to resolve product IDs before creating an order.

CONVERSATION STYLE (IMPORTANT):
- Never force the customer to reply in a specific format.
- If you ask the customer to pick from a list and they ask a question instead, answer their question naturally, then gently continue where you left off.
- Accept product choices in ANY form: number ("1", "one"), name ("chocolate"), partial name ("choco"), emoji, etc. Use get_products to resolve to the actual product ID.
- If they say something ambiguous, make your best guess and confirm: "I'm adding Chocolate Fudge — that right? 😊"

ORDER FLOW (handle naturally in conversation — no fixed steps):
1. Understand what they want (call get_products to match IDs and prices).
2. Collect name + delivery address (check user_management for saved profile first — skip if already known).
3. Optionally ask for preferred delivery time.
4. Show a natural order summary and ask them to confirm.
5. On confirmation, call order_management with action "create_order".

STOCK: If inventory_quantity is 0, tell the customer and suggest alternatives.

NEVER:
- Say "I'll fetch", "let me check", "I'll arrange" or imply a background task.
- Show raw JSON or technical data.
- Give rigid templated messages. Be conversational.
- Ask the customer to type specific keywords or numbers unless it genuinely helps clarity.`;

// ── Tool definitions (Gemini function declarations) ───────────────────────────
const TOOL_DECLARATIONS = [
  {
    name: "get_products",
    description: "Fetch the current product menu from the database. Returns a list of products with IDs, names, prices, descriptions, and inventory_quantity. Call this to resolve a product name or number the customer mentioned into an actual product_id.",
    parameters: { type: "object", properties: {} },
  },

  // ── User Management Tool ────────────────────────────────────────────────────
  {
    name: "user_management",
    description: `Manage customer accounts. Supports the following actions:
- get_profile: Look up the customer's saved profile by phone. Call this at the start of conversations to pre-fill order details.
- create_user: Register a new customer account with name, email, phone. Auto-called when a new customer places their first order.
- update_user: Update one or more profile fields (name, email, address, is_active). Pass only the fields you want to change.
- delete_user: Permanently delete the customer's account. Ask for confirmation before doing this.
- verify_user: Check whether a customer's phone is already registered.
- get_user_by_id: Fetch full account details by account ID.
- list_orders_for_user: Get all recent orders for this customer.`,
    parameters: {
      type: "object",
      required: ["action"],
      properties: {
        action: {
          type: "string",
          enum: ["get_profile", "create_user", "update_user", "delete_user", "verify_user", "get_user_by_id", "list_orders_for_user"],
        },
        phone:      { type: "string", description: "Customer phone number (required for most actions)" },
        account_id: { type: "string", description: "Account ID (required for get_user_by_id, update_user, delete_user when known)" },
        name:       { type: "string" },
        email:      { type: "string" },
        address:    { type: "string" },
        is_active:  { type: "boolean", description: "Set false to deactivate, true to reactivate" },
        role:       { type: "string", description: "Account role (default: customer)" },
      },
    },
  },

  // ── Order Management Tool ───────────────────────────────────────────────────
  {
    name: "order_management",
    description: `Manage orders. Supports the following actions:
- create_order: Create a new order. Requires customer_name, shipping_address, items (with product_id from get_products), subtotal, total. Always confirm order summary with customer before calling this.
- get_order: Fetch a single order by order_id.
- get_order_by_number: Fetch a single order by human-readable order_number (e.g. "ORD-0042").
- list_orders: Get recent orders for this customer by phone.
- update_order_status: Change the status of an order (pending → processing → shipped → delivered, or cancelled).
- update_order_notes: Add or update the notes/special instructions on an order.
- update_shipping_address: Change the delivery address on an existing order.
- cancel_order: Cancel an order. Ask the customer to confirm before calling this.
- delete_order: Permanently delete an order record (admin use — confirm before calling).
- get_order_statistics: Get summary statistics (total orders, revenue, status breakdown) for this customer.`,
    parameters: {
      type: "object",
      required: ["action"],
      properties: {
        action: {
          type: "string",
          enum: [
            "create_order", "get_order", "get_order_by_number", "list_orders",
            "update_order_status", "update_order_notes", "update_shipping_address",
            "cancel_order", "delete_order", "get_order_statistics",
          ],
        },
        // Identifiers
        phone:        { type: "string", description: "Customer phone (for list_orders)" },
        order_id:     { type: "string", description: "Order ID (for get/update/cancel/delete)" },
        order_number: { type: "string", description: "Human-readable order number e.g. ORD-0042" },

        // create_order fields
        customer_name:     { type: "string" },
        customer_phone:    { type: "string" },
        customer_email:    { type: "string" },
        shipping_address:  { type: "string" },
        billing_address:   { type: "string" },
        delivery_datetime: { type: "string", description: "Preferred delivery date/time, free text" },
        notes:             { type: "string" },
        subtotal:          { type: "number" },
        total:             { type: "number" },
        items: {
          type: "array",
          description: "Order line items. Resolve product_id from get_products before passing.",
          items: {
            type: "object",
            required: ["product_id", "product_name", "quantity", "price", "subtotal"],
            properties: {
              product_id:   { type: "string" },
              product_name: { type: "string" },
              quantity:     { type: "number" },
              price:        { type: "number" },
              subtotal:     { type: "number" },
            },
          },
        },

        // update fields
        status: {
          type: "string",
          enum: ["pending", "assigned", "processing", "shipped", "delivered", "cancelled"],
          description: "New order status (for update_order_status and cancel_order)",
        },
        new_notes:            { type: "string", description: "Replacement notes text" },
        new_shipping_address: { type: "string", description: "New delivery address" },
      },
    },
  },
];

// ── Tool executor ─────────────────────────────────────────────────────────────
async function executeTool(name, args, phone) {
  console.error(`[Tool] ${name}(${JSON.stringify(args)})`);
  try {
    switch (name) {

      // ── Products ────────────────────────────────────────────────────────────
      case "get_products": {
        const products = await fetchProducts();
        return { products };
      }

      // ── User Management ─────────────────────────────────────────────────────
      case "user_management": {
        return await handleUserManagement(args, phone);
      }

      // ── Order Management ────────────────────────────────────────────────────
      case "order_management": {
        return await handleOrderManagement(args, phone);
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    console.error(`[Tool] ${name} error: ${err.message}`);
    return { error: err.message };
  }
}

// ── User Management handler ────────────────────────────────────────────────────
async function handleUserManagement(args, callerPhone) {
  const p = args.phone || callerPhone;

  switch (args.action) {
    case "get_profile": {
      const account = await fetchAccountByPhone(p);
      if (!account) return { found: false };
      return {
        found:   true,
        id:      account.id,
        name:    account.name,
        email:   account.email?.endsWith("@wa.local") ? null : account.email,
        address: account.attributes?.address || null,
        phone:   account.attributes?.phone || p,
        role:    account.role,
        is_active: account.is_active,
      };
    }

    case "verify_user": {
      const account = await fetchAccountByPhone(p);
      return { registered: !!account, phone: p };
    }

    case "create_user": {
      const existing = await fetchAccountByPhone(p);
      if (existing) return { success: false, reason: "already_exists", id: existing.id };
      const created = await createAccount({
        name:       args.name  || "WhatsApp Customer",
        email:      args.email || `${p}@wa.local`,
        role:       args.role  || "customer",
        is_active:  true,
        attributes: { phone: p, address: args.address || null },
      });
      return { success: true, id: created.id };
    }

    case "update_user": {
      let accountId = args.account_id;
      let existing  = null;

      if (accountId) {
        existing = await fetchAccountById(accountId);
      } else {
        existing = await fetchAccountByPhone(p);
        if (!existing) return { success: false, reason: "not_found" };
        accountId = existing.id;
      }

      const payload = {};
      if (args.name      != null) payload.name      = args.name;
      if (args.email     != null) payload.email     = args.email;
      if (args.is_active != null) payload.is_active = args.is_active;
      if (args.role      != null) payload.role      = args.role;
      if (args.address   != null || args.phone != null) {
        payload.attributes = {
          ...(existing?.attributes || {}),
          ...(args.address != null ? { address: args.address } : {}),
          ...(args.phone   != null ? { phone:   args.phone   } : {}),
        };
      }

      await updateAccount(accountId, payload);
      return { success: true };
    }

    case "delete_user": {
      let accountId = args.account_id;
      if (!accountId) {
        const account = await fetchAccountByPhone(p);
        if (!account) return { success: false, reason: "not_found" };
        accountId = account.id;
      }
      await deleteAccount(accountId);
      return { success: true };
    }

    case "get_user_by_id": {
      const account = await fetchAccountById(args.account_id);
      return {
        id:       account.id,
        name:     account.name,
        email:    account.email?.endsWith("@wa.local") ? null : account.email,
        address:  account.attributes?.address || null,
        phone:    account.attributes?.phone   || null,
        role:     account.role,
        is_active: account.is_active,
        created_at: account.created_at,
      };
    }

    case "list_orders_for_user": {
      const orders = await fetchOrdersByPhone(p);
      return { orders };
    }

    default:
      return { error: `Unknown user_management action: ${args.action}` };
  }
}

// ── Order Management handler ──────────────────────────────────────────────────
async function handleOrderManagement(args, callerPhone) {
  const phone = args.customer_phone || args.phone || callerPhone;

  switch (args.action) {
    case "create_order": {
      const order = await createOrder({
        customer_name:       args.customer_name,
        customer_phone:      phone,
        customer_email:      args.customer_email,
        customer_identifier: phone.replace(/\D/g, "").slice(-10),
        shipping_address:    args.shipping_address,
        billing_address:     args.billing_address,
        delivery_datetime:   args.delivery_datetime,
        notes:               args.notes,
        items:               args.items,
        subtotal:            args.subtotal,
        tax:                 0,
        shipping_cost:       0,
        total:               args.total,
        source:              "whatsapp",
        status:              "pending",
      });
      return { success: true, order_number: order.order_number || order.id, id: order.id, total: order.total };
    }

    case "get_order": {
      const order = await fetchOrderById(args.order_id);
      return { order };
    }

    case "get_order_by_number": {
      const order = await fetchOrderByNumber(args.order_number);
      return { order };
    }

    case "list_orders": {
      const orders = await fetchOrdersByPhone(phone);
      return { orders };
    }

    case "update_order_status": {
      const updated = await updateOrder(args.order_id, { status: args.status });
      return { success: true, order_number: updated.order_number, status: updated.status };
    }

    case "update_order_notes": {
      const updated = await updateOrder(args.order_id, { notes: args.new_notes });
      return { success: true, order_number: updated.order_number };
    }

    case "update_shipping_address": {
      const updated = await updateOrder(args.order_id, { shipping_address: args.new_shipping_address });
      return { success: true, order_number: updated.order_number };
    }

    case "cancel_order": {
      const updated = await updateOrder(args.order_id, { status: "cancelled" });
      return { success: true, order_number: updated.order_number, status: "cancelled" };
    }

    case "delete_order": {
      await deleteOrder(args.order_id);
      return { success: true };
    }

    case "get_order_statistics": {
      const stats = await fetchOrderStatistics();
      return { stats };
    }

    default:
      return { error: `Unknown order_management action: ${args.action}` };
  }
}

// ── Per-user conversation history ─────────────────────────────────────────────
const histories = new Map();

function getHistory(from) {
  if (!histories.has(from)) histories.set(from, []);
  return histories.get(from);
}

function trimHistory(from) {
  const h = histories.get(from) || [];
  if (h.length > 30) h.splice(0, h.length - 30);
}

// ── Token usage tracking ──────────────────────────────────────────────────────
// Gemini 2.5 Flash Lite pricing (USD per 1M tokens) as of 2025
const GEMINI_PRICE_INPUT_USD_PER_1M  = 0.075;
const GEMINI_PRICE_OUTPUT_USD_PER_1M = 0.30;
const DEEPSEEK_PRICE_INPUT_USD_PER_1M  = 0.27;  // deepseek-chat
const DEEPSEEK_PRICE_OUTPUT_USD_PER_1M = 1.10;
const USD_TO_INR = 83.5;

// chatLogs: Map<phone, Array<{id, timestamp, userText, reply, provider, model, inputTokens, outputTokens, costUSD, costINR}>>
const chatLogs = new Map();

export function getChatLog(phone) {
  const key = phone.replace(/[^0-9]/g, "");
  return chatLogs.get(key) || [];
}

export function getAllChatSummaries() {
  const result = [];
  for (const [phone, logs] of chatLogs.entries()) {
    const totalInput  = logs.reduce((s, l) => s + (l.inputTokens  || 0), 0);
    const totalOutput = logs.reduce((s, l) => s + (l.outputTokens || 0), 0);
    const totalCostINR = logs.reduce((s, l) => s + (l.costINR || 0), 0);
    result.push({
      phone,
      messageCount: logs.length,
      lastMessage: logs[logs.length - 1]?.timestamp || null,
      totalInputTokens: totalInput,
      totalOutputTokens: totalOutput,
      totalCostINR: +totalCostINR.toFixed(4),
    });
  }
  return result.sort((a, b) => (b.lastMessage || "") > (a.lastMessage || "") ? 1 : -1);
}

function recordUsage(from, { userText, reply, provider, model, inputTokens, outputTokens }) {
  const phone = from.replace(/[^0-9]/g, "");
  if (!chatLogs.has(phone)) chatLogs.set(phone, []);
  const logs = chatLogs.get(phone);

  let costUSD = 0;
  if (provider === "gemini") {
    costUSD = (inputTokens / 1_000_000) * GEMINI_PRICE_INPUT_USD_PER_1M
            + (outputTokens / 1_000_000) * GEMINI_PRICE_OUTPUT_USD_PER_1M;
  } else {
    costUSD = (inputTokens / 1_000_000) * DEEPSEEK_PRICE_INPUT_USD_PER_1M
            + (outputTokens / 1_000_000) * DEEPSEEK_PRICE_OUTPUT_USD_PER_1M;
  }
  const costINR = costUSD * USD_TO_INR;

  logs.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    userText,
    reply,
    provider,
    model,
    inputTokens,
    outputTokens,
    costUSD: +costUSD.toFixed(6),
    costINR: +costINR.toFixed(4),
  });

  // Keep last 500 logs per user
  if (logs.length > 500) logs.splice(0, logs.length - 500);
}

// ── Gemini agentic loop ───────────────────────────────────────────────────────
async function runGeminiAgent(from, phone, userText) {
  const history = getHistory(from);

  // Add current user message
  history.push({ role: "user", parts: [{ text: userText }] });

  for (let mi = geminiModelIdx; mi < GEMINI_MODELS.length; mi++) {
    const model = GEMINI_MODELS[mi];
    const apiKey = nextKey();

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({
        model,
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      });

      // Agentic loop — allow multiple tool call rounds
      let MAX_ROUNDS = 6;
      while (MAX_ROUNDS-- > 0) {
        const chat = geminiModel.startChat({ history: history.slice(0, -1) });
        const result = await chat.sendMessage(history[history.length - 1].parts);
        const response = result.response;

        const functionCalls = response.functionCalls();

        if (!functionCalls || functionCalls.length === 0) {
          // Final text response
          const reply = response.text();
          history.push({ role: "model", parts: [{ text: reply }] });
          trimHistory(from);
          keyFailures.set(apiKey, 0);
          geminiModelIdx = mi;

          // Record token usage
          const usage = response.usageMetadata || {};
          recordUsage(from, {
            userText,
            reply,
            provider: "gemini",
            model,
            inputTokens:  usage.promptTokenCount     || 0,
            outputTokens: usage.candidatesTokenCount || 0,
          });

          return reply;
        }

        // Execute all tool calls in parallel
        const toolResults = await Promise.all(
          functionCalls.map((fc) => executeTool(fc.name, fc.args || {}, phone))
        );

        // Append function call turn (model) + function response turn (user) to history
        history.push({
          role: "model",
          parts: functionCalls.map((fc) => ({ functionCall: { name: fc.name, args: fc.args || {} } })),
        });
        history.push({
          role: "user",
          parts: functionCalls.map((fc, i) => ({
            functionResponse: { name: fc.name, response: toolResults[i] },
          })),
        });
      }

      throw new Error("Max tool call rounds exceeded");

    } catch (err) {
      const msg = err.message || "";
      console.error(`[Gemini] ${model} / …${apiKey.slice(-6)}: ${msg}`);
      if (msg.includes("429") || msg.includes("quota") || msg.includes("rate")) {
        keyFailures.set(apiKey, (keyFailures.get(apiKey) || 0) + 1);
      }
      if (msg.includes("503") || msg.includes("overloaded") || msg.includes("404") || msg.includes("not found")) {
        continue; // try next model
      }
      if (mi === GEMINI_MODELS.length - 1) throw err;
    }
  }

  throw new Error("All Gemini models exhausted");
}

// ── DeepSeek text fallback (no tool calling) ──────────────────────────────────
async function runDeepSeekFallback(from, userText) {
  if (!deepseek) throw new Error("DeepSeek not configured");

  const history = getHistory(from);
  // Build simple text history for DeepSeek (skip function call/response parts)
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history
      .filter((h) => h.parts?.every((p) => p.text != null))
      .map((h) => ({
        role: h.role === "model" ? "assistant" : "user",
        content: h.parts.map((p) => p.text).join(""),
      })),
    { role: "user", content: userText },
  ];

  const res = await deepseek.chat.completions.create({
    model: DEEPSEEK_MODEL,
    messages,
    max_tokens: 1024,
  });

  const reply = res.choices[0].message.content;
  history.push({ role: "user",  parts: [{ text: userText }] });
  history.push({ role: "model", parts: [{ text: reply }] });
  trimHistory(from);

  const usage = res.usage || {};
  recordUsage(from, {
    userText,
    reply,
    provider: "deepseek",
    model: DEEPSEEK_MODEL,
    inputTokens:  usage.prompt_tokens     || 0,
    outputTokens: usage.completion_tokens || 0,
  });

  return reply;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Main entry point — send a user message to the AI agent and get a reply.
 * The AI will call tools as needed (products, orders, profile) and respond naturally.
 */
export async function agentReply(from, phone, userText) {
  // Try Gemini with tool calling
  if (GEMINI_KEYS.length > 0) {
    try {
      const reply = await runGeminiAgent(from, phone, userText);
      console.error(`[AI:gemini] ${from}: replied (${reply.length} chars)`);
      return reply;
    } catch (err) {
      console.error(`[AI] Gemini failed, falling back to DeepSeek: ${err.message}`);
      // Remove the user message we added to history since Gemini failed
      const h = getHistory(from);
      if (h.length && h[h.length - 1].role === "user") h.pop();
    }
  }

  // DeepSeek text fallback
  if (deepseek) {
    const reply = await runDeepSeekFallback(from, userText);
    console.error(`[AI:deepseek] ${from}: replied (${reply.length} chars)`);
    return reply;
  }

  throw new Error("No AI provider available");
}

export function clearHistory(from) {
  histories.delete(from);
}

export function getProviderStatus() {
  return {
    gemini: {
      keys: GEMINI_KEYS.length,
      models: GEMINI_MODELS,
      currentModel: GEMINI_MODELS[geminiModelIdx] || null,
    },
    deepseek: { available: !!deepseek, model: DEEPSEEK_MODEL },
  };
}
