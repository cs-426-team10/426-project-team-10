import express from "express";

const app = express();

app.use(express.json());

const PORT = 3001;

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
