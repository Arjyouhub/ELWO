const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || 'gmail',
        auth: { user, pass },
      });
      console.log(`[ELWO EMAIL] SMTP Service initialized with: ${user}`);
    } else {
      console.log('[ELWO EMAIL] Running in local/dev mode (OTPs printed to server console)');
    }
  }

  /**
   * Send 6-digit verification code to recipient email
   */
  async sendOtpEmail(email, otp, purpose = 'Registration') {
    const formattedEmail = email.toLowerCase().trim();

    // 1. Highlight in Server Terminal for quick dev testing
    console.log('\n========================================================');
    console.log(`[ELWO AUTH OTP] 📩 Verification code for: ${formattedEmail}`);
    console.log(`[ELWO AUTH OTP] 🔑 CODE: ${otp} (${purpose})`);
    console.log('[ELWO AUTH OTP] ⏳ Valid for 10 minutes');
    console.log('========================================================\n');

    // 2. If SMTP is configured, send real email
    if (this.transporter) {
      try {
        const mailOptions = {
          from: `"ELWO Music" <${process.env.SMTP_USER}>`,
          to: formattedEmail,
          subject: `${otp} is your ELWO verification code`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; background: #090a0f; color: #f3f4f6; border: 1px solid #1f2333; border-radius: 16px; padding: 32px; text-align: center;">
              <h1 style="color: #22c55e; margin-bottom: 6px; letter-spacing: 2px;">ELWO</h1>
              <p style="color: #9ca3af; font-size: 14px; margin-top: 0;">Music Streaming Platform</p>
              
              <div style="margin: 28px 0; background: #12141d; border: 1px solid #1f2333; border-radius: 12px; padding: 20px;">
                <p style="font-size: 13px; color: #9ca3af; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #22c55e; font-family: monospace;">${otp}</div>
                <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">Valid for 10 minutes. Never share this code with anyone.</p>
              </div>

              <p style="font-size: 12px; color: #9ca3af;">If you did not request this verification code, please ignore this email.</p>
            </div>
          `,
        };

        const info = await this.transporter.sendMail(mailOptions);
        console.log(`[ELWO EMAIL] Email sent successfully to ${formattedEmail}. MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err) {
        console.warn(`[ELWO EMAIL] Failed to send email via SMTP: ${err.message}. Code was logged to console.`);
        return { success: false, error: err.message };
      }
    }

    return { success: true, mode: 'CONSOLE' };
  }
}

module.exports = new EmailService();
