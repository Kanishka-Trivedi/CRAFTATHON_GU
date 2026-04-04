import dns from 'dns';
// Force Google DNS — bypasses restricted network DNS that blocks mongodb.net SRV records
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env explicitly — works whether run via `node` directly or via dotenvx
const envResult = dotenv.config({ path: path.join(__dirname, '.env') });
if (envResult.error) {
  console.warn('[ENV] Warning: Could not load .env file:', envResult.error.message);
} else {
  console.log('[ENV] Loaded:', Object.keys(envResult.parsed || {}).join(', '));
}

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import transferRoutes from './routes/transfer.js';
import behavioralRoutes from './routes/behavioral.js';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true, // Universal acceptance for demo period
  credentials: true,
}));

// Connect to MongoDB Atlas (Now with DNS-Resilience)
const connectDB = async () => {
  const options = {
    connectTimeoutMS: 15000,
    serverSelectionTimeoutMS: 15000,
    family: 4, // Force IPv4 — fixes ECONNREFUSED on restrictive networks (DNS SRV over IPv6 often fails)
    dbName: 'behaveguard'
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
app.use('/api/transfer', transferRoutes);
app.use('/api/behavioral', behavioralRoutes);

app.get('/', (req, res) => {
  res.send('BehaveGuard API is running...');
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

app.listen(PORT, () => {
  connectDB();
  console.log(`[SERVER] Ready: Port ${PORT}`);
  console.log(`[EMAIL] Active: ${process.env.EMAIL_USER}`);
});
