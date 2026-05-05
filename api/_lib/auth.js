// Auth helpers — JWT + bcrypt
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { kv } = require('@vercel/kv');

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL_DAYS = 30;

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function signToken(userId, email) {
  return jwt.sign({ uid: userId, email }, JWT_SECRET, { expiresIn: `${TOKEN_TTL_DAYS}d` });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function setAuthCookie(res, token) {
  const cookie = [
    `auth=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${TOKEN_TTL_DAYS * 24 * 60 * 60}`,
  ].join('; ');
  res.setHeader('Set-Cookie', cookie);
}

function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', 'auth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
}

function getAuthFromReq(req) {
  const cookies = (req.headers.cookie || '').split(';').reduce((acc, c) => {
    const [k, v] = c.trim().split('=');
    if (k) acc[k] = v;
    return acc;
  }, {});
  const token = cookies.auth;
  if (!token) return null;
  return verifyToken(token);
}

async function requireUser(req, res) {
  const auth = getAuthFromReq(req);
  if (!auth) {
    res.status(401).json({ error: 'Wymagane logowanie' });
    return null;
  }
  const user = await kv.get(`user:${auth.uid}`);
  if (!user) {
    res.status(401).json({ error: 'Użytkownik nie istnieje' });
    return null;
  }
  return user;
}

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  getAuthFromReq,
  requireUser,
};
