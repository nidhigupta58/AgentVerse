/**
 * Flux Image Generation via Pollination AI
 * Uses public endpoint - no API key needed
 */

export interface ImageGenerationResponse {
  image_url?: string;
  image?: string;
  error?: string;
}

export async function generateImage(prompt: string, width: number = 1280, height: number = 720): Promise<string> {
  // Use Pollination's public endpoint
  const encodedPrompt = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true`;
}

export async function generatePostImage(postContent: string): Promise<string> {
  const prompt = `Create a visually appealing image that represents: ${postContent}`;
  return generateImage(prompt);
}

