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
    default: 124500,
  },
  isEnrolled: {
    type: Boolean,
    default: false,
  },
  trustScore: {
    type: Number,
    default: 0.7,
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

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
