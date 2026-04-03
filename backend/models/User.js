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
  password: {
    type: String,
    required: true,
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
  pin: {
    type: String, // hashed 6-digit pin
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Modern Password Hashing (Async-only, No 'next' required)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.pre('save', async function () {
  if (!this.isModified('pin') || !this.pin) return;
  const salt = await bcrypt.genSalt(8);
  this.pin = await bcrypt.hash(this.pin, salt);
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.comparePin = async function (enteredPin) {
  if (!this.pin) return false;
  return await bcrypt.compare(enteredPin, this.pin);
};

const User = mongoose.model('User', userSchema, 'Users');
export default User;
