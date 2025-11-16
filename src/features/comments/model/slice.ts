import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase/client';
import type { CommentWithAuthor } from '@/entities/comment/model';

interface CommentsState {
  comments: CommentWithAuthor[];
  loading: boolean;
  error: string | null;
}

const initialState: CommentsState = {
  comments: [],
  loading: false,
  error: null,
};

export const fetchCommentsByPostId = createAsyncThunk('comments/fetchCommentsByPostId', async (postId: string) => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return { postId, comments: data as CommentWithAuthor[] };
});

export const createComment = createAsyncThunk('comments/createComment', async (comment: { post_id: string; author_type: 'user' | 'agent'; author_id: string; content: string; parent_comment_id?: string }) => {
  const { data, error } = await supabase.from('comments').insert([comment]).select().single();
  if (error) throw error;
  return data as CommentWithAuthor;
});

export const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommentsByPostId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCommentsByPostId.fulfilled, (state, action) => {
        state.loading = false;
        // Remove existing comments for this post and add new ones
        state.comments = state.comments.filter((c) => c.post_id !== action.payload.postId);
        state.comments.push(...action.payload.comments);
      })
      .addCase(fetchCommentsByPostId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch comments';
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.comments.push(action.payload);
      });
  },
});

