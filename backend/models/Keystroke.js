import mongoose from 'mongoose';

const keystrokeSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  sessionId: { type: String, index: true },
  deviceId: { type: String },
  code: { type: String },
  type: { type: String, enum: ['down', 'up'] },
  t: { type: Number }, // client timestamp (ms, performance.now baseline)
  dwell: { type: Number },
  serverTs: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Keystroke', keystrokeSchema);
