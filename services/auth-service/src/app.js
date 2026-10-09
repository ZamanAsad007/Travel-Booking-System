import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { correlationMiddleware } from '../../../shared/middleware/correlationMiddleware.js';
import { createServiceMetrics } from '../../../shared/middleware/metricsMiddleware.js';

const app = express();
const { middleware: metricsMiddleware, endpoint: metricsEndpoint } =
  createServiceMetrics('auth-service');

app.use(cors());
app.use(express.json());
app.use(correlationMiddleware);
app.use(metricsMiddleware);

// Observability & Routes
app.get('/metrics', metricsEndpoint);
app.use(healthRoutes);
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: {
      message: `Route not found: ${req.method} ${req.url}`,
      code: 'NOT_FOUND',
    },
  });
});

// Error handling middleware
app.use(errorHandler);

export default app;
