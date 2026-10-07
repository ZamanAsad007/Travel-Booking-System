import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        message: 'Authentication token is required',
        code: 'UNAUTHORIZED',
      },
    });
  }

  const token = authHeader.split(' ')[1];
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
