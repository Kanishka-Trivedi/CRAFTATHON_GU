import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import http from 'http';
import { WebSocketServer } from 'ws';
import Keystroke from './models/Keystroke.js';

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Allows BOTH your Next.js frontend and teammate's Vite frontend natively
  credentials: true,
}));

// Connect to MongoDB Atlas (Now with DNS-Resilience)
const connectDB = async () => {
  const options = {
    connectTimeoutMS: 10000,
    dbName: 'behaveguard' // Explicitly points the Auth API exactly to the teammate's 'behaveguard' database!
  };

  try {
    // Connect to the database using unified security options
    await mongoose.connect(process.env.MONGO_URI, options);
    console.log(`[DATABASE] Success: Connected to BehaveGuard Atlas Cluster`);
  } catch (error) {
    console.warn(`[DATABASE] Cloud Error: ${error.message}`);
    console.log(`[DATABASE] Falling back to Localhost so your demo doesn't stop...`);
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/behaveguard', options);
      console.log(`[DATABASE] Success: Connected to Local Host`);
    } catch (localError) {
      console.error(`[DATABASE] Critical: No database available.`);
    }
  }
};

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('BehaveGuard API is running...');
});

// Optional HTTP fallback for telemetry
app.post('/api/telemetry', async (req, res) => {
  try {
    const { userId, sessionId, deviceId, events = [] } = req.body || {};
    if (!userId || !Array.isArray(events)) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }
    const serverTs = new Date();
    const docs = events.map(e => ({
      userId,
      sessionId,
      deviceId,
      code: e.code,
      type: e.type,
      t: e.t,
      dwell: e.dwell,
      serverTs
    }));
    if (docs.length) await Keystroke.insertMany(docs, { ordered: false });
    res.json({ success: true, stored: docs.length });
  } catch (err) {
    console.error('[Telemetry POST] Error', err);
    res.status(500).json({ success: false, message: 'Telemetry store failed' });
  }
});

// Final Safety Shield
app.use((err, req, res, next) => {
  console.error('[SERVER CRASH PREVENTED]', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Security Error'
  });
});

const PORT = process.env.PORT || 5000;

// --- WebSocket ingestion for keystrokes ---
const wss = new WebSocketServer({ server, path: '/keystrokes' });

wss.on('connection', (ws, req) => {
  // In real use, validate auth (cookie/JWT) from req.headers here.
  ws.on('message', async (data) => {
    try {
      const payload = JSON.parse(data.toString());
      const { userId, sessionId, deviceId, events } = payload || {};
      if (!userId || !Array.isArray(events)) return;
      const serverTs = new Date();
      const docs = events.map(e => ({
        userId,
        sessionId,
        deviceId,
        code: e.code,
        type: e.type,
        t: e.t,
        dwell: e.dwell,
        serverTs
      }));
      if (docs.length) await Keystroke.insertMany(docs, { ordered: false });
    } catch (err) {
      console.error('[WS] bad payload', err.message);
    }
  });
});

server.listen(PORT, () => {
  connectDB();
  console.log(`[SERVER] Ready: Port ${PORT}`);
  console.log(`[EMAIL] Active: ${process.env.EMAIL_USER}`);
  console.log('[WS] Keystroke stream listening on /keystrokes');
});
