const express    = require("express");
const http       = require("http");
const { Server } = require("socket.io");
const Database   = require("better-sqlite3");
const cors       = require("cors");
const path       = require("path");

const PORT    = 3001;
const DB_PATH = path.join(__dirname, "chat.db");
const MAX_MSG_LENGTH = 500;
const MSG_PAGE_SIZE  = 50;
const RATE_LIMIT_MS  = 2000; // min ms between messages per wallet

// ── Database ──────────────────────────────────────────────────
const db = new Database(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet    TEXT    NOT NULL,
    ens       TEXT,
    text      TEXT    NOT NULL,
    room      TEXT    NOT NULL DEFAULT 'general',
    reply_to  INTEGER,
    ts        INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_room_ts ON messages(room, ts);

  CREATE TABLE IF NOT EXISTS rooms (
    name  TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    desc  TEXT
  );
  INSERT OR IGNORE INTO rooms VALUES ('general',  'General',  'Open discussion');
  INSERT OR IGNORE INTO rooms VALUES ('hoard',    'Hoard',    'Strategy for locking tokens');
  INSERT OR IGNORE INTO rooms VALUES ('burn',     'Burn',     'The conviction to destroy');
  INSERT OR IGNORE INTO rooms VALUES ('exit',     'Exit',     'Liquidity and freedom');
`);

const getMessages = db.prepare(`
  SELECT * FROM messages WHERE room = ? ORDER BY ts DESC LIMIT ?
`);
const insertMessage = db.prepare(`
  INSERT INTO messages (wallet, ens, text, room, reply_to, ts)
  VALUES (@wallet, @ens, @text, @room, @reply_to, @ts)
`);
const getRooms = db.prepare(`SELECT * FROM rooms`);

// ── Express + Socket.io ───────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: "*", methods: ["GET","POST"] },
  transports: ["websocket", "polling"],
});

app.use(cors());
app.use(express.json());

// REST: get rooms
app.get("/api/rooms", (req, res) => {
  res.json(getRooms.all());
});

// REST: get message history for a room
app.get("/api/messages/:room", (req, res) => {
  const { room } = req.params;
  const msgs = getMessages.all(room, MSG_PAGE_SIZE).reverse();
  res.json(msgs);
});

// Rate limit map: wallet → last message timestamp
const rateLimits = new Map();

// Online users map: socketId → wallet
const online = new Map();

io.on("connection", (socket) => {
  let myWallet = null;

  // Client announces their wallet on connect
  socket.on("join", ({ wallet, room = "general" }) => {
    if (!wallet || typeof wallet !== "string") return;
    myWallet = wallet.toLowerCase();
    socket.data.wallet = myWallet;
    socket.data.room   = room;
    online.set(socket.id, myWallet);
    socket.join(room);
    // Broadcast updated online count for this room
    emitOnlineCount(room);
  });

  socket.on("switch_room", ({ room }) => {
    if (!room || typeof room !== "string") return;
    const prev = socket.data.room;
    if (prev) { socket.leave(prev); emitOnlineCount(prev); }
    socket.data.room = room;
    socket.join(room);
    emitOnlineCount(room);
  });

  socket.on("message", ({ text, room, ens, reply_to }) => {
    const wallet = socket.data.wallet;
    if (!wallet || !text || typeof text !== "string") return;
    const clean = text.trim().slice(0, MAX_MSG_LENGTH);
    if (!clean) return;

    // Rate limit
    const last = rateLimits.get(wallet) ?? 0;
    const now  = Date.now();
    if (now - last < RATE_LIMIT_MS) return;
    rateLimits.set(wallet, now);

    const msg = {
      wallet,
      ens:      ens ?? null,
      text:     clean,
      room:     room ?? "general",
      reply_to: reply_to ?? null,
      ts:       now,
    };
    const result = insertMessage.run(msg);
    const saved  = { id: result.lastInsertRowid, ...msg };
    io.to(msg.room).emit("message", saved);
  });

  socket.on("disconnect", () => {
    online.delete(socket.id);
    if (socket.data.room) emitOnlineCount(socket.data.room);
  });
});

function emitOnlineCount(room) {
  const count = [...io.sockets.sockets.values()].filter(s => s.data.room === room).length;
  io.to(room).emit("online_count", { room, count });
}

server.listen(PORT, () => console.log(`Chat server running on :${PORT}`));
