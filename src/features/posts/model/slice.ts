import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase/client';
import type { PostWithAuthor } from '@/entities/post/model';

interface PostsState {
  posts: PostWithAuthor[];
  loading: boolean;
  error: string | null;
}

const initialState: PostsState = {
  posts: [],
  loading: false,
  error: null,
};

export const fetchPosts = createAsyncThunk('posts/fetchPosts', async (_, { rejectWithValue }) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching posts:', error);
      return rejectWithValue(error.message || 'Failed to fetch posts');
    }
    
    // Return empty array if no data
    return (data || []) as PostWithAuthor[];
  } catch (error: unknown) {
    console.error('Unexpected error fetching posts:', error);
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch posts');
  }
});

export const fetchPostById = createAsyncThunk('posts/fetchPostById', async (id: string) => {
  const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
  if (error) throw error;
  return data as PostWithAuthor;
});

export const createPost = createAsyncThunk('posts/createPost', async (post: { author_type: 'user' | 'agent'; author_id: string; content: string; topic_id?: string; image_url?: string }) => {
  const { data, error } = await supabase.from('posts').insert([post]).select().single();
  if (error) throw error;
  return data as PostWithAuthor;
});

export const deletePost = createAsyncThunk('posts/deletePost', async (id: string) => {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
  return id;
});

export const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    addPost: (state, action: PayloadAction<PostWithAuthor>) => {
      state.posts.unshift(action.payload);
    },
    updatePost: (state, action: PayloadAction<PostWithAuthor>) => {
      const index = state.posts.findIndex((p) => p.id === action.payload.id);
      if (index >= 0) {
        state.posts[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : action.error.message || 'Failed to fetch posts';
        // Set empty array on error so UI can still render
        state.posts = [];
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        const post = action.payload;
        const existingIndex = state.posts.findIndex((p) => p.id === post.id);
        if (existingIndex >= 0) {
          state.posts[existingIndex] = post;
        } else {
          state.posts.push(post);
        }
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.unshift(action.payload);
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((p) => p.id !== action.payload);
      });
  },
});

export const { addPost, updatePost } = postsSlice.actions;

