import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

app.set("trust proxy", 1);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Request validation middleware for edge cases
app.use((req, res, next) => {
  // Handle malicious requests that don't follow expected patterns
  if (req.method === "POST" || req.method === "PATCH" || req.method === "PUT") {
    if (!req.is("application/json") && !req.is("multipart/form-data") && !req.is("application/x-www-form-urlencoded")) {
      // Only reject if content-type is set but invalid
      const contentType = req.get("content-type");
      if (contentType && !contentType.includes("json") && !contentType.includes("form")) {
        return res.status(415).json({ message: "Unsupported Media Type", code: "UNSUPPORTED_MEDIA" });
      }
    }
  }
  next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
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

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

// Global error handler with detailed error categorization
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let errorCode = "INTERNAL_ERROR";

    // Categorize errors for better client handling
    if (err.name === "ValidationError" || err.name === "ZodError") {
      errorCode = "VALIDATION_ERROR";
      message = "Request validation failed";
    } else if (err.name === "UnauthorizedError" || err.status === 401) {
      errorCode = "UNAUTHORIZED";
      message = "Authentication required";
    } else if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
      errorCode = "SERVICE_UNAVAILABLE";
      message = "External service unavailable";
    } else if (err.code === "LIMIT_FILE_SIZE") {
      errorCode = "FILE_TOO_LARGE";
      message = "Uploaded file exceeds maximum allowed size";
    } else if (err.message?.includes("SQLITE_CANTOPEN")) {
      errorCode = "DATABASE_ERROR";
      message = "Database connection failed";
    }

    console.error(`Error [${errorCode}]:`, err);

    if (res.headersSent) {
      return next(err);
    }

    // Don't expose internal error details in production
    const response = process.env.NODE_ENV === "production" 
      ? { message, code: errorCode }
      : { message, code: errorCode, stack: err.stack };

    return res.status(status).json(response);
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = "127.0.0.1";
  httpServer.listen(
    {
      port,
      host,
    },
    () => {
      log(`serving on http://${host}:${port}`);
    },
  );
})();
