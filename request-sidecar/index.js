import express from "express";
import client from "prom-client";

const app = express();

const PORT = 4000;

// Prometheus metrics
const register = new client.Registry();

client.collectDefaultMetrics({
  register,
});

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests received",
  labelNames: ["method", "path", "status_code"],
  registers: [register],
});

const httpResponseDurationMs = new client.Histogram({
  name: "http_response_duration_ms",
  help: "HTTP response duration in milliseconds",
  labelNames: ["method", "path", "status_code"],
  buckets: [10, 25, 50, 100, 250, 500, 1000, 2000, 5000],
  registers: [register],
});

// Request metrics middleware
app.use((req, res, next) => {
  const startTime = Date.now();

  res.on("finish", () => {
    const responseTimeMs = Date.now() - startTime;

    httpRequestsTotal.inc({
      method: req.method,
      path: req.path,
      status_code: res.statusCode,
    });

    httpResponseDurationMs.observe(
      {
        method: req.method,
        path: req.path,
        status_code: res.statusCode,
      },
      responseTimeMs,
    );
  });

  next();
});

// Prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

const REQUEST_SERVICE_URLS = [
  "http://request-service-1:3000/health",
  "http://request-service-2:3000/health",
];

function log(level, message, extra = {}) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...extra,
    }),
  );
}

async function checkRequestServices() {
  for (const url of REQUEST_SERVICE_URLS) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        log("info", "Request service heartbeat OK", {
          serviceUrl: url,
        });
      } else {
        log("warn", "Request service unhealthy", {
          serviceUrl: url,
          statusCode: response.status,
        });
      }
    } catch (error) {
      log("error", "Request service unavailable", {
        serviceUrl: url,
        error: error.message,
      });
    }
  }
}

checkRequestServices();
setInterval(checkRequestServices, 5000);

app.get("/logs", (req, res) => {
  res.json({
    service: "request-sidecar",
    monitored_services: ["request-service-1", "request-service-2"],
    status: "monitoring",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.listen(PORT, () => {
  log("info", "Request sidecar running", {
    port: PORT,
  });
});
