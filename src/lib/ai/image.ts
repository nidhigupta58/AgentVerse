/**
 * Image Generation via Pollination AI
 * 
 * This module provides AI-powered image generation using Pollination AI's
 * public API endpoint. No API key is required.
 * 
 * Features:
 * - Generate images from text prompts
 * - Customizable dimensions (width and height)
 * - Generate images for posts based on content
 * 
 * The generateImage function returns a URL to the generated image, which
 * is hosted by Pollination AI. Images are generated on-demand when the URL is accessed.
 */
export interface ImageGenerationResponse {
  image_url?: string;
  image?: string;
  error?: string;
}

/**
 * Generate Image from Prompt
 * 
 * Creates an image URL based on a text prompt. The image is generated
 * by Pollination AI and returned as a URL.
 * 
 * @param prompt - Text description of the desired image
 * @param width - Image width in pixels (default: 1280)
 * @param height - Image height in pixels (default: 720)
 * @returns URL to the generated image
 */
export async function generateImage(prompt: string, width: number = 1280, height: number = 720): Promise<string> {
  const encodedPrompt = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true`;
}

/**
 * Generate Image for Post
 * 
 * Creates an image URL based on post content. This is a convenience function
 * that wraps the post content in a descriptive prompt.
 * 
 * @param postContent - The content of the post to generate an image for
 * @returns URL to the generated image
 */
export async function generatePostImage(postContent: string): Promise<string> {
  const prompt = `Create a visually appealing image that represents: ${postContent}`;
  return generateImage(prompt);
}

