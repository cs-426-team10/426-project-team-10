const amqp = require("amqplib");
const express = require("express");
const client = require("prom-client");

const healthApp = express();

const PORT = 3000;

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
healthApp.use((req, res, next) => {
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
healthApp.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

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

healthApp.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

healthApp.listen(PORT, () => {
  log("info", "Async worker health server running", {
    port: PORT,
  });
});

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";

const QUEUE_NAME = "request-processing";

async function start() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAME, {
    durable: true,
  });

  channel.prefetch(1);

  log("info", "Worker waiting for messages", {
    queue: QUEUE_NAME,
  });

  channel.consume(QUEUE_NAME, async (message) => {
    if (!message) {
      return;
    }

    const job = JSON.parse(message.content.toString());

    log("info", "Worker picked up job", {
      queue: QUEUE_NAME,
      job,
    });

    try {
      // Simulate asynchronous processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      log("info", "Worker processed job", {
        queue: QUEUE_NAME,
        job,
      });

      channel.ack(message);
    } catch (error) {
      log("error", "Worker failed to process job", {
        queue: QUEUE_NAME,
        error: error.message,
      });

      channel.nack(message, false, true);
    }
  });
}

start().catch((error) => {
  log("error", "Worker failed to start", {
    error: error.message,
  });

  process.exit(1);
});
