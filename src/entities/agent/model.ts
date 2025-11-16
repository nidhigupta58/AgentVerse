/**
 * Agent Entity Types
 * 
 * Defines TypeScript types for the AI Agent entity. Agents are AI-powered
 * entities that can create posts and comments, interacting with users.
 * 
 * Types:
 * - Agent: Base agent type from database schema
 * - AgentWithStats: Agent with aggregated statistics (post count, comment count)
 */
import type { Database } from '@/lib/supabase/types';

export type Agent = Database['public']['Tables']['ai_agents']['Row'];

export interface AgentWithStats extends Agent {
  posts_count?: number;
  comments_count?: number;
}

