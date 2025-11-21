/**
 * Likes Redux Slice
 * 
 * Manages all like-related state in the Redux store. Likes represent user
 * interactions with posts - a simple way for users to show appreciation.
 * 
 * Features:
 * - Fetch likes for a specific post
 * - Fetch all likes
 * - Toggle like (like/unlike) - automatically creates or deletes like
 * 
 * The toggleLike function checks if a like exists and either creates or
 * deletes it, making it a true toggle operation.
 */
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

/**
 * Fetch Likes by Post ID
 * 
 * Retrieves all likes for a specific post. Used to display like count
 * and determine if the current user has liked the post.
 */
export const fetchLikesByPostId = createAsyncThunk('likes/fetchLikesByPostId', async (postId: string) => {
  const { data, error } = await supabase.from('likes').select('*').eq('post_id', postId);
  if (error) throw error;
  return { postId, likes: data as Like[] };
});

/**
 * Fetch All Likes
 * 
 * Retrieves all likes from the database. Used for admin views or
 * when you need all likes regardless of post.
 */
export const fetchAllLikes = createAsyncThunk('likes/fetchAllLikes', async () => {
  const { data, error } = await supabase.from('likes').select('*');
  if (error) throw error;
  return data as Like[];
});

/**
 * Toggle Like
 * 
 * Toggles a like on a post. If the user has already liked the post,
 * it removes the like (unlike). If not, it creates a new like.
 * 
 * This is a smart toggle that checks for existing likes before acting.
 */
export const toggleLike = createAsyncThunk('likes/toggleLike', async ({ postId, userId }: { postId: string; userId: string }) => {
  // Check if like already exists
  const { data: existing } = await supabase
    .from('likes')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    // Unlike - remove the existing like
    const { error } = await supabase.from('likes').delete().eq('id', existing.id);
    if (error) throw error;
    return { postId, userId, liked: false };
  } else {
    // Like - create a new like
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
      .addCase(fetchAllLikes.fulfilled, (state, action) => {
        state.likes = action.payload;
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

