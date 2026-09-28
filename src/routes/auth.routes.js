import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  signup,
  verifyOtp,
  resendOtp,
  login,
  refresh,
  logout,
  getMe,
} from "../controllers/auth.controller.js";
import {
  signupValidator,
  loginValidator,
  verifyOtpValidator,
  resendOtpValidator,
} from "../validators/auth.validator.js";
import { validate } from "../middleware/validate.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

// Throttle brute-force attempts on credential endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, please try again later" },
});

// Tighter limit on OTP endpoints specifically — these are the most brute-forceable
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many OTP attempts, please try again later" },
});

router.post("/signup", authLimiter, signupValidator, validate, signup);
router.post("/verify-otp", otpLimiter, verifyOtpValidator, validate, verifyOtp);
router.post("/resend-otp", otpLimiter, resendOtpValidator, validate, resendOtp);
router.post("/login", authLimiter, loginValidator, validate, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, getMe);

export default router;