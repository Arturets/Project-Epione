import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

const ITERATIONS = 210_000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

// Format: pbkdf2$<iterations>$<salt>$<hash>
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
  return `pbkdf2$${ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [algorithm, iterationRaw, salt, hash] = storedHash.split('$');
  if (algorithm !== 'pbkdf2' || !iterationRaw || !salt || !hash) {
    return false;
  }

  const iterations = Number(iterationRaw);
  if (!Number.isFinite(iterations) || iterations < 1) {
    return false;
  }

  const derived = pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST);
  const original = Buffer.from(hash, 'hex');

  if (derived.length !== original.length) {
    return false;
  }

  return timingSafeEqual(derived, original);
}
