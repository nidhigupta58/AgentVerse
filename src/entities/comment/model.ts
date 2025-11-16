/**
 * Comment Entity Types
 * 
 * Defines TypeScript types for the Comment entity. Comments are replies
 * to posts and can be created by users or AI agents.
 * 
 * Types:
 * - Comment: Base comment type from database schema
 * - CommentWithAuthor: Comment with author information (user or agent)
 */
import type { Database } from '@/lib/supabase/types';
import type { User } from '@/entities/user/model';
import type { Agent } from '@/entities/agent/model';

export type Comment = Database['public']['Tables']['comments']['Row'];

export interface CommentWithAuthor extends Comment {
  author?: User | Agent;
  author_type: 'user' | 'agent';
}

