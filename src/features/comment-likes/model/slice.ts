/**
 * Comment Likes Redux Slice
 * 
 * Manages all comment-like-related state in the Redux store. Comment likes are
 * similar to post likes but apply to comments instead.
 * 
 * Features:
 * - Fetch likes for a specific comment
 * - Toggle comment like (like/unlike) - automatically creates or deletes like
 * 
 * Comment likes can be created by both users and AI agents, unlike post likes
 * which are user-only. The toggleLike function checks if a like exists and either
 * creates or deletes it, making it a true toggle operation.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase/client';

interface CommentLike {
  id: string;
  comment_id: string;
  author_type: 'user' | 'agent';
  author_id: string;
  created_at: string;
}

interface CommentLikesState {
  commentLikes: CommentLike[];
  loading: boolean;
  error: string | null;
}

const initialState: CommentLikesState = {
  commentLikes: [],
  loading: false,
  error: null,
};

/**
 * Fetch Likes by Comment ID
 * 
 * Retrieves all likes for a specific comment. Used to display like count
 * and determine if the current user/agent has liked the comment.
 */
export const fetchLikesByCommentId = createAsyncThunk('commentLikes/fetchLikesByCommentId', async (commentId: string) => {
  const { data, error } = await supabase.from('comment_likes').select('*').eq('comment_id', commentId);
  if (error) throw error;
  return { commentId, likes: data as CommentLike[] };
});

/**
 * Toggle Comment Like
 * 
 * Toggles a like on a comment. If the user/agent has already liked the comment,
 * it removes the like (unlike). If not, it creates a new like.
 * 
 * This is a smart toggle that checks for existing likes before acting.
 * Unlike post likes, comment likes can be created by both users and agents.
 */
export const toggleCommentLike = createAsyncThunk('commentLikes/toggleCommentLike', async ({ commentId, authorType, authorId }: { commentId: string; authorType: 'user' | 'agent'; authorId: string }) => {
  // Check if like already exists
  const { data: existing } = await supabase
    .from('comment_likes')
    .select('*')
    .eq('comment_id', commentId)
    .eq('author_type', authorType)
    .eq('author_id', authorId)
    .single();

  if (existing) {
    // Unlike - remove the existing like
    const { error } = await supabase.from('comment_likes').delete().eq('id', existing.id);
    if (error) throw error;
    return { commentId, authorType, authorId, liked: false };
  } else {
    // Like - create a new like
    const { data, error } = await supabase
      .from('comment_likes')
      .insert([{ comment_id: commentId, author_type: authorType, author_id: authorId }])
      .select()
      .single();
    if (error) throw error;
    return { commentId, authorType, authorId, liked: true, like: data as CommentLike };
  }
});

export const commentLikesSlice = createSlice({
  name: 'commentLikes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLikesByCommentId.fulfilled, (state, action) => {
        // Remove existing likes for this comment and add new ones
        state.commentLikes = state.commentLikes.filter((l) => l.comment_id !== action.payload.commentId);
        state.commentLikes.push(...action.payload.likes);
      })
      .addCase(toggleCommentLike.fulfilled, (state, action) => {
        if (action.payload.liked && action.payload.like) {
          state.commentLikes.push(action.payload.like);
        } else {
          state.commentLikes = state.commentLikes.filter(
            (l) => !(l.comment_id === action.payload.commentId && l.author_id === action.payload.authorId && l.author_type === action.payload.authorType)
          );
        }
      });
  },
});

export default commentLikesSlice.reducer;

