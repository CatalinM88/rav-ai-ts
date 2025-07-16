import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import winston from "winston";
import { chromium } from "playwright";
import net from "net";

const app = express();
const PORT = process.env.PORT || 3000;
const WS_PORT_START = parseInt(process.env.WS_PORT_START || "35555", 10);
const WS_PORT_END = parseInt(process.env.WS_PORT_END || "35655", 10);

// Track used ports to avoid conflicts
const usedPorts = new Set();
const portAllocationTime = new Map(); // Track when ports were allocated

// Helper to find a free port in the allowed range with retry logic
async function getFreePortInRange(start, end, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    for (let port = start; port <= end; port++) {
      if (!usedPorts.has(port)) {
        try {
          const isFree = await isPortFree(port);
          if (isFree) {
            usedPorts.add(port);
            portAllocationTime.set(port, Date.now());
            console.log(`Allocated port ${port} on attempt ${attempt + 1}`);
            return port;
          }
        } catch (error) {
          console.log(`Port ${port} check failed: ${error.message}`);
          continue;
        }
      }
    }

    // If no port found, wait a bit and try again
    if (attempt < maxRetries - 1) {
      console.log(`No free ports found on attempt ${attempt + 1}, retrying in 100ms...`);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Clean up stale port allocations (older than 30 seconds)
      const now = Date.now();
      for (const [port, allocationTime] of portAllocationTime.entries()) {
        if (now - allocationTime > 30000) {
          usedPorts.delete(port);
          portAllocationTime.delete(port);
          console.log(`Cleaned up stale port allocation: ${port}`);
        }
      }
    }
  }
  throw new Error(`No free port in range ${start}-${end} after ${maxRetries} attempts`);
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    const timeout = setTimeout(() => {
      server.close();
      resolve(false);
    }, 1000); // 1 second timeout

    server.once("error", () => {
      clearTimeout(timeout);
      resolve(false);
    });

    server.once("listening", () => {
      clearTimeout(timeout);
      server.close(() => resolve(true));
    });

    server.listen(port, "0.0.0.0");
  });
}

function releasePort(port) {
  usedPorts.delete(port);
  portAllocationTime.delete(port);
  console.log(`Released port: ${port}`);
}

// Configure logging
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: "logs/app.log" })],
});

// Store active browser contexts
const activeContexts = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// POST /instance - Create new browser context
app.post("/instance", async (req, res) => {
  let port = null;
  let browser = null;

  try {
    console.log("Testing Playwright launchServer...");
    port = await getFreePortInRange(WS_PORT_START, WS_PORT_END);
    console.log(`Using port: ${port}`);

    browser = await chromium.launchServer({
      headless: process.env.NODE_ENV === "production" || process.env.DOCKER === "true",
      port,
      args:
        process.env.NODE_ENV === "production" || process.env.DOCKER === "true"
          ? ["--no-sandbox", "--disable-setuid-sandbox", "--remote-debugging-address=0.0.0.0"]
          : ["--start-maximized"],
    });

    let wsEndpoint = browser.wsEndpoint();
    if (process.env.DOCKER === "true") {
      const hostIP = process.env.HOST_WS_IP || "localhost";
      wsEndpoint = wsEndpoint.replace("ws://localhost:", `ws://${hostIP}:`);
      console.log("Docker mode - returning wsEndpoint for external access:", wsEndpoint);
    } else {
      wsEndpoint = wsEndpoint.replace(/ws:\/\/127\.0\.0\.1:/, "ws://localhost:");
      console.log("Local mode - returning wsEndpoint:", wsEndpoint);
    }

    const contextId = uuidv4();
    activeContexts.set(contextId, { browser, port });

    res.json({
      id: contextId,
      wsEndpoint,
      message: "Browser context created successfully",
    });
  } catch (error) {
    console.error("Error:", error.message);

    // Cleanup on error
    if (port) {
      releasePort(port);
    }
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Error closing browser on failure:", closeError.message);
      }
    }

    res.status(500).json({ error: error.message });
  }
});

// DELETE /instance/:id - Close browser context
app.delete("/instance/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const contextData = activeContexts.get(id);
    if (!contextData) {
      logger.warn(`Context not found: ${id}`);
      return res.status(404).json({ error: "Context not found" });
    }

    logger.info(`Closing browser context: ${id}`);

    if (contextData.browser) {
      await contextData.browser.close();
    }

    // Release the port
    if (contextData.port) {
      releasePort(contextData.port);
    }

    activeContexts.delete(id);

    logger.info(`Browser context closed: ${id}`);
    res.json({ message: "Browser context closed successfully" });
  } catch (error) {
    logger.error(`Error closing browser context ${id}:`, error);
    res.status(500).json({ error: "Failed to close browser context" });
  }
});

// GET /contexts - List active contexts
app.get("/contexts", (req, res) => {
  const contexts = Array.from(activeContexts.keys());
  res.json({
    activeContexts: contexts,
    count: contexts.length,
    usedPorts: Array.from(usedPorts),
  });
});

// GET /health - Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    activeContexts: activeContexts.size,
    usedPorts: usedPorts.size,
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`🚀 Playwright API server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Shutting down server...");

  // Close all active contexts
  for (const [id, contextData] of activeContexts) {
    try {
      if (contextData.browser) {
        await contextData.browser.close();
      }
      logger.info(`Closed context: ${id}`);
    } catch (error) {
      logger.error(`Error closing context ${id}:`, error);
    }
  }

  process.exit(0);
});
