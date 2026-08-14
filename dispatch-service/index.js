import express from "express";
import client from "prom-client";

const app = express();

app.use(express.json());

const PORT = 3001;

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

// Structured request logging for POST /dispatch
app.post("/dispatch", (req, res) => {
  const startTime = Date.now();
  const { request_id, urgency } = req.body;

  setTimeout(() => {
    const responseTimeMs = Date.now() - startTime;

    const response = {
      dispatch_id: "DSP-5001",
      request_id: request_id || "REQ-1001",
      assigned_team: "Medical Response Unit A",
      priority: urgency || "high",
      status: "assigned",
      estimated_arrival_minutes: 15,
    };

    res.status(200).json(response);

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        message: "Dispatch request completed",
        method: req.method,
        path: req.path,
        statusCode: 200,
        responseTimeMs: responseTimeMs,
      }),
    );
  }, 500);
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.listen(PORT, () => {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      message: "Dispatch service running",
      port: PORT,
    }),
  );
});
