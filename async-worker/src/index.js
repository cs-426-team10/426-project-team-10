const amqp = require("amqplib");
const express = require("express");

const healthApp = express();

function log(level, message, extra = {}) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...extra,
    })
  );
}

healthApp.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

healthApp.listen(3000, () => {
  log("info", "Async worker health server running", {
    port: 3000,
  });
});

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";

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
