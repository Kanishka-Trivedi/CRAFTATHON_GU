import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String, // E.164 format (+91...)
    required: false,
    default: '',
  },
  password: {
    type: String,
    required: true,
  },
  pin: {
    type: String, // 6-digit security PIN
    required: false,
  },
  avatar: {
    type: String,
    default: '👤',
  },
  balance: {
    type: Number,
    default: 0, // Cleared dummy balance for real-time integration
  },
  isEnrolled: {
    type: Boolean,
    default: false,
  },
  trustScore: {
    type: Number,
    default: 1.0, // Start users at a perfect 1.0 Trust Score
  },
  behavioralBaseline: {
    typingSpeedAvg: { type: Number, default: 6 }, // Realistic default
    scrollSpeedAvg: { type: Number, default: 200 },
    mouseVelocityAvg: { type: Number, default: 350 },
    sessionCount: { type: Number, default: 0 },
  },
  isLocked: {
    type: Boolean,
    default: false, // Persistent security lock for anomaly detection
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Modern Credential Hashing (Async-only)
userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  if (this.isModified('pin')) {
    const salt = await bcrypt.genSalt(10);
    this.pin = await bcrypt.hash(this.pin, salt);
  }
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Compare PIN
userSchema.methods.comparePin = async function (enteredPin) {
  if (!this.pin) return false;
  return await bcrypt.compare(enteredPin, this.pin);
};

const User = mongoose.model('User', userSchema, 'Users');
export default User;
