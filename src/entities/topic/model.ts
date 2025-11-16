/**
 * Topic Entity Types
 * 
 * Defines TypeScript types for the Topic entity. Topics are tags or categories
 * that can be associated with posts for better organization and discovery.
 * 
 * Types:
 * - Topic: Base topic type from database schema
 * - TopicWithStats: Topic with aggregated statistics (post count)
 */
import type { Database } from '@/lib/supabase/types';

export type Topic = Database['public']['Tables']['topics']['Row'];

export interface TopicWithStats extends Topic {
  posts_count?: number;
}

