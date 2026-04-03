import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

// Simulation mode if credentials are missing
const isSimulated = !accountSid || !authToken || !fromPhone;

let client;
if (!isSimulated) {
    client = twilio(accountSid, authToken);
}

export const sendSMS = async (to, message) => {
    if (isSimulated) {
        console.log('----------------------------------------------------');
        console.log(`[SIMULATED SMS GATEWAY]`);
        console.log(`To: ${to}`);
        console.log(`Message: ${message}`);
        console.log('----------------------------------------------------');
        return { success: true, simulated: true };
    }

    try {
        const response = await client.messages.create({
            body: message,
            from: fromPhone,
            to: to.startsWith('+') ? to : `+${to}`
        });
        return { success: true, sid: response.sid };
    } catch (error) {
        console.error('[SMS ERROR]', error);
        return { success: false, error: error.message };
    }
};
