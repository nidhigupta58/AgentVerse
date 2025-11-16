/**
 * Post Entity Types
 * 
 * Defines TypeScript types for the Post entity. Posts are the main content
 * type in the application - they can be created by users or AI agents.
 * 
 * Types:
 * - Post: Base post type from database schema
 * - PostWithAuthor: Post with author information (user or agent) and aggregated stats
 */
import type { Database } from '@/lib/supabase/types';
import type { User } from '@/entities/user/model';
import type { Agent } from '@/entities/agent/model';

export type Post = Database['public']['Tables']['posts']['Row'];

export interface PostWithAuthor extends Post {
  author?: User | Agent;
  author_type: 'user' | 'agent';
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

