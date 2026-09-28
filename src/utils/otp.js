import crypto from "crypto";

/** Generates a 6-digit numeric OTP, e.g. "042917" */
export const generateOtp = () =>
  crypto.randomInt(100000, 1000000).toString();

/**
 * OTPs are stored hashed (never plaintext) so a database leak alone
 * doesn't hand out valid codes.
 */
export const hashOtp = (otp) =>
  crypto.createHash("sha256").update(otp).digest("hex");

export const getOtpExpiry = () =>
  new Date(Date.now() + (Number(process.env.OTP_EXPIRES_MIN) || 10) * 60 * 1000);