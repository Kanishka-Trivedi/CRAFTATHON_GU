import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();

const VERIFIED_CARDS = ['4000000000000012', '5105105105105105'];

// 1. Get Balance and Transaction History
router.get('/history', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: 'Session expired' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await User.findById(decoded.id).select('balance');

        const txs = await Transaction.find({
            $or: [{ sender: decoded.id }, { receiver: decoded.id }]
        })
            .sort({ timestamp: -1 })
            .limit(20)
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

// 2. Deposit funds using card details (adds money to sender's own account)
router.post('/deposit', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: 'Session expired' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const { amount, cardDetails } = req.body;

        if (!amount || amount <= 0 || amount > 1000000) {
            return res.status(400).json({ message: 'Invalid deposit amount (₹1 - ₹10,00,000)' });
        }

        if (!cardDetails || !cardDetails.number || !cardDetails.cvv || !cardDetails.expiry) {
            return res.status(400).json({ message: 'Full card authentication required (number, expiry, CVV)' });
        }

        // Validate card number (must be 16 digits)
        const cleanCard = cardDetails.number.replace(/\s/g, '');
        if (cleanCard.length !== 16 || !/^\d+$/.test(cleanCard)) {
            return res.status(400).json({ message: 'Invalid card number. Must be 16 digits.' });
        }

        if (!VERIFIED_CARDS.includes(cleanCard)) {
            return res.status(403).json({ message: 'Merchant rejected: Card not on verified BehaveGuard network.' });
        }

        // Validate CVV (3 digits)
        if (!/^\d{3}$/.test(cardDetails.cvv)) {
            return res.status(400).json({ message: 'Invalid CVV. Must be 3 digits.' });
        }

        // Validate expiry (MM/YY format, not expired)
        const expiryMatch = cardDetails.expiry.match(/^(\d{2})\/(\d{2})$/);
        if (!expiryMatch) {
            return res.status(400).json({ message: 'Invalid expiry format. Use MM/YY.' });
        }
        const [, month, year] = expiryMatch;
        const expDate = new Date(2000 + parseInt(year), parseInt(month));
        if (expDate < new Date()) {
            return res.status(400).json({ message: 'Card has expired.' });
        }

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Add balance
        user.balance += Number(amount);
        await user.save();

        // Log as a self-deposit transaction
        await Transaction.create({
            sender: user._id,
            receiver: user._id,
            amount: Number(amount),
            note: `Card deposit ****${cleanCard.slice(-4)}`,
            status: 'completed',
            authScore: 100 // High confidence on authenticated deposit
        });

        res.status(200).json({
            success: true,
            message: `₹${Number(amount).toLocaleString('en-IN')} deposited successfully`,
            newBalance: user.balance
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. Perform Secure Transfer to another user
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
            return res.status(400).json({ message: 'Source card authentication required' });
        }

        const cleanCard = (cardDetails.number || '').replace(/\s/g, '');
        if (!VERIFIED_CARDS.includes(cleanCard)) {
            return res.status(403).json({ message: 'Auth Failed: Please use a verified BehaveGuard Sandbox Card' });
        }

        const sender = await User.findById(decoded.id);
        if (!sender) return res.status(404).json({ message: 'Sender not found' });

        // PIN verification (if required by behavioral security)
        if (pin) {
            const isPinMatch = await sender.comparePin(pin);
            if (!isPinMatch) return res.status(403).json({ success: false, message: 'Security Breach: Invalid Transaction PIN' });
        }

        if (sender.balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        const receiver = await User.findOne({ email: recipientEmail.toLowerCase().trim() });
        if (!receiver) {
            return res.status(404).json({ message: 'Recipient not found on network' });
        }

        if (receiver.id === sender.id) {
            return res.status(400).json({ message: 'Self-transfer not permitted' });
        }

        // Atomic balance update
        sender.balance -= Number(amount);
        receiver.balance += Number(amount);

        await sender.save();
        await receiver.save();

        const tx = await Transaction.create({
            sender: sender._id,
            receiver: receiver._id,
            amount: Number(amount),
            note: note || '',
            status: 'completed',
            authScore: Number(req.body.authScore) || 100
        });

        res.status(200).json({
            success: true,
            message: 'Transfer completed successfully',
            transactionId: tx._id,
            newBalance: sender.balance
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
