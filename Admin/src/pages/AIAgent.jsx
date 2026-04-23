import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bot, Wifi, WifiOff, QrCode, RefreshCw, LogOut, Send,
  MessageSquare, Users, Coins, TrendingUp, ChevronRight,
  X, Clock, Zap, IndianRupee, AlertCircle, CheckCircle2,
  Loader2, ArrowLeft, Trash2
} from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const BOT_API = import.meta.env.VITE_BOT_API_URL || 'http://localhost:7998';

// ── helpers ───────────────────────────────────────────────────────────────────
const botFetch = (path, opts = {}) =>
  fetch(`${BOT_API}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });

function formatINR(val) {
  return `₹${Number(val || 0).toFixed(4)}`;
}
function formatNumber(n) {
  return Number(n || 0).toLocaleString('en-IN');
}
function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(iso).toLocaleDateString('en-IN');
}
function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ connected, qrPending }) => {
  if (connected) return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
      <CheckCircle2 size={14} /> Connected
    </span>
  );
  if (qrPending) return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
      <QrCode size={14} /> Waiting for QR Scan
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
      <AlertCircle size={14} /> Disconnected
    </span>
  );
};

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = 'violet' }) => {
  const colors = {
    violet: 'bg-violet-50 text-violet-600',
    green:  'bg-green-50  text-green-600',
    blue:   'bg-blue-50   text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-dark-100 p-5 flex items-center gap-4">
      <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', colors[color])}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs text-dark-400 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-dark-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-dark-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

// ── Chat log drawer ───────────────────────────────────────────────────────────
const ChatDrawer = ({ phone, onClose, onSend }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendText, setSendText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const r = await botFetch(`/api/chats/${phone}`);
      const data = await r.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [phone]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  const handleSend = async () => {
    if (!sendText.trim()) return;
    setSending(true);
    try {
      const r = await botFetch('/api/send', { method: 'POST', body: JSON.stringify({ to: phone, text: sendText.trim() }) });
      if (r.ok) {
        toast.success('Message sent');
        setSendText('');
        onSend?.();
      } else {
        toast.error('Failed to send');
      }
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Clear AI conversation history for this user?')) return;
    await botFetch(`/api/chats/${phone}/clear`, { method: 'POST' });
    toast.success('History cleared');
    load();
  };

  const totalCost = logs.reduce((s, l) => s + (l.costINR || 0), 0);
  const totalTokens = logs.reduce((s, l) => s + (l.inputTokens || 0) + (l.outputTokens || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative ml-auto w-full max-w-2xl h-full bg-white flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-dark-100 flex-shrink-0">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-dark-900 truncate">+{phone}</p>
            <p className="text-xs text-dark-400">{logs.length} AI exchanges • {formatNumber(totalTokens)} tokens • {formatINR(totalCost)}</p>
          </div>
          <button onClick={handleClear} title="Clear history" className="p-1.5 rounded-lg hover:bg-red-50 text-dark-400 hover:text-red-600">
            <Trash2 size={18} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="animate-spin text-violet-500" size={28} />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-dark-400">
              <MessageSquare size={36} className="mb-2 opacity-30" />
              <p className="text-sm">No AI exchange logs yet</p>
            </div>
          ) : logs.map((log) => (
            <div key={log.id} className="space-y-2">
              {/* User bubble */}
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-violet-600 text-white rounded-2xl rounded-tr-md px-4 py-2.5">
                  <p className="text-sm leading-relaxed">{log.userText}</p>
                  <p className="text-xs text-violet-200 mt-1 text-right">{formatTime(log.timestamp)}</p>
                </div>
              </div>
              {/* Bot reply */}
              <div className="flex justify-start">
                <div className="max-w-[80%] bg-dark-50 rounded-2xl rounded-tl-md px-4 py-2.5">
                  <p className="text-sm leading-relaxed text-dark-800 whitespace-pre-wrap">{log.reply}</p>
                  {/* Token/cost info */}
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-dark-100 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-dark-400">
                      <Zap size={11} />
                      {formatNumber(log.inputTokens)} in / {formatNumber(log.outputTokens)} out
                    </span>
                    <span className="flex items-center gap-1 text-xs text-dark-400">
                      <IndianRupee size={11} />
                      {formatINR(log.costINR)}
                    </span>
                    <span className="text-xs text-dark-300 ml-auto">{log.provider}/{log.model?.split('-').slice(-2).join('-')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Send message */}
        <div className="px-5 py-4 border-t border-dark-100 flex-shrink-0">
          <div className="flex gap-2">
            <input
              className="flex-1 border border-dark-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder={`Send message to +${phone}…`}
              value={sendText}
              onChange={e => setSendText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={sending || !sendText.trim()}
              className="px-4 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium transition-colors"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AIAgent() {
  const [status, setStatus] = useState(null);
  const [qr, setQr] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [tab, setTab] = useState('overview'); // 'overview' | 'chats'

  const pollRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    try {
      const r = await botFetch('/api/status');
      if (r.ok) setStatus(await r.json());
    } catch { /* bot may be offline */ }
  }, []);

  const fetchQr = useCallback(async () => {
    try {
      const r = await botFetch('/api/qr');
      if (r.ok) {
        const d = await r.json();
        setQr(d.qr || null);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const r = await botFetch('/api/analytics');
      if (r.ok) {
        const d = await r.json();
        setAnalytics(d);
        setUsers(d.users || []);
      }
    } catch { /* ignore */ }
  }, []);

  const refresh = useCallback(() => {
    fetchStatus();
    fetchQr();
    fetchAnalytics();
  }, [fetchStatus, fetchQr, fetchAnalytics]);

  useEffect(() => {
    refresh();
    pollRef.current = setInterval(refresh, 5000);
    return () => clearInterval(pollRef.current);
  }, [refresh]);

  const handleLogout = async () => {
    if (!confirm('Log out WhatsApp? You will need to scan the QR code again.')) return;
    setLoadingLogout(true);
    try {
      const r = await botFetch('/api/logout', { method: 'POST' });
      const d = await r.json();
      if (r.ok) { toast.success(d.message || 'Logged out'); refresh(); }
      else toast.error(d.error || 'Logout failed');
    } finally {
      setLoadingLogout(false);
    }
  };

  const botOnline = !!status;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Bot size={22} className="text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-dark-900">AI Agent</h1>
            <p className="text-sm text-dark-400">WhatsApp bot control & analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {status ? <StatusBadge connected={status.connected} qrPending={status.qrPending} /> : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-dark-100 text-dark-500 text-sm">
              <Loader2 size={14} className="animate-spin" /> Connecting…
            </span>
          )}
          <button onClick={refresh} className="p-2 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-900 transition-colors" title="Refresh">
            <RefreshCw size={18} />
          </button>
          {status?.connected && (
            <button
              onClick={handleLogout}
              disabled={loadingLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loadingLogout ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
              Logout
            </button>
          )}
        </div>
      </div>

      {/* ── Bot offline notice ── */}
      {!botOnline && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800">Bot server not reachable</p>
            <p className="text-sm text-amber-600 mt-0.5">
              Make sure the bot is running: <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">cd whatsapp-mcp && npm run bot</code>
              &nbsp;(server at <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">{BOT_API}</code>)
            </p>
          </div>
        </div>
      )}

      {/* ── QR Code (when not connected) ── */}
      {botOnline && !status?.connected && (
        <div className="bg-white border border-dark-100 rounded-2xl p-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-amber-600">
            <QrCode size={20} />
            <h2 className="font-semibold">Scan QR Code to Connect WhatsApp</h2>
          </div>
          {qr ? (
            <>
              <img src={qr} alt="WhatsApp QR Code" className="w-64 h-64 rounded-xl border border-dark-100" />
              <p className="text-sm text-dark-500 text-center max-w-xs">
                Open <strong>WhatsApp</strong> on your phone → <strong>Linked Devices</strong> → <strong>Link a Device</strong> → scan this QR code
              </p>
              <p className="text-xs text-dark-400">QR refreshes automatically every 5 seconds</p>
            </>
          ) : (
            <div className="w-64 h-64 flex items-center justify-center bg-dark-50 rounded-xl border border-dark-100">
              <div className="text-center text-dark-400">
                <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                <p className="text-sm">Waiting for QR code…</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Connected status ── */}
      {status?.connected && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-800">WhatsApp Connected</p>
            <p className="text-sm text-green-600">Active number: <strong>{status.phoneNumber}</strong></p>
          </div>
          <div className="ml-auto text-sm text-green-600">
            AI: <strong>{status.ai?.gemini?.currentModel || 'Gemini'}</strong>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-dark-50 rounded-xl p-1 w-fit">
        {[['overview', TrendingUp, 'Overview'], ['chats', MessageSquare, 'Chat Logs']].map(([key, Icon, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === key ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500 hover:text-dark-900'
            )}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard icon={Users}       color="violet" label="Total Users"    value={formatNumber(analytics?.totalUsers)}   sub="unique WhatsApp numbers" />
            <StatCard icon={MessageSquare} color="blue" label="AI Exchanges"   value={formatNumber(analytics?.totalMessages)} sub="total conversations" />
            <StatCard icon={Zap}         color="orange" label="Total Tokens"   value={formatNumber((analytics?.totalInputTokens || 0) + (analytics?.totalOutputTokens || 0))} sub={`${formatNumber(analytics?.totalInputTokens)} in / ${formatNumber(analytics?.totalOutputTokens)} out`} />
            <StatCard icon={IndianRupee} color="green"  label="Total Cost"     value={formatINR(analytics?.totalCostINR)}    sub="across all conversations" />
          </div>

          {/* Per-user cost table */}
          <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-100 flex items-center justify-between">
              <h2 className="font-semibold text-dark-900">User Cost Breakdown</h2>
              <span className="text-xs text-dark-400">{users.length} users</span>
            </div>
            {users.length === 0 ? (
              <div className="py-12 text-center text-dark-400">
                <Coins size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No data yet — start the bot and receive messages</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-dark-50 text-dark-500 text-xs uppercase tracking-wider">
                      <th className="px-5 py-3 text-left font-medium">Phone</th>
                      <th className="px-5 py-3 text-right font-medium">Messages</th>
                      <th className="px-5 py-3 text-right font-medium">Input tokens</th>
                      <th className="px-5 py-3 text-right font-medium">Output tokens</th>
                      <th className="px-5 py-3 text-right font-medium">Cost (INR)</th>
                      <th className="px-5 py-3 text-right font-medium">Last active</th>
                      <th className="px-5 py-3 text-right font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-50">
                    {users.map((u) => (
                      <tr key={u.phone} className="hover:bg-dark-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-dark-900">+{u.phone}</td>
                        <td className="px-5 py-3.5 text-right text-dark-600">{u.messageCount}</td>
                        <td className="px-5 py-3.5 text-right text-dark-500">{formatNumber(u.totalInputTokens)}</td>
                        <td className="px-5 py-3.5 text-right text-dark-500">{formatNumber(u.totalOutputTokens)}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-green-700">{formatINR(u.totalCostINR)}</td>
                        <td className="px-5 py-3.5 text-right text-dark-400 text-xs">{timeAgo(u.lastMessage)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => { setSelectedPhone(u.phone); setTab('chats'); }}
                            className="text-violet-600 hover:text-violet-800 flex items-center gap-1 ml-auto text-xs font-medium"
                          >
                            View <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Chat Logs tab ── */}
      {tab === 'chats' && (
        <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-100">
            <h2 className="font-semibold text-dark-900">Chat Logs</h2>
            <p className="text-xs text-dark-400 mt-0.5">Click a user to view their full conversation with token + cost breakdown</p>
          </div>
          {users.length === 0 ? (
            <div className="py-12 text-center text-dark-400">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No chat logs yet</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-50">
              {users.map((u) => (
                <button
                  key={u.phone}
                  onClick={() => setSelectedPhone(u.phone)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-dark-50/60 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 text-violet-700 font-bold text-sm">
                    {u.phone.slice(-2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark-900">+{u.phone}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-dark-400 flex items-center gap-1">
                        <MessageSquare size={11} /> {u.messageCount} messages
                      </span>
                      <span className="text-xs text-dark-400 flex items-center gap-1">
                        <Zap size={11} /> {formatNumber(u.totalInputTokens + u.totalOutputTokens)} tokens
                      </span>
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <IndianRupee size={11} /> {formatINR(u.totalCostINR)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-dark-400">{timeAgo(u.lastMessage)}</span>
                    <ChevronRight size={16} className="text-dark-300" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Chat drawer ── */}
      {selectedPhone && (
        <ChatDrawer
          phone={selectedPhone}
          onClose={() => setSelectedPhone(null)}
          onSend={refresh}
        />
      )}
    </div>
  );
}
