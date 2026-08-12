import client from "prom-client";

client.collectDefaultMetrics();

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests received",
  labelNames: ["method", "path", "status_code"],
});

const httpResponseDuration = new client.Histogram({
  name: "http_response_duration_ms",
  help: "HTTP response duration in milliseconds",
  labelNames: ["method", "path", "status_code"],
  buckets: [10, 25, 50, 100, 250, 500, 1000, 2000, 5000],
});

function metricsMiddleware(req, res, next) {
  if (req.path === "/metrics") {
    return next();
  }

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

    const path = req.route?.path || req.path;
    const statusCode = String(res.statusCode);

    httpRequestsTotal.inc({
      method: req.method,
      path,
      status_code: statusCode,
    });

    httpResponseDuration.observe(
      {
        method: req.method,
        path,
        status_code: statusCode,
      },
      durationMs,
    );
  });

  next();
}

async function metricsHandler(req, res) {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
}

export { metricsMiddleware, metricsHandler };
