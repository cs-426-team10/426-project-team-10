import express from "express";

const app = express(); //contains Express application

app.use(express.json()); //parse JSON data into JavaScript object which you can retrieve the properties of

const PORT = 3001;

app.post("/dispatch", (req, res) => {
  const { request_id, urgency } = req.body;

  console.log(`Dispatch request received for ${request_id}`);

  setTimeout(() => {
    res.json({
      dispatch_id: "DSP-5001",
      request_id: request_id || "REQ-1001",
      assigned_team: "Medical Response Unit A",
      priority: urgency || "high",
      status: "assigned",
      estimated_arrival_minutes: 15,
    });
  }, 500);
});

app.get("/health", (req, res) => {
  res.json({
    service: "dispatch-service",
    status: "healthy",
  });
});

app.listen(PORT, () => {
  console.log(`Dispatch service running on port ${PORT}`);
});
