import { authService } from '../services/authService.js';

export const authController = {
  async register(req, res, next) {
    try {
      const { name, email, password, role } = req.body;
      const result = await authService.register({ name, email, password, role });
      res.status(201).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      res.status(200).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refresh(refreshToken);
      res.status(200).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.logout(refreshToken);
      res.status(200).json({
        success: true,
        data: result,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async me(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);
      res.status(200).json({
        success: true,
        data: { user },
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },
};
