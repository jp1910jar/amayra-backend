import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateOtp, hashOtp, getOtpExpiry } from "../utils/otp.js";
import { sendOtpEmail } from "../config/mailer.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} from "../utils/tokens.js";

const issueTokensAndRespond = (res, user, statusCode, message) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  setRefreshCookie(res, refreshToken);

  return res
    .status(statusCode)
    .json(
      new ApiResponse(statusCode, { user: user.toSafeObject(), accessToken }, message)
    );
};

const issueAndEmailOtp = async (user) => {
  const otp = generateOtp();
  user.otpHash = hashOtp(otp);
  user.otpExpiresAt = getOtpExpiry();
  await user.save({ validateBeforeSave: false });
  await sendOtpEmail(user.email, otp);
};

// POST /api/auth/signup — creates an unverified account and emails an OTP
export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });

  if (existing && existing.isVerified) {
    throw new ApiError(409, "Email already registered");
  }

  let user = existing;
  if (user) {
    // Previous signup attempt never got verified — let them retry with fresh details
    user.name = name;
    user.password = password;
    await user.save();
  } else {
    user = await User.create({ name, email, password });
  }

  await issueAndEmailOtp(user);

  res
    .status(201)
    .json(new ApiResponse(201, { email: user.email }, "OTP sent to your email"));
});

// POST /api/auth/verify-otp — confirms the OTP and marks the account verified.
// Does NOT log the user in — they go on to /login and sign in with their password.
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select("+otpHash +otpExpiresAt");
  if (!user) throw new ApiError(404, "No signup found for this email");

  if (user.isVerified) throw new ApiError(400, "Email already verified");

  if (!user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    throw new ApiError(400, "OTP expired — request a new one");
  }

  if (hashOtp(otp) !== user.otpHash) {
    throw new ApiError(400, "Incorrect OTP");
  }

  user.isVerified = true;
  user.otpHash = undefined;
  user.otpExpiresAt = undefined;
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new ApiResponse(200, { email: user.email }, "Email verified — please log in"));
});

// POST /api/auth/resend-otp
export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "No signup found for this email");
  if (user.isVerified) throw new ApiError(400, "Email already verified");

  await issueAndEmailOtp(user);

  res.status(200).json(new ApiResponse(200, { email: user.email }, "OTP resent"));
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new ApiError(401, "Invalid email or password");

  const match = await user.comparePassword(password);
  if (!match) throw new ApiError(401, "Invalid email or password");

  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  issueTokensAndRespond(res, user, 200, "Logged in");
});

// POST /api/auth/refresh — reads refresh token from httpOnly cookie, issues a new access token
export const refresh = asyncHandler(async (req, res) => {
  const cookieName = process.env.REFRESH_COOKIE_NAME || "amayra_rt";
  const token = req.cookies?.[cookieName];

  if (!token) throw new ApiError(401, "No refresh token provided");

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(res);
    throw new ApiError(401, "Refresh token invalid or expired");
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new ApiError(401, "User no longer exists");

  const accessToken = generateAccessToken(user._id);
  res.status(200).json(new ApiResponse(200, { accessToken }, "Token refreshed"));
});

// POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  clearRefreshCookie(res);
  res.status(200).json(new ApiResponse(200, null, "Logged out"));
});

// GET /api/auth/me — requires requireAuth middleware
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, { user: req.user.toSafeObject() }));
});