import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Session from '../models/Session.js';

dotenv.config();

/**
 * Identity Audit Utility
 * run: node scripts/check_identity.js
 */
async function runAudit() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI, { family: 4 });

        const users = await User.find({}).limit(5);

        console.log('\n--- BEHAVIORAL IDENTITY AUDIT ---');

        for (const user of users) {
            const sessions = await Session.find({ userId: user._id });

            console.log(`\n[User: ${user.name}] (${user.email})`);
            console.log('----------------------------------------------------');
            console.log('PERMANENT BASELINE (User X Average Pattern):');
            console.log(`  - Avg Typing Speed:  ${user.behavioralBaseline.typingSpeedAvg.toFixed(2)} chars/s`);
            console.log(`  - Avg Mouse Vel:     ${user.behavioralBaseline.mouseVelocityAvg.toFixed(0)} px/s`);
            console.log(`  - Avg Scroll:        ${user.behavioralBaseline.scrollSpeedAvg.toFixed(0)} px/s`);
            console.log(`  - Learning Cycles:   ${user.behavioralBaseline.sessionCount} sessions`);

            console.log('\nSESSION HISTORY (Unique stored events):');
            if (sessions.length === 0) {
                console.log('  (!) No unique session records found yet.');
            } else {
                sessions.forEach((s, i) => {
                    console.log(`  [Session ${i + 1}] ID: ${s.sessionId.slice(-8)} | Date: ${s.timestamp.toLocaleString()}`);
                });
            }
        }

        console.log('\n--- AUDIT COMPLETE ---\n');
        process.exit(0);
    } catch (err) {
        console.error('Audit Error:', err);
        process.exit(1);
    }
}

runAudit();
