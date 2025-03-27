import { Anthropic } from "@anthropic-ai/sdk";
import { RateLimiterMemory } from "rate-limiter-flexible";
import logger from "../utils/logger.js";
import { buildSecurePrompt } from "./prompts/templates.js";
import config from "../config/env.js";

// Rate limiter configuration
const rateLimiter = new RateLimiterMemory({
  points: config.rateLimiting.maxRequests,
  duration: config.rateLimiting.windowMs / 1000, // Convert ms to seconds
});

// Create Claude client with validation
const createClaudeClient = () => {
  return new Anthropic({
    apiKey: config.anthropicApiKey,
  });
};

// Parse JSON response from Claude
const parseClaudeResponse = (response) => {
  try {
    return JSON.parse(response);
  } catch (error) {
    logger.error("Failed to parse Claude response as JSON:", {
      error: error.message,
      response,
    });
    return {
      queryType: "ERROR",
      understanding: "Failed to parse response",
      missingInfo: [],
      nextAction: "Retry query",
      response:
        "I apologize, but I encountered an error processing your request. Could you please try again?",
    };
  }
};

// Process user query with context management
const processQuery = async (query, context = {}) => {
  try {
    // Apply rate limiting
    await rateLimiter.consume("claude-api");

    const client = createClaudeClient();

    // Build secure prompt with context
    const { system, userInput } = buildSecurePrompt(
      "systemBase",
      query,
      context
    );

    // Send request to Claude
    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL,
      max_tokens: 1024,
      system,
      messages: [
        {
          role: "user",
          content: userInput,
        },
      ],
    });

    // Parse the JSON response
    const parsedResponse = parseClaudeResponse(response.content[0].text);

    // Log successful query
    logger.info("Query processed successfully", {
      query: userInput,
      context: JSON.stringify(context),
    });

    return {
      response: parsedResponse,
      context: {
        ...context,
        lastQuery: userInput,
        lastResponse: parsedResponse,
      },
    };
  } catch (error) {
    // Handle specific error types
    if (error.name === "RateLimiterError") {
      logger.warn("Rate limit exceeded for Claude API");
      throw new Error("Too many requests. Please try again later.");
    }

    if (error.status === 401) {
      logger.error("Authentication failed with Claude API");
      throw new Error("Failed to authenticate with AI service");
    }

    if (error.status === 429) {
      logger.warn("Claude API rate limit exceeded");
      throw new Error(
        "Service is temporarily busy. Please try again in a moment."
      );
    }

    // Log and handle unexpected errors
    logger.error("Error processing Claude query:", {
      error: error.message,
      stack: error.stack,
      query,
      context: JSON.stringify(context),
    });

    throw new Error("Failed to process your request. Please try again.");
  }
};

export default {
  processQuery,
};
