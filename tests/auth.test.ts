import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../apps/web/lib/auth.js';
import { storeService } from '../apps/web/lib/store.js';

describe('Authentication & Security Utilities', () => {
  it('should correctly hash and verify passwords', () => {
    const rawPass = 'secretBandixon2026';
    const hash = hashPassword(rawPass);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(rawPass);
    expect(verifyPassword(rawPass, hash)).toBe(true);
    expect(verifyPassword('wrongPassword', hash)).toBe(false);
  });

  it('should generate and verify valid authentication tokens', () => {
    const token = generateToken({
      userId: 'usr-admin-1',
      role: 'ADMIN',
      email: 'admin@bandixon.gov.uz',
    });

    expect(token).toBeDefined();
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe('usr-admin-1');
    expect(decoded?.role).toBe('ADMIN');
  });

  it('should return null for malformed token', () => {
    const invalid = verifyToken('invalid.token.str');
    expect(invalid).toBeNull();
  });

  it('should find user by phone number or email', () => {
    const userByPhone = storeService.getUserByPhoneOrEmail('+998901234567');
    expect(userByPhone).not.toBeNull();
    expect(userByPhone?.name).toBe('Bo‘riyev Shuxrat');

    const userByDigits = storeService.getUserByPhoneOrEmail('901234567');
    expect(userByDigits).not.toBeNull();
    expect(userByDigits?.email).toBe('boriyev@bandixon.gov.uz');
  });
});
