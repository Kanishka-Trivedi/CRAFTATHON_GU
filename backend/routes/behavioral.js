import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';

const router = express.Router();

/**
 * POST /sync-session
 * Called every 30s from the frontend with the LAST computed metrics.
 * Each call = one session snapshot stored permanently.
 * Also updates the user's running behavioral baseline averages.
 */
router.post('/sync-session', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: 'No Auth' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const { metrics, sessionId, trustScore, riskLevel } = req.body;

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: 'Identity missing' });

        // ── Update running baseline averages ────────────────────────
        const oldN = user.behavioralBaseline.sessionCount || 0;
        const newN = oldN + 1;
        const updateAvg = (oldAvg, newVal) => ((oldAvg * oldN) + (newVal || 0)) / newN;

        user.behavioralBaseline.typingSpeedAvg = updateAvg(
            user.behavioralBaseline.typingSpeedAvg, metrics.typingSpeed
        );
        user.behavioralBaseline.scrollSpeedAvg = updateAvg(
            user.behavioralBaseline.scrollSpeedAvg, metrics.scrollSpeed
        );
        user.behavioralBaseline.mouseVelocityAvg = updateAvg(
            user.behavioralBaseline.mouseVelocityAvg, metrics.mouseVelocity
        );
        user.behavioralBaseline.sessionCount = newN;
        await user.save();

        // ── Save this session snapshot ──────────────────────────────
        await Session.findOneAndUpdate(
            { sessionId },
            {
                userId: user._id,
                sessionId,
                metrics: {
                    typingSpeed: metrics.typingSpeed || 0,
                    keyHold: metrics.keyHold || 0,
                    keyFlight: metrics.keyFlight || 0,
                    scrollSpeed: metrics.scrollSpeed || 0,
                    mouseVelocity: metrics.mouseVelocity || 0,
                    idleTime: metrics.idleTime || 0,
                    isAnomalous: riskLevel === 'danger'
                },
                trustScore: trustScore || 1.0,
                riskLevel: riskLevel || 'safe',
                timestamp: Date.now()
            },
            { upsert: true, returnDocument: 'after' }
        );

        res.status(200).json({
            success: true,
            sessionNumber: newN,
            baseline: user.behavioralBaseline
        });
    } catch (error) {
        console.error('[SYNC ERROR]', error.message);
        res.status(500).json({ message: 'Sync failed', error: error.message });
    }
});


/**
 * GET /audit
 * Returns the user's permanent behavioral baseline + all recorded session snapshots.
 * Access via browser: http://localhost:5000/api/behavioral/audit (must be logged in)
 */
router.get('/audit', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: 'Not authenticated. Please log in first.' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({
            message: 'User not found',
            fix: 'Your session token refers to a deleted user. Please log out and log back in.'
        });

        const sessions = await Session.find({ userId: decoded.id }).sort({ timestamp: -1 });

        res.status(200).json({
            success: true,
            identity: {
                name: user.name,
                email: user.email,
                userId: user._id,
            },
            behavioralBaseline: {
                typingSpeedAvg: user.behavioralBaseline.typingSpeedAvg?.toFixed(2),
                scrollSpeedAvg: user.behavioralBaseline.scrollSpeedAvg?.toFixed(2),
                mouseVelocityAvg: user.behavioralBaseline.mouseVelocityAvg?.toFixed(2),
                totalSessions: user.behavioralBaseline.sessionCount,
            },
            sessionHistory: sessions.map(s => ({
                sessionId: s.sessionId,
                timestamp: s.timestamp,
                trustScore: s.trustScore,
                riskLevel: s.riskLevel,
                metrics: {
                    typingSpeed: s.metrics.typingSpeed,
                    keyHold: s.metrics.keyHold,
                    keyFlight: s.metrics.keyFlight,
                    mouseVelocity: s.metrics.mouseVelocity,
                    scrollSpeed: s.metrics.scrollSpeed,
                    flagged: s.metrics.isAnomalous
                }
            }))
        });
    } catch (error) {
        console.error('[AUDIT ERROR]', error.message);
        res.status(500).json({ message: 'Audit failed', error: error.message });
    }
});

export default router;
