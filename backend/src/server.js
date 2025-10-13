// backend/server.js (ESM)
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import coursesRouter from "./routes/courses.js";  // <-- must exist
import plansRouter from "./routes/plans.js";      // <-- your existing plans routes
import auditsRouter from "./routes/audits.route.js";
import meta from "./routes/meta.js";   

const app = express();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/course_planner";

// middleware
app.use(cors({ origin: ["http://localhost:3000"], credentials: false }));
app.use(express.json({ limit: "5mb" }));

// simple health check
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    mongo: mongoose.connection.readyState, // 0=disconnected, 1=connecting, 2=connected
  });
});

// mount routers (IMPORTANT: before 404)
app.use("/courses", coursesRouter);
app.use("/plans", plansRouter);
app.use("/api/audits", auditsRouter);
app.use("/meta", meta);

// 404 (keep last)
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// start
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => console.log(`🚀 API on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Mongo connect error", err);
    process.exit(1);
  });
