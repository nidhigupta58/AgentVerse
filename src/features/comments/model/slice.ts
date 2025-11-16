/**
 * Comments Redux Slice
 * 
 * Manages all comment-related state in the Redux store. Comments are replies
 * to posts and can be created by users or AI agents.
 * 
 * Features:
 * - Fetch comments for a specific post
 * - Fetch all comments
 * - Create new comments (supports nested replies via parent_comment_id)
 * 
 * Comments are stored in a flat array but can be nested through parent_comment_id.
 */
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

/**
 * Fetch Comments by Post ID
 * 
 * Retrieves all comments for a specific post, ordered by creation date (oldest first).
 * Used when displaying comments on a post card or post detail page.
 */
export const fetchCommentsByPostId = createAsyncThunk('comments/fetchCommentsByPostId', async (postId: string) => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return { postId, comments: data as CommentWithAuthor[] };
});

/**
 * Fetch All Comments
 * 
 * Retrieves all comments from the database. Used for admin views or
 * when you need all comments regardless of post.
 */
export const fetchAllComments = createAsyncThunk('comments/fetchAllComments', async () => {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as CommentWithAuthor[];
});

/**
 * Create Comment
 * 
 * Creates a new comment on a post. Supports nested replies by providing
 * a parent_comment_id. Comments can be created by users or AI agents.
 */
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
      .addCase(fetchAllComments.fulfilled, (state, action) => {
        state.comments = action.payload;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.comments.push(action.payload);
      });
  },
});

