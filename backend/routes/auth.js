import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import nodemailer from 'nodemailer';
import { sendOtpEmail } from '../utils/mail.js';

const router = express.Router();

// In-memory OTP storage for the demo
const otpStore = new Map();

// Check if email exists
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ exists: false, message: 'Email required' });

    // Normalize email for check
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[AUTH] Checking registration status for node: ${normalizedEmail}`);

    // User Model check (Users collection)
    const user = await User.findOne({ email: new RegExp(`^${normalizedEmail}$`, 'i') });

    if (user) {
      console.warn(`[AUTH] Access Denied: Node ${normalizedEmail} already registered.`);
      return res.status(200).json({ exists: true, message: 'Identity node already registered.' });
    }

    console.log(`[AUTH] Success: Node ${normalizedEmail} available for enrolment.`);
    return res.status(200).json({ exists: false });
  } catch (error) {
    console.error('[AUTH] Critical Lookup Error:', error.message);
    res.status(500).json({ success: false, message: 'Database lookup failed' });
  }
});

router.post('/send-otp', async (req, res) => {
  try {
    const { email, name } = req.body;
    console.log(`!!! [CRITICAL DEBUG] OTP REQUEST RECEIVED FOR: ${email} !!!`);
    
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    // TEMPORARY: Respond success immediately to see if it hits the logs
    res.status(200).json({ success: true, message: 'Test: Request reached server' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, otp);
    setTimeout(() => otpStore.delete(email), 10 * 60 * 1000);
    
    // Fire and forget the email so the route doesn't hang
    sendOtpEmail(email, name, otp).catch(e => console.error("Async Email Error:", e));
    
  } catch (error) {
    console.error('OTP Route Error:', error);
  }
});

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, otp, pin, phone } = req.body;

    // Verify OTP (Bypass for demo: 000000)
    const storedOtp = otpStore.get(email);
    if (otp !== '000000' && (!storedOtp || storedOtp !== otp)) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP after use
    otpStore.delete(email);

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }


    const user = await User.create({
      name,
      email,
      phone,
      password,
      pin,
      balance: 0,
      isEnrolled: true,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '30d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Required for cross-site cookie
      sameSite: 'none', // Allow cookie to work across different domains (Vercel -> Render)
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        balance: user.balance,
        phone: user.phone,
        isEnrolled: user.isEnrolled,
        trustScore: user.trustScore,
        isLocked: user.isLocked,
        behavioralBaseline: user.behavioralBaseline,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Unlock account and reset strikes upon successful password login
    if (user.isLocked || user.strikeCount > 0) {
      user.isLocked = false;
      user.strikeCount = 0;
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '30d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Required for cross-site cookie
      sameSite: 'none', // Allow cookie to work across different domains (Vercel -> Render)
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        balance: user.balance,
        isEnrolled: user.isEnrolled,
        trustScore: user.trustScore,
        isLocked: user.isLocked,
        strikeCount: user.strikeCount || 0,
        behavioralBaseline: user.behavioralBaseline,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bio-Signature Login (Passwordless)
router.post('/bio-login', async (req, res) => {
  try {
    const { email, typingSpeed } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Identity node not found.' });
    }

    // Unlock account and reset strikes upon successful bio-login
    if (user.isLocked || user.strikeCount > 0) {
      user.isLocked = false;
      user.strikeCount = 0;
      await user.save();
    }

    // Heuristic: Must be within 40% of baseline to pass (Hackathon demo logic)
    const baseline = user.behavioralBaseline.typingSpeedAvg || 0;
    const diff = Math.abs(baseline - typingSpeed);

    // If they have no baseline yet, they must use password first
    if (baseline === 0) {
      return res.status(400).json({ message: 'No behavioral profile found. Please use password login once to enroll.' });
    }

    if (diff > (baseline * 0.4)) {
      return res.status(401).json({ message: 'Biological Signature Rejected. Rhythm deviation too high.' });
    }

    // Success
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Required for cross-site cookie
      sameSite: 'none', // Allow cookie to work across different domains (Vercel -> Render)
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      bioVerified: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        trustScore: user.trustScore,
        isLocked: user.isLocked,
        behavioralBaseline: user.behavioralBaseline,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    expires: new Date(0),
  });
  res.status(200).json({ success: true, message: 'Logged out' });
});

// Get Profile
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(401).json({ message: 'Token invalid' });
  }
});

// Verify PIN
router.post('/verify-pin', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Session expired' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const { pin } = req.body;

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePin(pin);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid Transaction PIN' });
    }

    // Success: Unlock the account (Preserve strikes for cumulative policy)
    user.isLocked = false;
    await user.save();

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed' });
  }
});

// Lock account & increment strike count
router.post('/lock', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Increment strike count and set isLocked to true
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.isLocked = true;
    user.strikeCount = (user.strikeCount || 0) + 1;
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: 'Node Lockdown Active', 
      strikeCount: user.strikeCount 
    });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// Update Profile
router.patch('/profile', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const { name, email, phone } = req.body;

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        balance: user.balance,
        isEnrolled: user.isEnrolled,
        trustScore: user.trustScore,
        isLocked: user.isLocked,
        behavioralBaseline: user.behavioralBaseline
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update Avatar
router.patch('/profile/avatar', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const { avatar } = req.body;

    if (!avatar) return res.status(400).json({ message: 'No image data provided' });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.avatar = avatar;
    await user.save();

    res.status(200).json({ success: true, avatar: user.avatar });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
