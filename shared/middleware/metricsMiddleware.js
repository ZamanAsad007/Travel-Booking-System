import client from 'prom-client';

export function createServiceMetrics(serviceName) {
  const register = new client.Registry();
  register.setDefaultLabels({ service: serviceName });
  client.collectDefaultMetrics({ register });

  const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [register],
  });

  const middleware = (req, res, next) => {
    const start = process.hrtime();
    res.on('finish', () => {
      const elapsed = process.hrtime(start);
      const durationInSeconds = elapsed[0] + elapsed[1] / 1e9;
      const route = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
      httpRequestDuration.observe(
        {
          method: req.method,
          route,
          code: res.statusCode,
        },
        durationInSeconds
      );
    });
    next();
  };

  const endpoint = async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (err) {
      res.status(500).end(err.message);
    }
  };

  return { register, middleware, endpoint };
}
