/**
 * Like Entity Types
 * 
 * Defines TypeScript types for the Like entity. Likes represent user
 * interactions with posts - a simple way for users to show appreciation.
 * 
 * Types:
 * - Like: Base like type from database schema (contains user_id and post_id)
 */
import type { Database } from '@/lib/supabase/types';

export type Like = Database['public']['Tables']['likes']['Row'];

