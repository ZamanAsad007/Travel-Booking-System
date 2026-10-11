import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/healthRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import priceAlertRoutes from './routes/priceAlertRoutes.js';
import loyaltyRoutes from './routes/loyaltyRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { correlationMiddleware } from '../../../shared/middleware/correlationMiddleware.js';
import { createServiceMetrics } from '../../../shared/middleware/metricsMiddleware.js';

const app = express();
const { middleware: metricsMiddleware, endpoint: metricsEndpoint } =
  createServiceMetrics('engagement-service');

app.use(cors());
app.use(express.json());
app.use(correlationMiddleware);
app.use(metricsMiddleware);

// Observability & Routes
app.get('/metrics', metricsEndpoint);
app.use(healthRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/price-alerts', priceAlertRoutes);
app.use('/api/loyalty', loyaltyRoutes);

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

// Error handler
app.use(errorHandler);

export default app;
