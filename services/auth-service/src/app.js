import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
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
