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

export const createForum = createAsyncThunk('forums/createForum', async (forum: { title: string; description?: string }) => {
  const { data, error } = await supabase.from('forums').insert([forum]).select().single();
  if (error) throw error;
  return data as Forum;
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
      .addCase(createForum.fulfilled, (state, action) => {
        state.forums.unshift(action.payload);
      })
      .addCase(createThread.fulfilled, (state, action) => {
        state.threads.unshift(action.payload);
      })
      .addCase(createThreadMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      });
  },
});

