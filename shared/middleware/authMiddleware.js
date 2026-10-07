import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/response.js';

export function createAuthMiddleware(secret) {
  return function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication token is required', 'UNAUTHORIZED', 401);
    }

    const token = authHeader.split(' ')[1];
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
