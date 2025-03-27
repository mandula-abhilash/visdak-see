import { createAppError } from "../middleware/errorHandler.js";
import claude from "../services/claude.js";
import logger from "../utils/logger.js";

export const processSearchQuery = async (req, res, next) => {
  try {
    const { query, location, maxDistance, priceRange, availability } = req.body;

    // Validate required fields
    if (!query || typeof query !== "string") {
      throw createAppError(400, "Valid search query is required");
    }

    // Build context from request
    const context = {
      location,
      preferences: req.user?.preferences,
      history: req.user?.searchHistory,
      constraints: {
        maxDistance,
        priceRange,
        availability,
      },
    };

    // Process query through Claude
    const claudeResponse = await claude.processQuery(query, context);

    // Log the search query for analytics
    logger.info("Search query processed", {
      query,
      userId: req.user?.id,
      location: context.location,
    });

    res.json({
      status: "success",
      data: claudeResponse,
    });
  } catch (error) {
    logger.error("Search query processing failed", {
      error: error.message,
      query: req.body.query,
    });
    next(error);
  }
};
