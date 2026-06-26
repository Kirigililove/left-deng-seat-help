import { createHmac, timingSafeEqual } from 'node:crypto';

export type SessionPayload = { userId: string; role: 'user' | 'admin'; issuedAt: number };

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('Missing SESSION_SECRET');
  return secret;
}

function base64url(input: string) {
  return Buffer.from(input).toString('base64url');
}

function sign(data: string) {
  return createHmac('sha256', getSecret()).update(data).digest('base64url');
}

export function createSessionToken(payload: Omit<SessionPayload, 'issuedAt'>) {
  const body = base64url(JSON.stringify({ ...payload, issuedAt: Date.now() } satisfies SessionPayload));
  return body + '.' + sign(body);
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  const expected = sign(body);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload.userId || (payload.role !== 'user' && payload.role !== 'admin')) return null;
    return payload;
  } catch {
    return null;
  }
}
