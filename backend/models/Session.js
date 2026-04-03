import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    metrics: {
        typingSpeed: Number,
        scrollSpeed: Number,
        mouseVelocity: Number,
        idleTime: Number,
        isAnomalous: { type: Boolean, default: false }
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const Session = mongoose.model('Session', sessionSchema, 'Sessions');
export default Session;
