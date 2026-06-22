# ChatSphere 💬

ChatSphere is a modern, real-time chat application featuring secure group chatrooms and instant 1-to-1 direct messaging.

## ✨ Features

- **Room Join Requirement**: Users must explicitly join a chatroom before they can read history or send messages, ensuring controlled group conversations.
- **1-to-1 Direct Messaging (DMs)**: Chat privately with other registered users in the sidebar.
- **Real-Time Updates**: Instant message delivery and typing indicators powered by WebSockets.
- **Online Presence**: Real-time online/offline status dots in the sidebar for direct messages.
- **Robust Registration**: Supports long names (up to 50 characters) and displays secure JWT-based authentication.
- **Vercel Routing Optimized**: Includes a `vercel.json` rewrite configuration to prevent 404 errors on browser page reloads.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Socket.IO Client, Vanilla CSS (harmonious dark mode + glassmorphism theme)
- **Backend**: Node.js, Express, Socket.IO, MongoDB, Mongoose

---

## 🚀 Local Development Setup

Clone the repository and run both the backend and frontend.

### 1. Backend Setup
Navigate to the `backend/` directory:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatsphere
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
```

Start the development server:
```bash
npm run dev
```

### 2. Frontend Setup
Navigate to the `frontend/` directory:
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend/` folder:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

Start the Vite development server:
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🌐 Deployment Configuration

- **Frontend (Vercel)**:
  - Framework Preset: `Vite`
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Root Directory: `frontend`
  - Environment variables: `VITE_API_URL` and `VITE_SOCKET_URL` (pointing to the Render URL).
  - Routes are configured in `vercel.json` to handle client-side routing.

- **Backend (Render)**:
  - Environment: `Node`
  - Root Directory: `backend`
  - Build Command: `npm install`
  - Start Command: `node src/server.js` (uses standard optimized Node.js instead of dev servers)
  - Environment variables: `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_URL` (pointing to the Vercel URL).
