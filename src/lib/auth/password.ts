import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const ITERATIONS = 310000;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return ['pbkdf2', ITERATIONS, salt, hash].join('$');
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, iterationsText, salt, hash] = stored.split('$');
  if (scheme !== 'pbkdf2' || !iterationsText || !salt || !hash) return false;
  const iterations = Number(iterationsText);
  if (!Number.isFinite(iterations)) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = pbkdf2Sync(password, salt, iterations, expected.length, DIGEST);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
