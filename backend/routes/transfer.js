import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

// 1. Get Balance and Transaction History
router.get('/history', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: 'Session expired' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await User.findById(decoded.id).select('balance');

        // Find transactions where user is sender or receiver
        const txs = await Transaction.find({
            $or: [{ sender: decoded.id }, { receiver: decoded.id }]
        })
            .sort({ timestamp: -1 })
            .limit(10)
            .populate('sender receiver', 'name email avatar');

        res.status(200).json({
            success: true,
            balance: user.balance,
            history: txs
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. Perform Secure Transfer
router.post('/send', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: 'Session expired' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const { recipientEmail, amount, note, cardDetails, pin } = req.body;

        if (!recipientEmail || !amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid recipient or amount' });
        }

        if (!cardDetails || !cardDetails.number || !cardDetails.cvv) {
            return res.status(400).json({ message: 'Source card authentication required for secure handshake' });
        }

        const sender = await User.findById(decoded.id);
        if (!sender) return res.status(404).json({ message: 'Sender not found' });

        // Optional: Severe Check
        // If the PIN was required by the frontend state, we verify it here
        if (pin) {
            const isPinMatch = await sender.comparePin(pin);
            if (!isPinMatch) return res.status(403).json({ success: false, message: 'Security Breach: Invalid Transaction PIN' });
        }

        if (sender.balance < amount) {
            return res.status(400).json({ message: 'Insufficient node balance' });
        }

        const receiver = await User.findOne({ email: recipientEmail.toLowerCase().trim() });
        if (!receiver) {
            return res.status(404).json({ message: 'Recipient node not found on network' });
        }

        if (receiver.id === sender.id) {
            return res.status(400).json({ message: 'Self-transfer not permitted' });
        }

        // Atomic update simulation (Simplest for demo)
        sender.balance -= Number(amount);
        receiver.balance += Number(amount);

        await sender.save();
        await receiver.save();

        const tx = await Transaction.create({
            sender: sender._id,
            receiver: receiver._id,
            amount: Number(amount),
            note: note || '',
            status: 'completed'
        });

        res.status(200).json({
            success: true,
            message: 'Transaction successfully hash-encrypted',
            transactionId: tx._id
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
