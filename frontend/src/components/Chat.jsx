import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Link2, CheckCircle2, Loader2 } from "lucide-react";
import ParadoxLogABI from "../contracts/ParadoxLog.json";
import { CONTRACT_ADDRESSES } from "../contracts/addresses.js";

const LOG_ADDRESS = CONTRACT_ADDRESSES.ParadoxLog;
const LOG_ENABLED = LOG_ADDRESS !== "0x0000000000000000000000000000000000000000";

const SOCKET_URL = window.location.origin;

const ROOMS = [
  { id: "general", label: "General",  icon: "💬", desc: "Open discussion" },
  { id: "hoard",   label: "Hoard",    icon: "🔒", desc: "Locking strategy" },
  { id: "burn",    label: "Burn",     icon: "🔥", desc: "Conviction & sacrifice" },
  { id: "exit",    label: "Exit",     icon: "🌊", desc: "Liquidity & freedom" },
];

function shortAddr(addr) {
  if (!addr) return "???";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function addrColor(addr) {
  if (!addr) return "#7c3aed";
  const hue = parseInt(addr.slice(2, 8), 16) % 360;
  return `hsl(${hue}, 70%, 65%)`;
}

function Avatar({ wallet, size = 32 }) {
  const color = addrColor(wallet);
  const initials = wallet ? wallet.slice(2, 4).toUpperCase() : "??";
  return (
    <div
      style={{ background: color, width: size, height: size, minWidth: size, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, color: "#0a0a0f", fontFamily: "monospace" }}
    >
      {initials}
    </div>
  );
}

function Message({ msg, myWallet, replyTarget }) {
  const isMe = msg.wallet?.toLowerCase() === myWallet?.toLowerCase();
  const name = msg.ens || shortAddr(msg.wallet);
  const time = new Date(msg.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 group ${isMe ? "flex-row-reverse" : ""}`}
    >
      <Avatar wallet={msg.wallet} size={32} />
      <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className={`flex items-center gap-2 text-xs ${isMe ? "flex-row-reverse" : ""}`}>
          <span className="font-mono font-bold" style={{ color: addrColor(msg.wallet) }}>{name}</span>
          <span className="text-slate-600">{time}</span>
        </div>
        {replyTarget && (
          <div className="text-xs text-slate-500 border-l-2 border-slate-600 pl-2 mb-1 italic truncate max-w-[200px]">
            ↩ {replyTarget.ens || shortAddr(replyTarget.wallet)}: {replyTarget.text}
          </div>
        )}
        <div className={`rounded-2xl px-4 py-2 text-sm leading-relaxed break-words ${
          isMe
            ? "bg-violet-600/40 text-white rounded-tr-sm"
            : "bg-white/5 border border-white/10 text-slate-200 rounded-tl-sm"
        }`}>
          {msg.text}
        </div>
      </div>
    </motion.div>
  );
}

export default function Chat() {
  const { address, isConnected } = useAccount();
  const [room, setRoom]         = useState("general");
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [online, setOnline]     = useState(0);
  const [replyTo, setReplyTo]   = useState(null);
  const [connected, setConnected] = useState(false);
  const [logOnChain, setLogOnChain] = useState(false);
  const socketRef    = useRef(null);
  const bottomRef    = useRef(null);
  const msgsRef      = useRef(null);  // messages scroll container
  const inputRef     = useRef(null);

  // On-chain write
  const { writeContract, data: txHash, isPending: txPending, reset: txReset } = useWriteContract();
  const { isLoading: txConfirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  useEffect(() => { if (txSuccess) { setTimeout(txReset, 3000); } }, [txSuccess, txReset]);

  // Load history from REST
  const loadHistory = useCallback(async (r) => {
    try {
      const res = await fetch(`/chat/api/messages/${r}`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (_) {}
  }, []);

  // Socket setup
  useEffect(() => {
    const socket = io(SOCKET_URL, { path: "/chat/socket.io", transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      if (address) socket.emit("join", { wallet: address, room });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("message", (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    socket.on("online_count", ({ room: r, count }) => {
      if (r === room) setOnline(count);
    });

    loadHistory(room);
    return () => socket.disconnect();
  }, []);

  // Join room when wallet connects
  useEffect(() => {
    if (address && socketRef.current?.connected) {
      socketRef.current.emit("join", { wallet: address, room });
    }
  }, [address]);

  // Switch rooms
  const switchRoom = (r) => {
    setRoom(r);
    setMessages([]);
    setReplyTo(null);
    loadHistory(r);
    if (socketRef.current?.connected) {
      socketRef.current.emit("switch_room", { room: r });
      if (address) socketRef.current.emit("join", { wallet: address, room: r });
    }
  };

  // Auto-scroll — only when a new live message arrives, not on history load or initial mount
  const prevMsgCount = useRef(0);
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; prevMsgCount.current = messages.length; return; }
    // Only scroll if count grew by exactly 1 (live message), not a bulk history load
    if (messages.length === prevMsgCount.current + 1) {
      // Scroll only the inner container — never the page
      if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
    prevMsgCount.current = messages.length;
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !address || !socketRef.current?.connected) return;
    const text = input.trim();
    socketRef.current.emit("message", {
      text,
      room,
      reply_to: replyTo?.id ?? null,
    });
    // Optionally inscribe permanently on-chain
    if (logOnChain && LOG_ENABLED) {
      writeContract({
        address: LOG_ADDRESS,
        abi: ParadoxLogABI.abi,
        functionName: "log",
        args: [room, text],
      });
    }
    setInput("");
    setReplyTo(null);
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const msgMap = Object.fromEntries(messages.map(m => [m.id, m]));

  return (
    <section id="chat" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-black tracking-tight text-white mb-2">
            Community <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">Discussion</span>
          </h2>
          <p className="text-slate-400 text-sm">Your wallet address is your identity. No account needed.</p>
        </motion.div>

        <div className="glass border border-white/10 rounded-2xl overflow-hidden" style={{ height: "600px", display: "flex", flexDirection: "column" }}>
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-500"}`} />
              <span className="text-xs text-slate-400 font-mono">{connected ? `${online} online` : "connecting…"}</span>
            </div>
            {isConnected && (
              <div className="flex items-center gap-2">
                <Avatar wallet={address} size={20} />
                <span className="text-xs font-mono text-slate-400">{shortAddr(address)}</span>
              </div>
            )}
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Room sidebar */}
            <div className="w-36 sm:w-44 border-r border-white/10 flex flex-col flex-shrink-0 overflow-y-auto">
              <div className="px-3 pt-3 pb-1 text-xs text-slate-600 font-mono uppercase tracking-wider">Rooms</div>
              {ROOMS.map(r => (
                <button
                  key={r.id}
                  onClick={() => switchRoom(r.id)}
                  className={`flex items-center gap-2 px-3 py-3 text-left transition-colors text-sm w-full ${
                    room === r.id
                      ? "bg-violet-600/20 text-white border-r-2 border-violet-500"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{r.icon}</span>
                  <span className="font-medium">{r.label}</span>
                </button>
              ))}
            </div>

            {/* Message area */}
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Messages */}
              <div ref={msgsRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
                {messages.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
                    No messages yet. Be the first to declare.
                  </div>
                )}
                {messages.map(msg => (
                  <Message
                    key={msg.id}
                    msg={msg}
                    myWallet={address}
                    replyTarget={msg.reply_to ? msgMap[msg.reply_to] : null}
                  />
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Reply banner */}
              <AnimatePresence>
                {replyTo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 py-2 bg-violet-900/30 border-t border-violet-500/30 flex items-center justify-between text-xs text-slate-400"
                  >
                    <span>↩ Replying to <span className="text-violet-300">{replyTo.ens || shortAddr(replyTo.wallet)}</span>: {replyTo.text.slice(0, 60)}</span>
                    <button onClick={() => setReplyTo(null)} className="text-slate-500 hover:text-white ml-3">✕</button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input area */}
              <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
                {!isConnected ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">Connect wallet to chat</span>
                    <w3m-button size="sm" balance="hide" />
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        maxLength={500}
                        placeholder={`Message #${room}…`}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!input.trim() || !connected}
                        className="btn-primary px-4 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Send
                      </button>
                    </div>
                    {/* On-chain toggle + tx status */}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-700">{input.length}/500</span>
                      {LOG_ENABLED && (
                        <button
                          onClick={() => setLogOnChain(v => !v)}
                          title="When enabled, messages are permanently inscribed onto the Polygon blockchain"
                          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all ${
                            logOnChain
                              ? "border-violet-500/60 bg-violet-500/15 text-violet-300"
                              : "border-white/10 text-slate-600 hover:text-slate-400 hover:border-white/20"
                          }`}
                        >
                          <Link2 size={11} />
                          {logOnChain ? "Logging on-chain ⛓" : "Log to chain"}
                        </button>
                      )}
                    </div>
                    {/* Tx feedback */}
                    <AnimatePresence>
                      {(txPending || txConfirming || txSuccess) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 flex items-center gap-2 text-xs"
                        >
                          {(txPending || txConfirming) && <Loader2 size={12} className="animate-spin text-violet-400" />}
                          {txSuccess && <CheckCircle2 size={12} className="text-green-400" />}
                          <span className={txSuccess ? "text-green-400" : "text-violet-400"}>
                            {txPending    && "Confirm in wallet…"}
                            {txConfirming && !txPending && "Inscribing on Polygon…"}
                            {txSuccess    && "Permanently recorded on-chain ✓"}
                          </span>
                          {txHash && (
                            <a
                              href={`https://polygonscan.com/tx/${txHash}`}
                              target="_blank" rel="noreferrer"
                              className="text-slate-600 hover:text-slate-400 underline"
                            >
                              view tx
                            </a>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
