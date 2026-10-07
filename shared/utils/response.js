export function successResponse(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null,
  });
}

export function errorResponse(res, message, code = 'INTERNAL_ERROR', statusCode = 500, details = null) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      message,
      code,
      ...(details && { details }),
    },
  });
}
