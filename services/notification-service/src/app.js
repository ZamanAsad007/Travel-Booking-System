import express from 'express';
import cors from 'cors';
import notificationRoutes from './routes/notificationRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { correlationMiddleware, createServiceMetrics } from '../../../shared/index.js';

const app = express();
const { middleware: metricsMiddleware, endpoint: metricsEndpoint } =
  createServiceMetrics('notification-service');

app.use(cors());
app.use(express.json());
app.use(correlationMiddleware);
app.use(metricsMiddleware);

// Observability & Routes
app.get('/metrics', metricsEndpoint);
app.use(healthRoutes);
app.use('/api/notifications', notificationRoutes);

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
