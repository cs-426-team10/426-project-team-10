import express from "express";
import { createClient } from "redis";
import amqp from "amqplib";

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

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";

const QUEUE_NAME = "request-processing";

const rabbitConnection = await amqp.connect(RABBITMQ_URL);
const rabbitChannel = await rabbitConnection.createChannel();

await rabbitChannel.assertQueue(QUEUE_NAME, {
  durable: true,
});

console.log("Connected to RabbitMQ");

app.get("/requests/:id", async (req, res) => {
  const id = req.params.id;

  const faultDelay = Number(process.env.FAULT_DELAY_MS || 0);

  if (faultDelay > 0) {
    console.log(`Fault injection: delaying request by ${faultDelay}ms`);
    await new Promise((resolve) => setTimeout(resolve, faultDelay));
  }

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

app.post("/requests", async (req, res) => {
  console.log("Received emergency request");

  const { resident_id, location, urgency, need } = req.body;

  const job = {
    resident_id,
    location,
    urgency,
    need,
    created_at: new Date().toISOString(),
  };

  rabbitChannel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(job)), {
    persistent: true,
  });

  console.log("Enqueued job:", job);

  //201: accepted for processing and processing is finished
  //202: accepted for processing, but processing isn't finished yet
  res.status(202).json({
    message: "Emergency request accepted",
    status: "queued",
    job,
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
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

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});