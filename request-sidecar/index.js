import express from "express";

const app = express();

const PORT = 4000;

const REQUEST_SERVICE_URLS = [
  "http://request-service-1:3000/health",
  "http://request-service-2:3000/health",
];

async function checkRequestServices() {
  for (const url of REQUEST_SERVICE_URLS) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        console.log(
          [SIDECAR] ${url} heartbeat OK,
          new Date().toISOString(),
        );
      } else {
        console.log(
          [SIDECAR] ${url} unhealthy,
          new Date().toISOString(),
        );
      }
    } catch (error) {
      console.log(
        [SIDECAR] ${url} unavailable,
        new Date().toISOString(),
      );
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
  console.log(Request sidecar running on port ${PORT});
});