import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// In-memory OTP storage for the demo
const otpStore = new Map();

// Send OTP
router.post('/send-otp', (req, res) => {
  try {
    const { email, name } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000); // 6 digit OTP

    // Store it immediately so it works even if email fails
    otpStore.set(email, otp.toString());
    setTimeout(() => otpStore.delete(email), 10 * 60 * 1000);

    const mailOptions = {
      from: `"BehaveGuard Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your BehaveGuard Verification Code: ${otp}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background-color: #0A0B1A; color: white;">
          <h2 style="color: #6C63FF;">BehaveGuard Security</h2>
          <p>Hello ${name || 'User'},</p>
          <p>Your verification code for enrolment is:</p>
          <h1 style="background: rgba(108, 99, 255, 0.1); padding: 10px; border-radius: 10px; display: inline-block; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <hr style="border: none; border-top: 1px solid #ffffff1a; margin: 20px 0;">
          <p style="font-size: 10px; color: #8B8DB8;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    };
    
    // Create Transporter dynamically to ensure it reads the latest .env
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Background Task (Doesn't block the UI)
    transporter.sendMail(mailOptions)
      .then(() => console.log(`[REAL EMAIL] Code ${otp} sent to ${email}`))
      .catch(err => {
        console.warn('!!! REAL EMAIL FAILED !!!');
        console.warn('Error:', err.message);
      });

    // Return SUCCESS immediately to the UI
    return res.status(200).json({ 
      success: true, 
      message: 'Verification Code Pushed' 
    });
  } catch (error) {
    console.error('OTP Route Error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

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
      password,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '30d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
        isEnrolled: user.isEnrolled,
        trustScore: user.trustScore,
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '30d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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

export default router;
