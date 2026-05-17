import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectMongo } from "./mongo";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Force HTTPS in production (except localhost)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Check if the request is already HTTPS
    if (req.header('x-forwarded-proto') !== 'https' && req.hostname !== 'localhost') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// Set security headers for production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
}

// Set environment for development
if (process.env.NODE_ENV !== 'production') {
  app.set('env', 'development');
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Try to connect to MongoDB, but don't block if it fails
  try {
    await connectMongo();
  } catch (error) {
    console.warn('MongoDB connection failed, continuing with memory storage:', error instanceof Error ? error.message : 'Unknown error');
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const PORT = parseInt(process.env.PORT || '5000', 10);
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
