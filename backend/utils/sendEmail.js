const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send OTP email with nice HTML template
const sendOtpEmail = async (to, otp, purpose = 'Password Reset') => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #0a0a1a; color: #f5f5f7; border-radius: 16px;">
        <h2 style="color: #a78bfa; margin-bottom: 8px;">Chat App</h2>
        <p style="color: #a1a1aa; margin-bottom: 24px;">${purpose}</p>
        <div style="background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3); padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #fff;">${otp}</div>
        </div>
        <p style="color: #a1a1aa; font-size: 14px;">This code expires in 10 minutes.</p>
        <p style="color: #71717a; font-size: 12px;">If you didn't request this, ignore this email.</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Chat App" <${process.env.EMAIL_USER}>`,
      to,
      subject: `${purpose} — Your OTP is ${otp}`,
      html
    });
    
    console.log('📧 Email sent:', info.messageId);
    return { ok: true };
  } catch (err) {
    console.error('❌ Email send failed:', err.message);
    return { ok: false, error: err.message };
  }
};

module.exports = { sendOtpEmail };