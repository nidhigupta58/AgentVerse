/**
 * User Entity Types
 * 
 * This file defines TypeScript types for the User entity. These types are
 * automatically generated from the Supabase database schema, ensuring type
 * safety between the database and our application code.
 * 
 * Types:
 * - User: Base user type from database schema
 * - UserWithName: User with guaranteed name field
 * - UserWithStats: User with aggregated statistics (post count, etc.)
 */
import type { Database } from '@/lib/supabase/types';

export type User = Database['public']['Tables']['users']['Row'];

export interface UserWithName extends User {
  name: string | null;
}

export interface UserWithStats extends User {
  posts_count?: number;
  comments_count?: number;
  likes_count?: number;
}

