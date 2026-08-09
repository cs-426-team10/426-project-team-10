const amqp = require("amqplib");
const express = require("express");

const healthApp = express();

healthApp.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

healthApp.listen(3000, () => {
  console.log("Async worker health server running on port 3000");
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

  console.log(`Worker waiting for messages on ${QUEUE_NAME}`);

  channel.consume(QUEUE_NAME, async (message) => {
    if (!message) {
      return;
    }

    const job = JSON.parse(message.content.toString());

    console.log("Worker picked up job:", job);

    try {
      // Simulate asynchronous processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Worker processed job:", job);

      channel.ack(message);
    } catch (error) {
      console.error("Worker failed to process job:", error);
      channel.nack(message, false, true);
    }
  });
}

start().catch((error) => {
  console.error("Worker failed to start:", error);
  process.exit(1);
});
