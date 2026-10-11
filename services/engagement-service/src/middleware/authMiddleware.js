import { createAuthMiddleware, requireRole } from '../../../../shared/middleware/authMiddleware.js';
import { config } from '../config/env.js';

export const authenticate = createAuthMiddleware(config.jwtSecret);
export const authMiddleware = authenticate;
export { requireRole };
