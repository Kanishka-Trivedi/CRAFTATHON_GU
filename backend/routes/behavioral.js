import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';

const router = express.Router();

/**
 * Persists session metrics and updates behavioral baseline for User X
 * Every new session is averaged into the permanent record
 */
router.post('/sync-session', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: 'No Auth' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const { metrics, sessionId } = req.body;

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: 'Identity missing' });

        // Calculate NEW running average for the user
        const oldN = user.behavioralBaseline.sessionCount;
        const newN = oldN + 1;

        const updateAvg = (oldAvg, newVal) => ((oldAvg * oldN) + newVal) / newN;

        user.behavioralBaseline.typingSpeedAvg = updateAvg(user.behavioralBaseline.typingSpeedAvg, metrics.typingSpeed || 6);
        user.behavioralBaseline.scrollSpeedAvg = updateAvg(user.behavioralBaseline.scrollSpeedAvg, metrics.scrollSpeed || 200);
        user.behavioralBaseline.mouseVelocityAvg = updateAvg(user.behavioralBaseline.mouseVelocityAvg, metrics.mouseVelocity || 350);
        user.behavioralBaseline.sessionCount = newN;

        await user.save();

        // Persist session history
        await Session.findOneAndUpdate(
            { sessionId },
            {
                userId: user._id,
                metrics,
                timestamp: Date.now()
            },
            { upsert: true, returnDocument: 'after' }
        );

        res.status(200).json({
            success: true,
            baseline: user.behavioralBaseline
        });
    } catch (error) {
        console.error('Session Sync Failure:', error);
        res.status(500).json({ message: 'Internal drift' });
    }
});

/**
 * Audit: Returns User's Permanent Baseline and all Recorded Sessions
 * This allows User X to verify their digital identity evolution
 */
router.get('/audit', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: 'No Auth' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: 'Identity Vault Mismatch', error: 'User ID in token was not found in database. Please re-authenticate.' });

        const sessions = await Session.find({ userId: decoded.id }).sort({ timestamp: -1 });

        res.status(200).json({
            success: true,
            userName: user.name,
            baseline: user.behavioralBaseline,
            totalSessions: user.behavioralBaseline.sessionCount,
            sessionHistory: sessions.map(s => ({
                id: s.sessionId,
                metrics: s.metrics,
                time: s.timestamp
            }))
        });
    } catch (error) {
        console.error('[AUDIT ERROR]', error);
        res.status(500).json({ message: 'Audit failure', error: error.message });
    }
});

export default router;
