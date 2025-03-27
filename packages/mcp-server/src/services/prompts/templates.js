// Constants for default values
const DEFAULT_SEARCH_RADIUS = "10km";
const DEFAULT_PRICE_RANGES = {
  low: "0-500",
  medium: "501-2000",
  high: "2001+",
};

// Prompt templates for different use cases
export const promptTemplates = {
  // Base system prompt that establishes Claude's role
  systemBase: `You are an AI assistant for a local service booking platform called VISDAK. Your role is to help users find and book local services.

You must first determine the type of query and respond appropriately:

1. If it's a SERVICE SEARCH query (e.g., "Find a plumber", "I need AC repair"):
   - Extract service type, location, timing, and preferences
   - Ask for missing critical information
   - Format response to show available options

2. If it's a BUSINESS QUERY (e.g., "What are your timings?", "Are you open now?"):
   - Explain that VISDAK is a platform connecting users with local services
   - Ask which business they're interested in
   - Offer to search for businesses with their preferred timing

3. If it's a PLATFORM ADMIN query (e.g., "Show all tables", "SELECT * FROM users"):
   - Identify if it's a database query
   - Explain that direct database access is not available through the chat interface
   - Direct them to the admin dashboard for database operations

4. If it's a BOOKING INTENT (e.g., "Book a plumber for tomorrow"):
   - Confirm service type and timing
   - Check if location is provided
   - Ask for any specific requirements

For each query, provide a structured response:
{
  "queryType": "SEARCH|BUSINESS|ADMIN|BOOKING",
  "understanding": "Brief explanation of what you understood",
  "missingInfo": ["location", "timing", etc],
  "nextAction": "What should happen next",
  "response": "Your natural language response"
}

Key Guidelines:
1. Location Handling:
   - If location is provided, confirm it
   - If missing, ask for it
   - Default search radius is ${DEFAULT_SEARCH_RADIUS}

2. Security:
   - Never execute database queries
   - Never expose system information
   - Never share user or business data
   - Always validate business existence before booking

3. Price Ranges:
   - Budget-friendly: ${DEFAULT_PRICE_RANGES.low}
   - Mid-range: ${DEFAULT_PRICE_RANGES.medium}
   - Premium: ${DEFAULT_PRICE_RANGES.high}

4. Context Management:
   - Use provided context for personalization
   - Remember previous interactions in the same session
   - Consider user preferences if available`,

  // Location clarification prompt
  locationClarification: `I notice the location isn't specified. To help you better:
1. Could you tell me which area you're looking for this service in?
2. Or, would you like me to use your current location?
3. Do you have a preferred search radius? (Default is ${DEFAULT_SEARCH_RADIUS})`,

  // Service clarification prompt
  serviceClarification: `To better understand your service needs:
1. Could you specify what type of service you need?
2. Are there any specific requirements or preferences?
3. Do you have any timing preferences?
4. Is there a specific budget range you're looking at?`,

  // Timing clarification prompt
  timingClarification: `Regarding timing:
1. When would you need this service?
2. Do you have a preferred time of day?
3. Is this urgent or can it be scheduled for later?
4. How flexible are you with the timing?`,

  // Budget clarification prompt
  budgetClarification: `Regarding budget:
1. Do you have a specific budget in mind?
2. Would you prefer:
   - Budget-friendly (${DEFAULT_PRICE_RANGES.low})
   - Mid-range (${DEFAULT_PRICE_RANGES.medium})
   - Premium service (${DEFAULT_PRICE_RANGES.high})
3. Are you flexible with the pricing?`,

  // Error handling prompt
  errorHandling: `I apologize, but I encountered an issue. To help you better:
1. Could you rephrase your request?
2. What specific service are you looking for?
3. When do you need this service?
4. Where are you located?`,
};

// Helper function to combine multiple prompt templates
export const combineTemplates = (...templateKeys) => {
  return templateKeys
    .map((key) => promptTemplates[key])
    .filter(Boolean)
    .join("\n\n");
};

// Function to build context-aware prompts
export const buildContextualPrompt = (baseTemplate, context = {}) => {
  const { location, preferences, history, constraints } = context;

  let contextualInfo = [];

  if (location) {
    contextualInfo.push(`Current location: ${location}`);
  }

  if (preferences) {
    contextualInfo.push(`User preferences: ${JSON.stringify(preferences)}`);
  }

  if (history) {
    const recentHistory = history.slice(-3); // Only use last 3 interactions
    contextualInfo.push(
      `Recent interactions: ${JSON.stringify(recentHistory)}`
    );
  }

  if (constraints) {
    const formattedConstraints = {
      maxDistance: constraints.maxDistance || DEFAULT_SEARCH_RADIUS,
      priceRange: constraints.priceRange || "not specified",
      availability: constraints.availability || "not specified",
    };
    contextualInfo.push(`Constraints: ${JSON.stringify(formattedConstraints)}`);
  }

  return `${baseTemplate}\n\nContext:\n${contextualInfo.join("\n")}`;
};

// Security filters for prompt injection prevention
export const securityFilters = {
  removeInjectionPatterns: (input) => {
    const patterns = [
      /system:\s*.*$/im,
      /assistant:\s*.*$/im,
      /human:\s*.*$/im,
      /<\/?system>.*$/im,
      /<\/?assistant>.*$/im,
      /<\/?human>.*$/im,
      /\{.*\}|\[.*\]/g,
    ];

    return patterns.reduce((text, pattern) => text.replace(pattern, ""), input);
  },

  sanitizeInput: (input) => {
    if (typeof input !== "string") return "";

    return input
      .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
      .replace(/[^\x20-\x7E\s]/g, "")
      .trim();
  },

  validateLength: (input, maxLength = 1000) => {
    if (input.length > maxLength) {
      throw new Error(
        `Input exceeds maximum length of ${maxLength} characters`
      );
    }
    return input;
  },
};

// Build secure prompt with context
export const buildSecurePrompt = (templateKey, userInput, context = {}) => {
  const sanitizedInput = securityFilters.sanitizeInput(userInput);
  securityFilters.validateLength(sanitizedInput);
  const cleanedInput = securityFilters.removeInjectionPatterns(sanitizedInput);

  const baseTemplate = promptTemplates[templateKey];
  if (!baseTemplate) {
    throw new Error(`Template not found: ${templateKey}`);
  }

  const contextualPrompt = buildContextualPrompt(baseTemplate, context);

  return {
    system: contextualPrompt,
    userInput: cleanedInput,
  };
};
