import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestValidator } from "./middleware/requestValidator.js";
import logger from "./utils/logger.js";
import routes from "./routes/index.js";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("combined", { stream: logger.stream }));
app.use(requestValidator);

// Routes
app.use("/api", routes);

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    res
      .status(200)
      .json({ status: "healthy", timestamp: new Date().toISOString() });
  } catch (error) {
    logger.error("Health check failed:", error);
    res.status(500).json({ status: "error", message: "Health check failed" });
  }
});

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    app.listen(port, () => {
      logger.info(`MCP Server listening on port ${port}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
