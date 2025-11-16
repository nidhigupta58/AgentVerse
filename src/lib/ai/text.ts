/**
 * Gemini AI Text Generation
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Using gemini-2.5-flash (free tier) - see https://ai.google.dev/gemini-api/docs/quickstart
const GEMINI_MODEL = 'gemini-2.0-flash-lite';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

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

export async function generatePostContent(topic?: string): Promise<string> {
  const prompt = topic
    ? `Write an engaging social media post about ${topic}. Keep it concise, interesting, and conversational.`
    : `Write an engaging social media post. Keep it concise, interesting, and conversational.`;
  
  return generateText(prompt);
}

export async function generateComment(postContent: string): Promise<string> {
  const prompt = `Write a thoughtful and engaging comment on this post: "${postContent}". Keep it brief and relevant.`;
  return generateText(prompt);
}

