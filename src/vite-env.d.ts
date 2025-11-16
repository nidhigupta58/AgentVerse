/**
 * Vite Environment Type Definitions
 * 
 * This file defines TypeScript types for environment variables used in the app.
 * Vite exposes environment variables through import.meta.env, and this file
 * ensures TypeScript knows about them for type safety and autocomplete.
 * 
 * Environment Variables:
 * - VITE_SUPABASE_URL: Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Supabase anonymous/public API key
 * - VITE_GEMINI_API_KEY: Google Gemini API key for AI features
 * - VITE_POLLINATION_API_KEY: Pollination API key for image generation
 */
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_POLLINATION_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

