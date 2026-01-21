/**
 * Gemini AI Text Generation
 * 
 * This module provides text generation using Google's Gemini AI API.
 * It's used for generating AI agent responses, post content, and other
 * text-based AI features.
 * 
 * Configuration:
 * - Uses Gemini 2.0 Flash Lite model (free tier)
 * - Requires VITE_GEMINI_API_KEY environment variable
 * - Includes timeout handling (30 seconds) to prevent hanging
 * - Handles errors gracefully with user-friendly messages
 * 
 * API Documentation: https://ai.google.dev/gemini-api/docs/quickstart
 */
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * Gemini API Response Interface
 * 
 * Defines the structure of the response from the Gemini API.
 * The response contains candidates, each with content parts that include the generated text.
 */
export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

/**
 * Generate Text using Gemini AI
 * 
 * Sends a prompt to the Gemini API and returns the generated text response.
 * This is the core function for all AI text generation in the app.
 * 
 * Features:
 * - 30-second timeout to prevent hanging
 * - Error handling with user-friendly messages
 * - API key validation
 * - Response parsing and validation
 * 
 * @param prompt - The text prompt to send to the AI
 * @returns The generated text from Gemini
 * @throws Error if API key is missing, request fails, or timeout occurs
 */
export async function generateText(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    const errorMsg = 'GEMINI_API_KEY is not set. Please add VITE_GEMINI_API_KEY to your .env file.';
    console.error(errorMsg);
    console.error('To fix this:');
    console.error('1. Create a .env file in the project root');
    console.error('2. Add: VITE_GEMINI_API_KEY=your_api_key_here');
    console.error('3. Restart the development server');
    throw new Error(errorMsg);
  }

  try {
    // Use x-goog-api-key header instead of query parameter (new API format)
    // See: https://ai.google.dev/gemini-api/docs/quickstart
    // Add timeout to prevent hanging (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Gemini API error: ${response.status} ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          // If parsing fails, use the text as is
          if (errorText) {
            errorMessage += ` - ${errorText.substring(0, 200)}`;
          }
        }
        console.error('Gemini API error details:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(errorMessage);
      }

      const data: GeminiResponse = await response.json();
      const generatedText = data.candidates[0]?.content?.parts[0]?.text || '';
      
      if (!generatedText) {
        throw new Error('No text generated from Gemini API');
      }
      
      return generatedText;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Request timeout: The AI service took too long to respond. Please try again.');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error generating text with Gemini:', error);
    // Re-throw with a more user-friendly message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate text. Please try again.');
  }
}

/**
 * Generate Post Content
 * 
 * Generates social media post content using AI. Can optionally be themed
 * around a specific topic.
 * 
 * @param topic - Optional topic to focus the post on
 * @returns Generated post content
 */
export async function generatePostContent(topic?: string): Promise<string> {
  const prompt = topic
    ? `Write an engaging social media post about ${topic}. Keep it concise, interesting, and conversational.`
    : `Write an engaging social media post. Keep it concise, interesting, and conversational.`;
  
  return generateText(prompt);
}

/**
 * Generate Comment
 * 
 * Generates a thoughtful comment for a given post. The AI reads the post
 * content and creates a relevant, engaging comment.
 * 
 * @param postContent - The content of the post to comment on
 * @returns Generated comment text
 */
export async function generateComment(postContent: string): Promise<string> {
  const prompt = `Write a thoughtful and engaging comment on this post: "${postContent}". Keep it brief and relevant.`;
  return generateText(prompt);
}

