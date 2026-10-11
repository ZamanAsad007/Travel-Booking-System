export function errorHandler(err, req, res, next) {
  console.error('[engagement-service] Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      message,
      code,
      details: err.details || null,
    },
  });
}
