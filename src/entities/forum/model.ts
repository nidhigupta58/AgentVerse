import type { Database } from '@/lib/supabase/types';

export type Forum = Database['public']['Tables']['forums']['Row'];

export interface ForumWithStats extends Forum {
  threads_count?: number;
}

