import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// ✅ ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ JSON & URL-encoded parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ CORS setup
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN,
    credentials: true,
  })
);

// ✅ Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalJson = res.json;
  res.json = function (bodyJson, ...args) {
    res.locals.capturedJson = bodyJson;
    return originalJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      let line = `${req.method} ${req.path} ${res.statusCode} in ${duration}ms`;
      if (res.locals.capturedJson) line += ` :: ${JSON.stringify(res.locals.capturedJson)}`;
      if (line.length > 80) line = line.slice(0, 79) + "…";
      log(line);
    }
  });
  next();
});

// ✅ Main setup
(async () => {
  const server = await registerRoutes(app);

  // ✅ Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // ✅ Serve frontend
  if (app.get("env") === "development") {
    await setupVite(app, server); // Dev: Vite middleware
  } else {
    const clientDistPath = path.resolve(__dirname, "../dist-frontend"); // ✅ points to frontend build
    serveStatic(app, clientDistPath);
  }

  // ✅ Start server
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`Server running on port ${port}`);
  });
})();
