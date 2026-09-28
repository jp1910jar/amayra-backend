import nodemailer from "nodemailer";

/**
 * Gmail SMTP transporter.
 * EMAIL_USER must be a full @gmail.com address.
 * EMAIL_APP_PASSWORD must be a 16-character Google "App Password"
 * (Google Account → Security → 2-Step Verification → App passwords) —
 * your normal Gmail password will NOT work here.
 */
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

export const sendOtpEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"Amayra" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject: "Your Amayra verification code",
    text: `Your verification code is ${otp}. It expires in ${process.env.OTP_EXPIRES_MIN || 10} minutes.`,
    html: `
      <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
        <h2 style="margin-bottom: 4px;">Verify your email</h2>
        <p style="color: #555;">Use the code below to finish creating your Amayra account.</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px; margin: 24px 0;">${otp}</p>
        <p style="color: #888; font-size: 13px;">
          This code expires in ${process.env.OTP_EXPIRES_MIN || 10} minutes. If you didn't request this, you can ignore this email.
        </p>
      </div>
    `,
  });
};