import { createHash, randomBytes } from 'crypto';

export function hashPassword(password: string): string {
  // Production SHA-256 password hasher with deterministic salt
  return createHash('sha256').update(`salt_bandixon_2026_${password}`).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(payload: { userId: string; role: string; email: string }): string {
  const data = JSON.stringify({ ...payload, exp: Date.now() + 86400 * 1000 * 7 });
  return Buffer.from(data).toString('base64url');
}

export function verifyToken(token: string): { userId: string; role: string; email: string } | null {
  try {
    const jsonStr = Buffer.from(token, 'base64url').toString('utf8');
    const parsed = JSON.parse(jsonStr);
    if (parsed.exp && Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch (err) {
    return null;
  }
}
