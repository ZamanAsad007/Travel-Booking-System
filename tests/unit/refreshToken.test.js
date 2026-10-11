import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import { authService } from '../../services/auth-service/src/services/authService.js';
import { userRepository } from '../../services/auth-service/src/repositories/userRepository.js';
import { refreshTokenRepository } from '../../services/auth-service/src/repositories/refreshTokenRepository.js';

describe('Refresh Token Rotation & Revocation Unit Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockUser = {
    id: 'user-uuid-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    role: 'USER',
    password_hash: bcrypt.hashSync('securePass123', 8),
    created_at: new Date().toISOString(),
  };

  test('should issue both accessToken and refreshToken on login and persist token hash', async () => {
    jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
    const createTokenSpy = jest.spyOn(refreshTokenRepository, 'create').mockResolvedValue({
      id: 'token-id-1',
      user_id: mockUser.id,
      token_hash: 'hashed',
    });

    const res = await authService.login({
      email: 'jane@example.com',
      password: 'securePass123',
    });

    expect(res.user.email).toBe('jane@example.com');
    expect(res.accessToken).toBeDefined();
    expect(res.refreshToken).toBeDefined();
    expect(createTokenSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUser.id,
        tokenHash: expect.any(String),
      })
    );
  });

  test('should rotate refresh token on valid refresh request (revoke old, issue new)', async () => {
    const rawToken = 'valid-refresh-token-string';
    const tokenHash = authService.hashToken(rawToken);

    const storedToken = {
      id: 'token-id-1',
      user_id: mockUser.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 60000).toISOString(),
      revoked_at: null,
    };

    jest.spyOn(refreshTokenRepository, 'findByTokenHash').mockResolvedValue(storedToken);
    const revokeSpy = jest.spyOn(refreshTokenRepository, 'revoke').mockResolvedValue({
      id: 'token-id-1',
      revoked_at: new Date().toISOString(),
    });
    jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
    const createNewSpy = jest.spyOn(refreshTokenRepository, 'create').mockResolvedValue({
      id: 'token-id-2',
      user_id: mockUser.id,
    });

    const result = await authService.refresh(rawToken);

    expect(revokeSpy).toHaveBeenCalledWith('token-id-1');
    expect(createNewSpy).toHaveBeenCalled();
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.refreshToken).not.toBe(rawToken);
  });

  test('should detect token reuse and revoke all sessions for the user', async () => {
    const rawToken = 'reused-token';
    const tokenHash = authService.hashToken(rawToken);

    const compromisedToken = {
      id: 'token-id-compromised',
      user_id: mockUser.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 60000).toISOString(),
      revoked_at: new Date(Date.now() - 10000).toISOString(), // already revoked!
    };

    jest.spyOn(refreshTokenRepository, 'findByTokenHash').mockResolvedValue(compromisedToken);
    const revokeAllSpy = jest.spyOn(refreshTokenRepository, 'revokeAllForUser').mockResolvedValue(3);

    await expect(authService.refresh(rawToken)).rejects.toMatchObject({
      statusCode: 401,
      code: 'REFRESH_TOKEN_REUSED',
    });

    expect(revokeAllSpy).toHaveBeenCalledWith(mockUser.id);
  });

  test('should reject expired refresh token', async () => {
    const rawToken = 'expired-token';
    const tokenHash = authService.hashToken(rawToken);

    const expiredToken = {
      id: 'token-id-expired',
      user_id: mockUser.id,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() - 60000).toISOString(), // in the past
      revoked_at: null,
    };

    jest.spyOn(refreshTokenRepository, 'findByTokenHash').mockResolvedValue(expiredToken);

    await expect(authService.refresh(rawToken)).rejects.toMatchObject({
      statusCode: 401,
      code: 'EXPIRED_REFRESH_TOKEN',
    });
  });

  test('should revoke token on logout', async () => {
    const rawToken = 'logout-token';
    const tokenHash = authService.hashToken(rawToken);

    const storedToken = {
      id: 'token-id-logout',
      user_id: mockUser.id,
      token_hash: tokenHash,
      revoked_at: null,
    };

    jest.spyOn(refreshTokenRepository, 'findByTokenHash').mockResolvedValue(storedToken);
    const revokeSpy = jest.spyOn(refreshTokenRepository, 'revoke').mockResolvedValue({
      id: 'token-id-logout',
      revoked_at: new Date().toISOString(),
    });

    const res = await authService.logout(rawToken);

    expect(revokeSpy).toHaveBeenCalledWith('token-id-logout');
    expect(res.success).toBe(true);
  });
});
