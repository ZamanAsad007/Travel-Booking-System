import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/response.js';

export function createAuthMiddleware(secret) {
  return function authenticate(req, res, next) {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return errorResponse(res, 'Authentication token is required', 'UNAUTHORIZED', 401);
    }
    try {
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      next();
    } catch (error) {
      const message = error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
      return errorResponse(res, message, 'UNAUTHORIZED', 401);
    }
  };
}

export function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 'UNAUTHORIZED', 401);
    }
    const userRole = (req.user.role || '').toUpperCase();
    const normalizedRoles = roles.map((r) => r.toUpperCase());
    if (!normalizedRoles.includes(userRole)) {
      return errorResponse(res, 'Forbidden: insufficient permissions', 'FORBIDDEN', 403);
    }
    next();
  };
}
