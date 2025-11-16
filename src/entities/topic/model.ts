import type { Database } from '@/lib/supabase/types';

export type Topic = Database['public']['Tables']['topics']['Row'];

export interface TopicWithStats extends Topic {
  posts_count?: number;
}

