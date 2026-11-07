import crypto from 'node:crypto';

// In-memory daily salt rotating every 24h, never persisted or logged
let currentSalt = crypto.randomBytes(32).toString('hex');
let lastSaltRotation = Date.now();
const SALT_ROTATION_INTERVAL = 24 * 60 * 60 * 1000;

function getDailySalt(): string {
  const now = Date.now();
  if (now - lastSaltRotation > SALT_ROTATION_INTERVAL) {
    currentSalt = crypto.randomBytes(32).toString('hex');
    lastSaltRotation = now;
    rateLimitBuckets.clear(); // Clear expired rate limit buckets on salt rotation
  }
  return currentSalt;
}

// In-memory rate limiting map: hash(salt + clientIdentifier) -> array of timestamps
const rateLimitBuckets = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour window
const MAX_SUGGESTIONS_PER_HOUR = 2;

export function checkRateLimit(clientIdentifier: string): { allowed: boolean; retryAfterSeconds?: number } {
  const salt = getDailySalt();
  const hash = crypto.createHmac('sha256', salt).update(clientIdentifier).digest('hex');
  const now = Date.now();
  const timestamps = (rateLimitBuckets.get(hash) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW);

  if (timestamps.length >= MAX_SUGGESTIONS_PER_HOUR) {
    const oldest = timestamps[0];
    const retryAfter = Math.ceil((oldest + RATE_LIMIT_WINDOW - now) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfter) };
  }

  timestamps.push(now);
  rateLimitBuckets.set(hash, timestamps);
  return { allowed: true };
}

// Demandes de carte de membre : 3 par heure et par connexion, même empreinte temporaire.
const memberBuckets = new Map<string, number[]>();
const MEMBER_WINDOW = 60 * 60 * 1000;
const MAX_MEMBER_CARDS_PER_HOUR = 3;

export function checkMemberRateLimit(clientIdentifier: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const salt = getDailySalt();
  const hash = crypto
    .createHmac('sha256', salt)
    .update(`member:${clientIdentifier}`)
    .digest('hex');
  const now = Date.now();
  const timestamps = (memberBuckets.get(hash) ?? []).filter((t) => now - t < MEMBER_WINDOW);

  if (timestamps.length >= MAX_MEMBER_CARDS_PER_HOUR) {
    const oldest = timestamps[0];
    const retryAfter = Math.ceil((oldest + MEMBER_WINDOW - now) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfter) };
  }

  timestamps.push(now);
  memberBuckets.set(hash, timestamps);
  return { allowed: true };
}

// Vote Token Anonymization: Server-side HMAC secret
const fallbackVoteSecret = crypto.randomBytes(32).toString('hex');

function voteSecret(): string | undefined {
  return process.env.VOTE_HMAC_SECRET || process.env.VOTE_SECRET;
}

export function isVoteConfigured(): boolean {
  const secret = voteSecret();
  return Boolean(secret && secret.length >= 32);
}

function getVoteSecret(): string {
  const secret = voteSecret();
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('VOTE_HMAC_SECRET ou VOTE_SECRET manquant ou trop court (32 caractères minimum).');
  }
  return fallbackVoteSecret;
}

export function hashVoterToken(token: string): string {
  return crypto.createHmac('sha256', getVoteSecret()).update(token).digest('hex');
}

// Proof of Work verification (difficulty = leading '00')
export function verifyProofOfWork(payload: string, proof?: string, difficulty = 2): boolean {
  if (proof === undefined || proof === null || proof === '') return false;
  const hash = crypto.createHash('sha256').update(`${payload}:${proof}`).digest('hex');
  return hash.startsWith('0'.repeat(difficulty));
}

// Studio Session Management (signed HttpOnly cookie, stateless across instances)
export interface StudioSession {
  token: string;
  user: {
    id: string;
    username: string;
    role: 'admin' | 'editor' | 'moderator';
  };
  expiresAt: number;
}

interface SessionPayload {
  user: StudioSession['user'];
  exp: number;
}

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const revokedSessions = new Set<string>();
let testFallbackSecret: string | null = null;

function studioSecret(): string | undefined {
  const session = process.env.SESSION_SECRET;
  if (session && session.length >= 32) return session;
  return process.env.STUDIO_SECRET;
}

export function isStudioConfigured(): boolean {
  const secret = studioSecret();
  return Boolean(secret && secret.length >= 16);
}

export function getStudioLoginSecret(): string | null {
  const secret = studioSecret();
  return secret && secret.length >= 16 ? secret : null;
}

function getStudioSecret(): string {
  const secret = studioSecret();
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === 'test') {
    testFallbackSecret ??= crypto.randomBytes(32).toString('hex');
    return testFallbackSecret;
  }
  throw new Error('SESSION_SECRET ou STUDIO_SECRET manquant ou trop court (16 caractères minimum).');
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getStudioSecret()).update(payload).digest('base64url');
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function createStudioSession(user: StudioSession['user']): StudioSession {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload: SessionPayload = { user, exp: expiresAt };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const token = `${encoded}.${sign(encoded)}`;
  return { token, user, expiresAt };
}

export function getStudioSession(token?: string | null): StudioSession | null {
  if (!token) return null;
  if (revokedSessions.has(token)) return null;
  const separator = token.lastIndexOf('.');
  if (separator <= 0) return null;
  const encoded = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!safeEqual(signature, sign(encoded))) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload || !payload.user || typeof payload.exp !== 'number') return null;
    if (Date.now() > payload.exp) return null;
    return { token, user: payload.user, expiresAt: payload.exp };
  } catch {
    return null;
  }
}

export function revokeStudioSession(token: string): void {
  revokedSessions.add(token);
}

// Security Headers & CSP
export function getSecurityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), payment=()',
  };
}
