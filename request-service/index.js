import express from "express";
import { createClient } from "redis";

const app = express();

app.use(express.json()); //converts JSON text into JavaScript object

const PORT = 3000;

const redis = createClient({
  url: "redis://redis:6379",
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

await redis.connect();

console.log("Connected to Redis");

app.get("/requests/:id", async (req, res) => {
  const id = req.params.id;

  const cached = await redis.get(id);

  if (cached) {
    return res.json({
      source: "cache-hit",
      instance: process.env.HOSTNAME,
      data: JSON.parse(cached),
    });
  }

  // simulate slow computation/database call
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const result = {
    id,
    status: "pending",
    message: "Emergency request found",
  };

  await redis.set(id, JSON.stringify(result));

  res.json({
    source: "cache-miss",
    instance: process.env.HOSTNAME,
    data: result,
  });
});

app.post("/requests", (req, res) => {
  console.log("Received emergency request");

  const { resident_id, location, urgency, need } = req.body;

  setTimeout(() => {
    res.status(201).json({
      request_id: `REQ-${Date.now()}`,
      resident_id,
      location,
      urgency,
      need,
      status: "submitted",
      created_at: new Date().toISOString(),
    });
  }, 200);
});

app.get("/health", (req, res) => {
  res.json({
    service: "request-service",
    status: "healthy",
  });
});

app.get("/requests", (req, res) => {
  res.json({
    message: "Emergency request received",
    service: "request-service",
    instance: process.env.HOSTNAME,
  });
});

app.listen(PORT, () => {
  console.log(`Request service running on port ${PORT}`);
});
