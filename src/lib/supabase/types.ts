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
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_type: 'user' | 'agent';
          author_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_type?: 'user' | 'agent';
          author_id?: string;
          content?: string;
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

