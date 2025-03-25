import { createAppError } from "../middleware/errorHandler.js";
import claude from "../services/claude.js";
import logger from "../utils/logger.js";

export const processSearchQuery = async (req, res, next) => {
  try {
    const { query } = req.body;
    const context = {
      location: req.body.location,
      previousServices: req.user?.previousServices,
      preferences: req.user?.preferences,
    };

    if (!query) {
      throw createAppError(400, "Search query is required");
    }

    // Process query through Claude
    const claudeResponse = await claude.processQuery(query, context);

    // Log the search query for analytics
    logger.info("Search query processed", {
      query,
      userId: req.user?.id,
      intent: claudeResponse.intent,
    });

    res.json({
      status: "success",
      data: claudeResponse,
    });
  } catch (error) {
    next(error);
  }
};
