/**
 * Supabase Database Type Definitions
 * 
 * This file contains TypeScript type definitions that match the Supabase database schema.
 * These types ensure type safety when querying the database - TypeScript will catch
 * errors if you try to access fields that don't exist or use wrong data types.
 * 
 * Structure:
 * - Each table has three type variants:
 *   - Row: The shape of data when reading from the database
 *   - Insert: The shape of data when inserting (some fields optional, some required)
 *   - Update: The shape of data when updating (all fields optional)
 * 
 * Tables Defined:
 * - users: User accounts and profiles
 * - ai_agents: AI agent configurations and personas
 * - topics: Topic tags/categories for posts
 * - posts: Main content posts (can be by users or agents)
 * - comments: Replies to posts (can be by users or agents)
 * - likes: User likes on posts
 * - forums: Discussion forum categories
 * - forum_threads: Discussion threads within forums
 * - thread_messages: Messages within forum threads
 * 
 * These types are used throughout the application to ensure type safety when
 * working with database data. They're imported in entity model files and
 * used in Redux slices and components.
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string | null;
          username: string;
          email: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          username: string;
          email: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          username?: string;
          email?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      ai_agents: {
        Row: {
          id: string;
          name: string;
          username: string | null;
          persona: string;
          avatar_url: string | null;
          temperature: number;
          owner_id: string | null;
          max_post_length: number | null;
          reply_behavior: string | null;
          max_reply_length: number | null;
          reply_style: string | null;
          post_frequency: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          username?: string | null;
          persona: string;
          avatar_url?: string | null;
          temperature?: number;
          owner_id?: string | null;
          max_post_length?: number | null;
          reply_behavior?: string | null;
          max_reply_length?: number | null;
          reply_style?: string | null;
          post_frequency?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          username?: string | null;
          persona?: string;
          avatar_url?: string | null;
          temperature?: number;
          owner_id?: string | null;
          max_post_length?: number | null;
          reply_behavior?: string | null;
          max_reply_length?: number | null;
          reply_style?: string | null;
          post_frequency?: string | null;
          created_at?: string;
        };
      };
      topics: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          author_type: 'user' | 'agent';
          author_id: string;
          topic_id: string | null;
          content: string;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          author_type: 'user' | 'agent';
          author_id: string;
          topic_id?: string | null;
          content: string;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          author_type?: 'user' | 'agent';
          author_id?: string;
          topic_id?: string | null;
          content?: string;
          image_url?: string | null;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_type: 'user' | 'agent';
          author_id: string;
          content: string;
          parent_comment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_type: 'user' | 'agent';
          author_id: string;
          content: string;
          parent_comment_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_type?: 'user' | 'agent';
          author_id?: string;
          content?: string;
          parent_comment_id?: string | null;
          created_at?: string;
        };
      };
      likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      forums: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      forum_threads: {
        Row: {
          id: string;
          forum_id: string;
          author_type: 'user' | 'agent';
          author_id: string;
          title: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          forum_id: string;
          author_type: 'user' | 'agent';
          author_id: string;
          title: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          forum_id?: string;
          author_type?: 'user' | 'agent';
          author_id?: string;
          title?: string;
          created_at?: string;
        };
      };
      thread_messages: {
        Row: {
          id: string;
          thread_id: string;
          author_type: 'user' | 'agent';
          author_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          author_type: 'user' | 'agent';
          author_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          author_type?: 'user' | 'agent';
          author_id?: string;
          content?: string;
          created_at?: string;
        };
      };
    };
  };
}

