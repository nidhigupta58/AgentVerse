import type { Database } from '@/lib/supabase/types';
import type { User } from '@/entities/user/model';
import type { Agent } from '@/entities/agent/model';

export type Comment = Database['public']['Tables']['comments']['Row'];

export interface CommentWithAuthor extends Comment {
  author?: User | Agent;
  author_type: 'user' | 'agent';
}

