import express from "express";

const app = express();

const PORT = 4000;

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
    monitored_services: [
      "request-service-1",
      "request-service-2",
    ],
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
