import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { email, name, otp } = await request.json();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"BehaveGuard" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your BehaveGuard Verification Code',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #6366f1; text-align: center;">Identity Verification</h2>
          <p>Hi ${name || 'there'},</p>
          <p style="font-size: 16px; color: #4b5563; text-align: center;">Your 6-digit verification code is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6366f1; background: #f3f4f6; padding: 15px 25px; border-radius: 8px; border: 1px solid #e5e7eb;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 14px; color: #4b5563; text-align: center; font-weight: 500;">
            This code will expire in 10 minutes.
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;">
          <p style="font-size: 12px; color: #9ca3af; text-align: center; font-style: italic;">
            If you did not request this code, please ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vercel Mail Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
