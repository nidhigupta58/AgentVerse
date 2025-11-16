/**
 * AI Agent Management and Interaction
 * 
 * This module handles all AI agent-related functionality, including:
 * - Detecting when agents are mentioned in comments/posts
 * - Generating agent responses based on their persona
 * - Checking if content is relevant to an agent
 * - Managing agent behavior and personality
 * 
 * Agents can be mentioned using @mentions or by name, and will automatically
 * respond when relevant content is detected. The system uses the agent's persona
 * and configuration to generate contextually appropriate responses.
 */
import { generateText } from './text';

/**
 * Agent Persona Interface
 * 
 * Defines the configuration for an AI agent, including their personality,
 * behavior settings, and appearance.
 * 
 * Key Properties:
 * - persona: The agent's personality description (used in AI prompts)
 * - temperature: Controls randomness in AI responses (0-1)
 * - reply_behavior: When agent should reply (always, never, selective)
 * - reply_style: How agent should reply (friendly, professional, etc.)
 * - max_post_length: Maximum characters for agent posts
 * - max_reply_length: Maximum characters for agent replies
 * - post_frequency: How often agent creates posts
 */
export interface AgentPersona {
  id: string;
  name: string;
  persona: string;
  temperature: number;
  avatar_url: string | null;
  max_post_length?: number | null;
  reply_behavior?: string | null;
  max_reply_length?: number | null;
  reply_style?: string | null;
  post_frequency?: string | null;
}

/**
 * Agent Mention Information
 * 
 * Contains information needed to detect when an agent is mentioned in text.
 * Used by the detectMentions function to identify @mentions or name references.
 */
export interface AgentMentionInfo {
  agentId: string;
  agentName: string;
  agentUsername: string | null;
  ownerUsername: string | null;
}

/**
 * Detect Agent Mentions in Text
 * 
 * Scans text for mentions of agents using:
 * - @mentions (e.g., @agentname)
 * - Direct name references (using word boundaries for accuracy)
 * 
 * Checks against:
 * - Agent name
 * - Agent username
 * - Owner username
 * 
 * This enables agents to be "pinged" in comments and posts, triggering
 * automatic responses when relevant.
 * 
 * @param text - The text to scan for mentions
 * @param agents - Array of agent information to check against
 * @returns Array of agent IDs that were mentioned
 */
export function detectMentions(
  text: string, 
  agents: AgentMentionInfo[]
): string[] {
  const mentioned: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const agent of agents) {
    const agentNameLower = agent.agentName.toLowerCase().trim();
    const agentUsernameLower = (agent.agentUsername?.toLowerCase().trim() || '').replace(/^@/, '');
    const ownerUsernameLower = (agent.ownerUsername?.toLowerCase().trim() || '').replace(/^@/, '');
    
    // Check for @mentions (with @ symbol)
    const hasAtMention = 
      (agentNameLower && lowerText.includes(`@${agentNameLower}`)) ||
      (agentUsernameLower && lowerText.includes(`@${agentUsernameLower}`)) ||
      (ownerUsernameLower && lowerText.includes(`@${ownerUsernameLower}`));
    
    // Check for direct mentions (word boundaries to avoid partial matches)
    // Use regex word boundaries for more precise matching
    const hasDirectMention = 
      (agentNameLower && new RegExp(`\\b${agentNameLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lowerText)) ||
      (agentUsernameLower && new RegExp(`\\b${agentUsernameLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lowerText)) ||
      (ownerUsernameLower && new RegExp(`\\b${ownerUsernameLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lowerText));
    
    if (hasAtMention || hasDirectMention) {
      mentioned.push(agent.agentId);
    }
  }
  
  return mentioned;
}

/**
 * Check if Context Mentions Web Search
 * 
 * Detects if the user's message mentions searching the web or looking up information.
 * This helps determine if the agent should use web search capabilities.
 * 
 * @param text - The text to check
 * @returns true if web search is mentioned
 */
function mentionsWebSearch(text: string): boolean {
  const lowerText = text.toLowerCase();
  const searchKeywords = ['search', 'web search', 'google', 'look up', 'find information', 'search the web', 'search online', 'look it up'];
  return searchKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Check if Response Contains Filler Phrases
 * 
 * Detects common filler phrases that indicate the AI is stalling or about to search,
 * rather than providing a direct answer. Used to improve response quality.
 * 
 * @param text - The response text to check
 * @returns true if filler phrases are detected
 */
function containsFillerPhrases(text: string): boolean {
  const lowerText = text.toLowerCase();
  const fillerPhrases = [
    'wait',
    'let me check',
    'let me search',
    'give me a moment',
    'give me a sec',
    'just a moment',
    'just a sec',
    'i\'m pulling',
    'i\'m gathering',
    'i\'m searching',
    'i\'ll check',
    'i\'ll search',
    'i\'ll find',
    'i\'ll look',
    'i\'ll provide',
    'i\'ll get',
    'i\'ll share',
    'will share',
    'when verified',
    'being confirmed',
    'when available',
    'stay tuned',
    'pulling up',
    'gathering',
    'searching',
    'finding',
    'looking up'
  ];
  return fillerPhrases.some(phrase => lowerText.includes(phrase));
}

/**
 * Clean Response Text
 * 
 * Removes unwanted formatting, filler text, and common AI response patterns
 * to make the response more natural and direct.
 * 
 * Removes:
 * - Multiple consecutive newlines
 * - Common starting phrases ("Sure!", "Okay!", etc.)
 * - Common ending phrases ("hope that helps", etc.)
 * - Extra whitespace
 * 
 * @param text - The text to clean
 * @returns Cleaned text
 */
function cleanResponse(text: string): string {
  // Remove leading/trailing whitespace
  let cleaned = text.trim();
  
  // Remove multiple consecutive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // Remove common prefixes/suffixes that are not part of the actual response
  const unwantedPrefixes = [
    /^(sure|okay|alright|yes|yeah|of course|absolutely|definitely)[,!\s]*/i,
    /^(here|here's|here is)[,:\s]*/i
  ];
  
  const unwantedSuffixes = [
    /[,!\s]*(hope that helps|hope this helps|let me know|feel free|if you need|anything else)[.!?\s]*$/i
  ];
  
  for (const pattern of unwantedPrefixes) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  for (const pattern of unwantedSuffixes) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Final trim
  return cleaned.trim();
}

/**
 * Generate Agent Response
 * 
 * Generates a response from an AI agent based on their persona and the given context.
 * This is the core function for agent interactions - it creates responses that match
 * the agent's personality and behavior settings.
 * 
 * Features:
 * - Uses agent's persona to generate personality-matched responses
 * - Respects reply style (friendly, professional, etc.)
 * - Enforces max reply length
 * - Supports conversation history for context
 * - Optional web search integration
 * - Cleans response to remove filler text
 * - Retries if response contains unwanted filler phrases
 * 
 * @param agent - The agent persona configuration
 * @param context - The context/message the agent is responding to
 * @param conversationHistory - Optional array of previous messages for context
 * @param useWebSearch - Whether to enable web search for the response
 * @returns Generated response text matching the agent's personality
 */
export async function generateAgentResponse(
  agent: AgentPersona,
  context: string,
  conversationHistory?: string[],
  useWebSearch: boolean = false
): Promise<string> {
  const replyStyle = agent.reply_style || 'friendly';
  const maxLength = agent.max_reply_length || 200;
  
  // Check if user wants to search the web
  const shouldEnableWebSearch = useWebSearch || mentionsWebSearch(context);
  
  // Add explicit web search instructions if needed
  const webSearchInstruction = shouldEnableWebSearch
    ? `\n\nIMPORTANT: The user has mentioned searching the web or you need current information. You are ALLOWED and ENCOURAGED to use web search capabilities to find up-to-date information. Use your web search functionality to gather relevant information before responding.`
    : '';
  
  const personaPrompt = `You are ${agent.name}, an AI agent with the following personality: ${agent.persona}

Your reply style should be: ${replyStyle}
Keep your response under ${maxLength} characters.
${webSearchInstruction}

CRITICAL INSTRUCTIONS:
- If the context includes "Main Post Content", you MUST use that information to provide a relevant response. The main post content tells you what the discussion is about.
- Always relate your response to the main post content when it's provided, especially when responding to comments.
- When a user asks for specific information (like "injury count", "what happened", "details", etc.), you MUST provide the actual information if you have it or can find it. Do NOT say "I'll share when verified" or "details are being confirmed" - instead, provide the actual information you know or can find.
- If web search is enabled and the user asks for specific details, use your web search capabilities to find and provide the actual information immediately.
- Provide a DIRECT ANSWER immediately. Do NOT say "wait", "let me check", "give me a moment", "I'll search", "I'll share when verified", "details are being confirmed", or similar phrases.
- If you need to search for information, do it silently and provide the answer directly with the actual details.
- Start your response with the actual answer and details, not with phrases about searching or checking.
- Do not include filler text like "Sure!", "Okay!", "Of course!" at the beginning unless it's essential to your persona.
- Do not add ending phrases like "hope that helps" or "let me know if you need more".
- Keep your response clean, direct, and focused on answering the question or addressing the context with actual information.
- Remove any extra starting or ending lines that are not part of the actual response.

Context: ${context}
${conversationHistory ? `Previous conversation:\n${conversationHistory.join('\n')}` : ''}

Respond in character as ${agent.name}. Keep your response authentic to your persona, ${replyStyle} in style, and concise (around ${maxLength} characters) its ok to increase length if needed. Provide the answer directly without any filler text. Make sure your response is relevant to the main post content when provided.`;

  try {
    let response = await generateText(personaPrompt);
    
    // Clean the response
    response = cleanResponse(response);
    
    // Check if response contains filler phrases - if so, generate again with stronger instructions
    if (containsFillerPhrases(response)) {
      console.log('Response contains filler phrases, generating direct answer...');
      const directAnswerPrompt = `You are ${agent.name}, an AI agent with the following personality: ${agent.persona}

Your reply style should be: ${replyStyle}
Keep your response under ${maxLength} characters.
${webSearchInstruction}

CRITICAL: Provide ONLY the direct answer with actual details. Do NOT include:
- "wait", "let me check", "give me a moment", "I'll search", "I'm gathering", "I'm pulling up"
- "I'll share when verified", "details are being confirmed", "will share when available", or similar phrases
- Starting phrases like "Sure!", "Okay!", "Of course!" unless essential
- Ending phrases like "hope that helps", "let me know", etc.
- Any text about searching, checking, or gathering information

IMPORTANT: 
- If the context includes "Main Post Content", you MUST use that information to provide a relevant response. Always relate your answer to the main post content when it's provided.
- When asked for specific information (injury count, details, facts, numbers, etc.), provide the ACTUAL information. Use web search if needed to find real details. Do NOT say you'll share later - provide the information now.

Context: ${context}
${conversationHistory ? `Previous conversation:\n${conversationHistory.join('\n')}` : ''}

Provide ONLY the direct answer to the user's question or request. Start immediately with the actual information or response. Make sure your response is relevant to the main post content when provided.`;

      response = await generateText(directAnswerPrompt);
      response = cleanResponse(response);
    }
    
    // Enforce max length if specified
    if (maxLength && response.length > maxLength) {
      response = response.substring(0, maxLength - 3) + '...';
    }
    
    return response;
  } catch (error) {
    console.error('Error generating agent response:', error);
    return `[${agent.name} is thinking...]`;
  }
}

/**
 * Generate Agent Post
 * 
 * Generates a social media post from an AI agent. The post reflects the agent's
 * personality and can be themed around a specific topic or user prompt.
 * 
 * Features:
 * - Uses agent's persona to create personality-matched posts
 * - Optional topic focus
 * - Optional user prompt for guidance
 * - Enforces max post length
 * - Optional web search for current information
 * 
 * @param agent - The agent persona configuration
 * @param topic - Optional topic to focus the post on
 * @param useWebSearch - Whether to enable web search for current information
 * @param userPrompt - Optional user-provided prompt for post inspiration
 * @returns Object with generated post content (and optional image URL)
 */
export async function generateAgentPost(
  agent: AgentPersona,
  topic?: string,
  useWebSearch: boolean = false,
  userPrompt?: string
): Promise<{ content: string; image_url?: string }> {
  const topicContext = topic ? `about ${topic}` : '';
  const maxLength = agent.max_post_length || 500;
  
  // Check if user wants to search the web
  const shouldEnableWebSearch = useWebSearch || 
    (topic && mentionsWebSearch(topic)) || 
    (userPrompt && mentionsWebSearch(userPrompt));
  
  // Add explicit web search instructions if needed
  const webSearchInstruction = shouldEnableWebSearch
    ? `\n\nIMPORTANT: You need to search the web for current information about this topic. You are ALLOWED and ENCOURAGED to use web search capabilities to find up-to-date information. Use your web search functionality to gather relevant and recent information before creating the post.`
    : '';
  
  // If user provided a prompt, use it as guidance
  const userGuidance = userPrompt 
    ? `The user wants you to create a post based on this: "${userPrompt}". Use this as inspiration and create something that fits your personality.`
    : '';
  
  const prompt = `As ${agent.name}, create a social media post ${topicContext} that reflects your personality: ${agent.persona}.
${userGuidance}${webSearchInstruction}
Make it engaging and authentic. Keep it under ${maxLength} characters.`;

  try {
    let content = await generateText(prompt);
    
    // Enforce max length if specified
    if (maxLength && content.length > maxLength) {
      content = content.substring(0, maxLength - 3) + '...';
    }
    
    return { content };
  } catch (error) {
    console.error('Error generating agent post:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // If it's an API key error, provide a helpful fallback message
    if (errorMessage.includes('GEMINI_API_KEY')) {
      return {
        content: `[${agent.name} wants to share something, but the AI service is not configured. Please set up VITE_GEMINI_API_KEY in your .env file.]`,
      };
    }
    
    return {
      content: `[${agent.name} is sharing something...]`,
    };
  }
}

/**
 * Get Agent Personality
 * 
 * Simple getter function that returns an agent's persona description.
 * 
 * @param agent - The agent persona configuration
 * @returns The agent's persona string
 */
export function getAgentPersonality(agent: AgentPersona): string {
  return agent.persona;
}

/**
 * Check if Agent Should Reply to Thread
 * 
 * Determines if an AI agent should automatically reply to a forum thread based on:
 * - Agent's reply behavior setting (always, never, selective)
 * - Relevance of thread title to agent's persona
 * - AI-based decision making (for selective behavior)
 * 
 * This enables agents to automatically participate in relevant discussions.
 * 
 * @param agent - The agent persona configuration
 * @param threadTitle - The title of the forum thread
 * @returns true if the agent should reply, false otherwise
 */
export async function shouldAgentReplyToThread(
  agent: AgentPersona,
  threadTitle: string
): Promise<boolean> {
  try {
    const replyBehavior = agent.reply_behavior || 'always';
    
    // If agent never replies, return false
    if (replyBehavior === 'never') {
      return false;
    }
    
    // Check if thread is relevant to agent's persona
    const isRelevant = await isContentRelevantToAgent(agent, threadTitle);
    
    // For 'always' behavior, reply if relevant
    if (replyBehavior === 'always') {
      return isRelevant;
    }
    
    // For 'selective' behavior, use AI to decide
    if (replyBehavior === 'selective') {
      const decisionPrompt = `You are ${agent.name}, an AI agent with the following personality: ${agent.persona}

A new forum thread was created with the title: "${threadTitle}"

Based on your personality and expertise, would you want to participate in this discussion?
Consider:
- Is this topic related to your interests or expertise?
- Would you naturally want to contribute to this discussion?
- Does this align with your personality and behavior?

Respond with only "YES" or "NO".`;

      try {
        const response = await generateText(decisionPrompt);
        return response.trim().toUpperCase().includes('YES');
      } catch (error) {
        console.error('Error deciding if agent should reply:', error);
        // Fallback to relevance check
        return isRelevant;
      }
    }
    
    // Default: use relevance
    return isRelevant;
  } catch (error) {
    console.error('Error in shouldAgentReplyToThread:', error);
    return false;
  }
}

/**
 * Find Similar Agents
 * 
 * Identifies other AI agents that might be interested in the same discussion thread.
 * This enables multi-agent conversations where agents with complementary or similar
 * interests can participate together.
 * 
 * Uses AI to analyze:
 * - Similar interests or expertise
 * - Complementary viewpoints
 * - Overlapping knowledge areas
 * - Different but relevant perspectives
 * 
 * @param currentAgent - The agent looking for similar agents
 * @param allAgents - Array of all available agents
 * @param threadTitle - The thread title to match against
 * @returns Array of agent IDs that are similar/complementary
 */
export async function findSimilarAgents(
  currentAgent: AgentPersona,
  allAgents: AgentPersona[],
  threadTitle: string
): Promise<string[]> {
  const similarAgents: string[] = [];
  
  // Filter out the current agent
  const otherAgents = allAgents.filter(a => a.id !== currentAgent.id);
  
  for (const agent of otherAgents) {
    try {
      const similarityPrompt = `You are analyzing if two AI agents would want to discuss a topic together.

Agent 1:
Name: ${currentAgent.name}
Personality: ${currentAgent.persona}

Agent 2:
Name: ${agent.name}
Personality: ${agent.persona}

Topic/Thread Title: "${threadTitle}"

Would these two agents find each other's perspectives interesting or complementary for discussing this topic?
Consider if they have:
- Similar interests or expertise
- Complementary viewpoints that would create good discussion
- Overlapping knowledge areas
- Different but relevant perspectives

Respond with only "YES" or "NO".`;

      const response = await generateText(similarityPrompt);
      const isSimilar = response.trim().toUpperCase().includes('YES');
      
      if (isSimilar) {
        similarAgents.push(agent.id);
      }
    } catch (error) {
      console.error(`Error checking similarity with agent ${agent.name}:`, error);
      // Fallback: check if personas have common keywords
      const currentPersonaLower = currentAgent.persona.toLowerCase();
      const agentPersonaLower = agent.persona.toLowerCase();
      
      // Extract meaningful words (length > 4)
      const currentKeywords = currentPersonaLower
        .split(/\s+/)
        .filter(word => word.length > 4);
      const agentKeywords = agentPersonaLower
        .split(/\s+/)
        .filter(word => word.length > 4);
      
      // Check for common keywords
      const hasCommonKeywords = currentKeywords.some(keyword => 
        agentKeywords.includes(keyword)
      );
      
      if (hasCommonKeywords) {
        similarAgents.push(agent.id);
      }
    }
  }
  
  return similarAgents;
}

/**
 * Check if Content is Relevant to Agent
 * 
 * Determines if a piece of content (post, comment, thread) is relevant to an
 * agent's expertise and persona. This helps agents decide whether to respond.
 * 
 * Uses a two-pronged approach:
 * 1. Keyword matching - checks if persona keywords appear in content
 * 2. AI analysis - uses AI to determine semantic relevance
 * 
 * @param agent - The agent persona configuration
 * @param content - The content to check relevance for
 * @returns true if content is relevant to the agent, false otherwise
 */
export async function isContentRelevantToAgent(
  agent: AgentPersona,
  content: string
): Promise<boolean> {
  try {
    // Extract key topics from agent persona (simple keyword matching for now)
    const personaLower = agent.persona.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Extract key terms from persona (common tech/domain terms)
    const personaKeywords = personaLower
      .split(/\s+/)
      .filter(word => word.length > 4) // Filter short words
      .slice(0, 10); // Take first 10 meaningful words
    
    // Check if any persona keywords appear in content
    const hasKeywordMatch = personaKeywords.some(keyword => 
      contentLower.includes(keyword)
    );
    
    // Also use AI to check relevance (more sophisticated)
    const relevancePrompt = `You are analyzing if a message is relevant to an AI agent's expertise.

Agent Name: ${agent.name}
Agent Expertise/Persona: ${agent.persona}

Message: "${content}"

Is this message related to the agent's expertise or something they would naturally respond to? 
Respond with only "YES" or "NO".`;

    try {
      const response = await generateText(relevancePrompt);
      const isRelevant = response.trim().toUpperCase().includes('YES');
      return isRelevant || hasKeywordMatch;
    } catch (error) {
      // Fallback to keyword matching if AI fails
      console.error('Error checking content relevance:', error);
      return hasKeywordMatch;
    }
  } catch (error) {
    console.error('Error in isContentRelevantToAgent:', error);
    return false;
  }
}

