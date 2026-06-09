# P2P WebShare 🚀

> Direct browser-to-browser file transfer. No servers see your files. Ever.

Built with **WebRTC**, **React**, **Node.js + Socket.io**, and **Tailwind CSS**.

---

## How It Works

```
SENDER → drops file → creates room → shares link
RECEIVER → opens link → WebRTC handshake (via signaling server, ~2s)
SENDER ←→ RECEIVER: Direct P2P stream (server gone)
```

The signaling server only facilitates the initial handshake.
**Your file data never touches the server.**

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### 1. Clone & Install

```bash
git clone <your-repo>
cd p2p-web-share
npm run install:all
```

### 2. Environment Setup

```bash
# Client
cp client/.env.example client/.env

# Server
cp server/.env.example server/.env
```

### 3. Run in Development

```bash
npm run dev
```

This starts both:
- **Client** → http://localhost:5173
- **Server** → http://localhost:3001

### 4. Test It

1. Open http://localhost:5173 in **Tab 1**
2. Drop a file and click **Create Transfer Room**
3. Copy the room link
4. Open the link in **Tab 2** (or another device on your network)
5. Watch the file transfer directly between browsers!

---

## Project Structure

```
p2p-web-share/
├── client/                    # React frontend (Vite)
│   └── src/
│       ├── components/        # UI components
│       ├── hooks/             # WebRTC, Socket, Transfer logic
│       ├── pages/             # Home + Room pages
│       ├── store/             # Zustand state
│       └── utils/             # Crypto, Chunker, Downloader
└── server/                    # Node.js signaling server
    └── src/
        ├── handlers/          # Socket event handlers
        └── utils/             # Room manager, utilities
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| P2P | WebRTC (native browser API) |
| Signaling | Node.js + Express + Socket.io |
| State | Zustand |
| Verification | Web Crypto API (SHA-256) |
| Fonts | Syne + DM Sans + JetBrains Mono |

---


