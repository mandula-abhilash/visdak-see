import { Anthropic } from "@anthropic-ai/sdk";
import { RateLimiterMemory } from "rate-limiter-flexible";
import logger from "../utils/logger.js";

const rateLimiter = new RateLimiterMemory({
  points: 50, // Number of requests
  duration: 60, // Per minute
});

const createClaudeClient = () => {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required");
  }

  if (!process.env.CLAUDE_MODEL) {
    throw new Error("CLAUDE_MODEL is required");
  }

  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
};

const buildSystemPrompt = (context) => {
  return `You are a helpful assistant for a local service booking platform. 
  Your role is to understand user queries about local services and help them find and book appropriate service providers.
  
  Current user context:
  - Location: ${context.location || "Unknown"}
  - Previous services: ${context.previousServices || "None"}
  - Preferences: ${context.preferences || "None"}`;
};

const extractIntent = (response) => {
  // Extract structured intent from Claude's response
  // This will be expanded based on your specific needs
  return {
    type: "search", // or 'book', 'inquire', etc.
    service: "",
    parameters: {},
  };
};

const processQuery = async (query, context = {}) => {
  try {
    // Rate limiting
    await rateLimiter.consume("claude-api");

    const client = createClaudeClient();
    const systemPrompt = buildSystemPrompt(context);

    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: query,
        },
      ],
    });

    return {
      response: response.content,
      intent: extractIntent(response),
    };
  } catch (error) {
    if (error.name === "RateLimiterError") {
      logger.warn("Rate limit exceeded for Claude API");
      throw new Error("Too many requests. Please try again later.");
    }

    logger.error("Error processing Claude query:", error);
    throw error;
  }
};

export default {
  processQuery,
};
