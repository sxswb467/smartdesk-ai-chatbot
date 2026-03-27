import cors from "cors";
import express from "express";
import { config } from "./config.js";
import router from "./routes.js";

const app = express();

app.use(
  cors({
    origin: config.clientOrigin,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "SmartDesk AI Chatbot API",
    version: "1.0.0",
    docs: "/api/health",
  });
});

app.use("/api", router);

app.listen(config.port, () => {
  console.log(`SmartDesk API running on http://localhost:${config.port}`);
});
