export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    data: null,
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_SERVER_ERROR',
      ...(err.details && { details: err.details }),
    },
  };

  if (statusCode === 500) {
    console.error(`[catalog-service] Unhandled Error at ${req.method} ${req.url}:`, err);
  }

  res.status(statusCode).json(response);
}
