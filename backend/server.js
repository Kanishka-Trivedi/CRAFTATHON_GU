import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Connect to MongoDB Atlas (Now with DNS-Resilience)
const connectDB = async () => {
  const options = {
    connectTimeoutMS: 10000,
  };

  try {
    // We try to connect to your Atlas string
    // Tip: If you still get DNS errors, try connecting to your phone hotspot!
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
