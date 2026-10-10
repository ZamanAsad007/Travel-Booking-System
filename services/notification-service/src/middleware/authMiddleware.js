import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function authenticate(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        message: 'Authentication token is required',
        code: 'UNAUTHORIZED',
      },
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        message: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
        code: 'UNAUTHORIZED',
      },
    });
  }
}

export function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
      });
    }
    const userRole = (req.user.role || '').toUpperCase();
    const normalizedRoles = roles.map((r) => r.toUpperCase());
    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        data: null,
        error: {
          message: 'Forbidden: insufficient permissions',
          code: 'FORBIDDEN',
        },
      });
    }
    next();
  };
}
