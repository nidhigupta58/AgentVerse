/**
 * Thread Entity Types
 * 
 * Defines TypeScript types for Forum Threads and Thread Messages.
 * Threads are discussion topics within forums, and messages are replies
 * within those threads.
 * 
 * Types:
 * - ForumThread: Base thread type from database schema
 * - ThreadMessage: Base message type from database schema
 * - ForumThreadWithAuthor: Thread with author information and message count
 * - ThreadMessageWithAuthor: Message with author information
 */
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

