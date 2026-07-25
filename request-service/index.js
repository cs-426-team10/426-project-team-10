import express from "express";

const app = express();

app.use(express.json());

const PORT = 3000;

app.post("/requests", (req, res) => {
  console.log("Received emergency request");

  setTimeout(() => {
    res.json({
      request_id: "REQ-1001",
      resident_id: "USER-452",
      location: "Miami, FL",
      urgency: "high",
      need: "medical assistance",
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

app.listen(PORT, () => {
  console.log(`Request service running on port ${PORT}`);
});
