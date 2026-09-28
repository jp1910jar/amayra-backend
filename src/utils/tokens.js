import jwt from "jsonwebtoken";

export const generateAccessToken = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });

export const generateRefreshToken = (userId) =>
  jwt.sign({ sub: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

/**
 * Sets the refresh token as an httpOnly cookie.
 * - httpOnly: JS on the client can never read it (mitigates XSS token theft)
 * - secure: only sent over HTTPS in production
 * - sameSite: 'strict' blocks it from being sent on cross-site requests (CSRF mitigation)
 */
export const setRefreshCookie = (res, token) => {
  const cookieName = process.env.REFRESH_COOKIE_NAME || "amayra_rt";
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth", // only sent to auth endpoints, not every request
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const clearRefreshCookie = (res) => {
  const cookieName = process.env.REFRESH_COOKIE_NAME || "amayra_rt";
  res.clearCookie(cookieName, { path: "/api/auth" });
};
