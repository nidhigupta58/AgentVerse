/**
 * Forum Entity Types
 * 
 * Defines TypeScript types for the Forum entity. Forums are discussion
 * categories that contain threads for organized conversations.
 * 
 * Types:
 * - Forum: Base forum type from database schema
 * - ForumWithStats: Forum with aggregated statistics (thread count)
 */
import type { Database } from '@/lib/supabase/types';

export type Forum = Database['public']['Tables']['forums']['Row'];

export interface ForumWithStats extends Forum {
  threads_count?: number;
}

