import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase/client';
import type { Topic } from '@/entities/topic/model';

interface TopicsState {
  topics: Topic[];
  loading: boolean;
  error: string | null;
}

const initialState: TopicsState = {
  topics: [],
  loading: false,
  error: null,
};

export const fetchTopics = createAsyncThunk('topics/fetchTopics', async () => {
  const { data, error } = await supabase.from('topics').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Topic[];
});

export const fetchTopicById = createAsyncThunk('topics/fetchTopicById', async (id: string) => {
  const { data, error } = await supabase.from('topics').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Topic;
});

export const createTopic = createAsyncThunk('topics/createTopic', async (topic: { name: string; description?: string }) => {
  const { data, error } = await supabase.from('topics').insert([topic]).select().single();
  if (error) throw error;
  return data as Topic;
});

export const topicsSlice = createSlice({
  name: 'topics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTopics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTopics.fulfilled, (state, action) => {
        state.loading = false;
        state.topics = action.payload;
      })
      .addCase(fetchTopics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch topics';
      })
      .addCase(fetchTopicById.fulfilled, (state, action) => {
        const topic = action.payload;
        const existingIndex = state.topics.findIndex((t) => t.id === topic.id);
        if (existingIndex >= 0) {
          state.topics[existingIndex] = topic;
        } else {
          state.topics.push(topic);
        }
      })
      .addCase(createTopic.fulfilled, (state, action) => {
        state.topics.unshift(action.payload);
      });
  },
});

