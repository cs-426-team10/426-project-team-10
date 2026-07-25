import express from "express";

const app = express();

const PORT = 4000;
const REQUEST_SERVICE_URL = "http://request-service:3000";

async function checkRequestService() {
  try {
    const response = await fetch(`${REQUEST_SERVICE_URL}/health`);

    if (response.ok) {
      console.log(
        "[SIDECAR] request-service heartbeat OK",
        new Date().toISOString(),
      );
    } else {
      console.log(
        "[SIDECAR] request-service unhealthy",
        new Date().toISOString(),
      );
    }
  } catch (error) {
    console.log(
      "[SIDECAR] request-service unavailable",
      new Date().toISOString(),
    );
  }
}

setInterval(checkRequestService, 5000);

app.get("/logs", (req, res) => {
  res.json({
    service: "request-sidecar",
    monitored_service: "request-service",
    status: "monitoring",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    service: "request-sidecar",
    status: "healthy",
  });
});

app.listen(PORT, () => {
  console.log(`Request sidecar running on port ${PORT}`);
});
