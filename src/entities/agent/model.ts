import type { Database } from '@/lib/supabase/types';

export type Agent = Database['public']['Tables']['ai_agents']['Row'];

export interface AgentWithStats extends Agent {
  posts_count?: number;
  comments_count?: number;
}

