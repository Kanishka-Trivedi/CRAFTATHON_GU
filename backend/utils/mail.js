import nodemailer from 'nodemailer';

/**
 * Sends a 6-digit OTP using Gmail SMTP with STARTTLS (Port 587)
 */
export const sendOtpEmail = async (email, name, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password without spaces
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"BehaveGuard Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your BehaveGuard Verification Code: ${otp}`,
      html: `
        <div style="font-family: 'Sora', sans-serif; padding: 40px; background-color: #070814; color: white; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #6366f1; font-size: 24px; font-weight: 800; margin: 0;">BehaveGuard</h2>
            <p style="color: rgba(255,255,255,0.4); font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">Security Protocol Active</p>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 20px;">Hello <strong>${name || 'Resident Node'}</strong>,</p>
          <p style="color: rgba(255,255,255,0.6); font-size: 14px; line-height: 1.6;">A request for enrolment / re-authentication has been triggered for your identity node. Please use the following one-time signature to proceed:</p>
          
          <div style="text-align: center; margin: 40px 0;">
            <h1 style="background: rgba(99, 102, 241, 0.1); padding: 20px; border-radius: 16px; border: 1px solid rgba(99,102,241,0.3); display: inline-block; letter-spacing: 8px; color: #818cf8; font-size: 36px; margin: 0;">${otp}</h1>
          </div>
          
          <p style="color: rgba(255,255,255,0.4); font-size: 12px; font-style: italic;">This code expires in 10 minutes. If you did not request this, please initiate a lockdown immediately.</p>
          
          <div style="margin-top: 50px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
            <p style="font-size: 10px; color: rgba(255,255,255,0.2); text-transform: uppercase; letter-spacing: 1px;">&copy; 2024 BehaveGuard Security Platform · Zero-Storage Logic</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[GMAIL SUCCESS] Email dispatched via 587:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[GMAIL CRITICAL] Email failed on 587:', err.message);
    return { success: false, error: err.message };
  }
};
