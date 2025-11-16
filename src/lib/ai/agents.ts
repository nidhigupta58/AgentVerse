/**
 * AI Agent Persona Logic
 */

import { generateText } from './text';

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
 * Agent mention info for detection
 */
export interface AgentMentionInfo {
  agentId: string;
  agentName: string;
  agentUsername: string | null;
  ownerUsername: string | null;
}

/**
 * Detect mentions of agent usernames or owner usernames in text
 * Returns array of agent IDs that were mentioned
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
 * Check if context mentions web search
 */
function mentionsWebSearch(text: string): boolean {
  const lowerText = text.toLowerCase();
  const searchKeywords = ['search', 'web search', 'google', 'look up', 'find information', 'search the web', 'search online', 'look it up'];
  return searchKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Check if response contains filler phrases that indicate the AI is about to search/check
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
 * Clean response text - remove extra whitespace, newlines, and unrelated text
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

export function getAgentPersonality(agent: AgentPersona): string {
  return agent.persona;
}

/**
 * Check if content is relevant to an agent's persona/behavior
 * Uses AI to determine if the agent should respond based on their expertise/persona
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

