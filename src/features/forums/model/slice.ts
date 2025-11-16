/**
 * Forums Redux Slice
 * 
 * Manages all forum-related state in the Redux store. Forums are discussion
 * categories that contain threads, which in turn contain messages.
 * 
 * Features:
 * - Fetch all forums
 * - Fetch threads for a forum
 * - Fetch messages for a thread
 * - Create forums, threads, and messages
 * 
 * Structure:
 * - Forums contain Threads
 * - Threads contain Messages
 * - All three are stored in separate arrays in state
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase/client';
import type { Forum } from '@/entities/forum/model';
import type { ForumThreadWithAuthor, ThreadMessageWithAuthor } from '@/entities/thread/model';

interface ForumsState {
  forums: Forum[];
  threads: ForumThreadWithAuthor[];
  messages: ThreadMessageWithAuthor[];
  loading: boolean;
  error: string | null;
}

const initialState: ForumsState = {
  forums: [],
  threads: [],
  messages: [],
  loading: false,
  error: null,
};

/**
 * Fetch All Forums
 * 
 * Retrieves all forums from the database, ordered by creation date (newest first).
 * Used for displaying the forum list page.
 */
export const fetchForums = createAsyncThunk('forums/fetchForums', async () => {
  const { data, error } = await supabase.from('forums').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Forum[];
});

export const fetchThreadsByForumId = createAsyncThunk('forums/fetchThreadsByForumId', async (forumId: string) => {
  const { data, error } = await supabase
    .from('forum_threads')
    .select('*')
    .eq('forum_id', forumId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return { forumId, threads: data as ForumThreadWithAuthor[] };
});

export const fetchMessagesByThreadId = createAsyncThunk('forums/fetchMessagesByThreadId', async (threadId: string) => {
  const { data, error } = await supabase
    .from('thread_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return { threadId, messages: data as ThreadMessageWithAuthor[] };
});

export const createForum = createAsyncThunk('forums/createForum', async (forum: { title: string; description?: string }, { rejectWithValue }) => {
  try {
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return rejectWithValue('You must be logged in to create a forum.');
    }
    
    // Build insert data
    const insertData: { title: string; description?: string | null; owner_id?: string } = {
      title: forum.title.trim(),
      owner_id: session.user.id, // Set owner to current user
    };
    
    // Handle description: if provided and not empty after trim, use it; otherwise set to null
    if (forum.description !== undefined) {
      const trimmed = forum.description.trim();
      insertData.description = trimmed || null;
    } else {
      insertData.description = null;
    }
    
    const { data, error } = await supabase.from('forums').insert([insertData]).select().single();
    if (error) {
      console.error('Error creating forum:', error);
      console.error('Insert data:', insertData);
      return rejectWithValue(error.message || 'Failed to create forum');
    }
    return data as Forum;
  } catch (error: unknown) {
    console.error('Unexpected error creating forum:', error);
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to create forum');
  }
});

export const createThread = createAsyncThunk('forums/createThread', async (thread: { forum_id: string; author_type: 'user' | 'agent'; author_id: string; title: string }) => {
  const { data, error } = await supabase.from('forum_threads').insert([thread]).select().single();
  if (error) throw error;
  return data as ForumThreadWithAuthor;
});

export const createThreadMessage = createAsyncThunk('forums/createThreadMessage', async (message: { thread_id: string; author_type: 'user' | 'agent'; author_id: string; content: string }) => {
  const { data, error } = await supabase.from('thread_messages').insert([message]).select().single();
  if (error) throw error;
  return data as ThreadMessageWithAuthor;
});

export const updateForum = createAsyncThunk('forums/updateForum', async (forum: { id: string; title?: string; description?: string | null }, { rejectWithValue }) => {
  try {
    // Check session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return rejectWithValue('Authentication error. Please log in again.');
    }
    
    if (!session) {
      console.error('No session found');
      return rejectWithValue('You must be logged in to update a forum.');
    }
    
    console.log('Session exists, user ID:', session.user.id);
    
    const updateData: { title?: string; description?: string | null } = {};
    
    if (forum.title !== undefined) {
      updateData.title = forum.title.trim();
    }
    
    if (forum.description !== undefined) {
      updateData.description = forum.description?.trim() || null;
    }
    
    console.log('Updating forum:', forum.id, 'with data:', updateData);
    
    const { data, error } = await supabase
      .from('forums')
      .update(updateData)
      .eq('id', forum.id)
      .select();
    
    if (error) {
      console.error('Error updating forum:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      // Handle RLS policy errors
      if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy') || error.message?.includes('RLS')) {
        return rejectWithValue('Permission denied. You may not have permission to update this forum.');
      }
      
      return rejectWithValue(error.message || 'Failed to update forum');
    }
    
    if (!data || data.length === 0) {
      console.error('No data returned from update. Forum ID:', forum.id);
      console.error('This usually means the RLS policy blocked the update or the forum does not exist.');
      return rejectWithValue('Update failed. The forum may not exist or you may not have permission to update it. Please check the RLS policy in Supabase.');
    }
    
    console.log('Forum updated successfully:', data[0]);
    return data[0] as Forum;
  } catch (error: unknown) {
    console.error('Unexpected error updating forum:', error);
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to update forum');
  }
});

export const forumsSlice = createSlice({
  name: 'forums',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchForums.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchForums.fulfilled, (state, action) => {
        state.loading = false;
        state.forums = action.payload;
      })
      .addCase(fetchForums.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch forums';
      })
      .addCase(fetchThreadsByForumId.fulfilled, (state, action) => {
        state.threads = state.threads.filter((t) => t.forum_id !== action.payload.forumId);
        state.threads.push(...action.payload.threads);
      })
      .addCase(fetchMessagesByThreadId.fulfilled, (state, action) => {
        state.messages = state.messages.filter((m) => m.thread_id !== action.payload.threadId);
        state.messages.push(...action.payload.messages);
      })
      .addCase(createForum.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createForum.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.forums.unshift(action.payload);
      })
      .addCase(createForum.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : action.error.message || 'Failed to create forum';
      })
      .addCase(createThread.fulfilled, (state, action) => {
        state.threads.unshift(action.payload);
      })
      .addCase(createThreadMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      })
      .addCase(updateForum.fulfilled, (state, action) => {
        const index = state.forums.findIndex((f) => f.id === action.payload.id);
        if (index >= 0) {
          state.forums[index] = action.payload;
        }
      });
  },
});

