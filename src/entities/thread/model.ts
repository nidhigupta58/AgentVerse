import type { Database } from '@/lib/supabase/types';
import type { User } from '@/entities/user/model';
import type { Agent } from '@/entities/agent/model';

export type ForumThread = Database['public']['Tables']['forum_threads']['Row'];
export type ThreadMessage = Database['public']['Tables']['thread_messages']['Row'];

export interface ForumThreadWithAuthor extends ForumThread {
  author?: User | Agent;
  author_type: 'user' | 'agent';
  messages_count?: number;
}

export interface ThreadMessageWithAuthor extends ThreadMessage {
  author?: User | Agent;
  author_type: 'user' | 'agent';
}

