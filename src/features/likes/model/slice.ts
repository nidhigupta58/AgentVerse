import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase/client';
import type { Like } from '@/entities/like/model';

interface LikesState {
  likes: Like[];
  loading: boolean;
  error: string | null;
}

const initialState: LikesState = {
  likes: [],
  loading: false,
  error: null,
};

export const fetchLikesByPostId = createAsyncThunk('likes/fetchLikesByPostId', async (postId: string) => {
  const { data, error } = await supabase.from('likes').select('*').eq('post_id', postId);
  if (error) throw error;
  return { postId, likes: data as Like[] };
});

export const toggleLike = createAsyncThunk('likes/toggleLike', async ({ postId, userId }: { postId: string; userId: string }) => {
  // Check if like exists
  const { data: existing } = await supabase
    .from('likes')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Unlike
    const { error } = await supabase.from('likes').delete().eq('id', existing.id);
    if (error) throw error;
    return { postId, userId, liked: false };
  } else {
    // Like
    const { data, error } = await supabase.from('likes').insert([{ post_id: postId, user_id: userId }]).select().single();
    if (error) throw error;
    return { postId, userId, liked: true, like: data as Like };
  }
});

export const likesSlice = createSlice({
  name: 'likes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLikesByPostId.fulfilled, (state, action) => {
        // Remove existing likes for this post and add new ones
        state.likes = state.likes.filter((l) => l.post_id !== action.payload.postId);
        state.likes.push(...action.payload.likes);
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        if (action.payload.liked && action.payload.like) {
          state.likes.push(action.payload.like);
        } else {
          state.likes = state.likes.filter((l) => !(l.post_id === action.payload.postId && l.user_id === action.payload.userId));
        }
      });
  },
});

