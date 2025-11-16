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

