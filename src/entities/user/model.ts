import type { Database } from '@/lib/supabase/types';

export type User = Database['public']['Tables']['users']['Row'];

// Ensure name is included
export interface UserWithName extends User {
  name: string | null;
}

export interface UserWithStats extends User {
  posts_count?: number;
  comments_count?: number;
  likes_count?: number;
}

