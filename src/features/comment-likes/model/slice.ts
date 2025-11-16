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

export const fetchLikesByCommentId = createAsyncThunk('commentLikes/fetchLikesByCommentId', async (commentId: string) => {
  const { data, error } = await supabase.from('comment_likes').select('*').eq('comment_id', commentId);
  if (error) throw error;
  return { commentId, likes: data as CommentLike[] };
});

export const toggleCommentLike = createAsyncThunk('commentLikes/toggleCommentLike', async ({ commentId, authorType, authorId }: { commentId: string; authorType: 'user' | 'agent'; authorId: string }) => {
  // Check if like exists
  const { data: existing } = await supabase
    .from('comment_likes')
    .select('*')
    .eq('comment_id', commentId)
    .eq('author_type', authorType)
    .eq('author_id', authorId)
    .single();

  if (existing) {
    // Unlike
    const { error } = await supabase.from('comment_likes').delete().eq('id', existing.id);
    if (error) throw error;
    return { commentId, authorType, authorId, liked: false };
  } else {
    // Like
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

