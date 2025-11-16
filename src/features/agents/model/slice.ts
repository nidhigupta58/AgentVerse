import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase/client';
import type { Agent } from '@/entities/agent/model';

interface AgentsState {
  agents: Agent[];
  loading: boolean;
  error: string | null;
}

const initialState: AgentsState = {
  agents: [],
  loading: false,
  error: null,
};

export const fetchAgents = createAsyncThunk('agents/fetchAgents', async (_, { rejectWithValue }) => {
  try {
    const { data, error } = await supabase.from('ai_agents').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching agents:', error);
      return rejectWithValue(error.message || 'Failed to fetch agents');
    }
    return (data || []) as Agent[];
  } catch (error: unknown) {
    console.error('Unexpected error fetching agents:', error);
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch agents');
  }
});

export const fetchAgentById = createAsyncThunk('agents/fetchAgentById', async (id: string) => {
  const { data, error } = await supabase.from('ai_agents').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Agent;
});

export const createAgent = createAsyncThunk('agents/createAgent', async (agent: { name: string; username?: string; persona: string; avatar_url?: string; temperature?: number; owner_id?: string; max_post_length?: number; reply_behavior?: string; max_reply_length?: number; reply_style?: string; post_frequency?: string }, { rejectWithValue }) => {
  try {
    console.log('[1] createAgent thunk started');
    console.log('[2] Creating agent with data:', agent);
    console.log('[3] Supabase client ready:', !!supabase);
    console.log('[4] Owner ID check - agent.owner_id:', agent.owner_id);
    console.log('[5] Owner ID check - type:', typeof agent.owner_id);
    console.log('[6] Owner ID check - truthy?', !!agent.owner_id);
    
    // Verify we have owner_id
    console.log('[7] Checking if owner_id exists...');
    if (!agent.owner_id) {
      console.error('[8] Missing owner_id in agent data');
      return rejectWithValue('Missing owner ID. Please make sure you are logged in.');
    }
    console.log('[9] Owner ID exists, proceeding...');
    
    // Note: We don't need to fetch session - Supabase client automatically includes
    // the session token in requests. RLS policy will verify auth.uid() = owner_id
    console.log('[10] Using existing session from Supabase client (no need to fetch)');
    console.log('[11] Calling Supabase insert...');
    console.log('[12] Owner ID in payload:', agent.owner_id);
    
    // Prepare insert data - ensure all required fields are present
    console.log('[13] Preparing insert data...');
    const insertData = {
      name: agent.name,
      username: agent.username || null,
      persona: agent.persona,
      temperature: agent.temperature ?? 0.7,
      avatar_url: agent.avatar_url || null,
      owner_id: agent.owner_id, // Must match auth.uid() for RLS
      max_post_length: agent.max_post_length ?? 500,
      reply_behavior: agent.reply_behavior || 'always',
      max_reply_length: agent.max_reply_length ?? 200,
      reply_style: agent.reply_style || 'friendly',
      post_frequency: agent.post_frequency || 'normal',
    };
    console.log('[14] Insert data prepared:', insertData);
    console.log('[15] Attempting insert...');
    console.log('[16] Insert data JSON:', JSON.stringify(insertData, null, 2));
    
    // Use standard Supabase insert with select (same pattern as other slices)
    // Supabase client automatically includes session token in the request
    console.log('[17] Calling supabase.from("ai_agents").insert()...');
    console.log('[18] About to await insert operation...');
    
    // Add timeout to detect hanging requests (but clear it if insert succeeds)
    const insertPromise = supabase
      .from('ai_agents')
      .insert([insertData])
      .select()
      .single();
    
    let timeoutId: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<{ data: null; error: { message: string; code: string } }>((resolve) => {
      timeoutId = setTimeout(() => {
        console.error('[18.5] TIMEOUT: Insert operation took longer than 15 seconds');
        resolve({ 
          data: null, 
          error: { 
            message: 'Request timeout: The insert operation took longer than 15 seconds. Please check your network connection and Supabase status.', 
            code: 'TIMEOUT' 
          } 
        });
      }, 15000); // 15 second timeout
    });
    
    console.log('[18.6] Starting Promise.race between insert and timeout...');
    const result = await Promise.race([insertPromise, timeoutPromise]);
    console.log('[18.7] Promise.race completed');
    
    // Clear timeout if insert succeeded
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    const { data, error } = result;
    console.log('[19] Insert operation completed (await finished)');
    
    console.log('[20] Supabase response received');
    console.log('[21] Has error?', !!error);
    console.log('[22] Has data?', !!data);
    
    if (error) {
      console.error('[23] Error creating agent:', error);
      
      // Handle timeout error first (our custom error)
      if (error.code === 'TIMEOUT') {
        console.log('[23.5] Timeout error detected');
        return rejectWithValue(error.message);
      }
      
      // It's a PostgrestError - cast and log full details
      const pgError = error as { code?: string; message?: string; details?: string; hint?: string };
      console.error('[24] Error code:', pgError.code);
      console.error('[25] Error message:', pgError.message);
      console.error('[26] Error details:', pgError.details);
      console.error('[27] Error hint:', pgError.hint);
      
      // Handle username uniqueness error specifically
      console.log('[28] Checking error code...');
      if (pgError.code === '23505') {
        console.log('[29] Username uniqueness error detected');
        if (pgError.message?.includes('username') || pgError.details?.includes('username')) {
          console.log('[30] Returning username exists error');
          return rejectWithValue('Username already exists. Please choose a different username.');
        }
        console.log('[31] Returning generic uniqueness error');
        return rejectWithValue('A record with this information already exists.');
      }
      
      // Handle RLS policy errors
      console.log('[32] Checking for RLS policy errors...');
      if (pgError.code === '42501' || pgError.message?.includes('permission') || pgError.message?.includes('policy')) {
        console.error('[33] RLS Policy Error - owner_id must match auth.uid()');
        console.error('[34] Owner ID in payload:', agent.owner_id);
        return rejectWithValue('Permission denied. Please make sure you are logged in and have permission to create agents.');
      }
      
      console.log('[35] Returning generic error');
      return rejectWithValue(pgError.message || pgError.details || 'Failed to create agent');
    }
    
    console.log('[36] No error, checking if data exists...');
    if (!data) {
      console.error('[37] No data returned from insert');
      return rejectWithValue('No data returned from server');
    }
    
    console.log('[38] Agent created successfully:', data);
    console.log('[39] Returning agent data');
    return data as Agent;
  } catch (error: unknown) {
    console.error('[40] Unexpected error in catch block:', error);
    console.error('[41] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    
    if (error instanceof Error) {
      console.log('[42] Returning error message');
      return rejectWithValue(error.message);
    }
    
    console.log('[43] Returning generic failure message');
    return rejectWithValue('Failed to create agent');
  }
});

export const updateAgent = createAsyncThunk('agents/updateAgent', async ({ id, updates }: { id: string; updates: Partial<{ name: string; username: string; persona: string; avatar_url: string; temperature: number; max_post_length: number; reply_behavior: string; max_reply_length: number; reply_style: string; post_frequency: string }> }, { rejectWithValue }) => {
  try {
    console.log('Updating agent:', id, 'with updates:', updates);
    const { data, error } = await supabase.from('ai_agents').update(updates).eq('id', id).select().single();
    if (error) {
      console.error('Error updating agent:', error);
      return rejectWithValue(error.message || 'Failed to update agent');
    }
    console.log('Agent updated successfully:', data);
    return data as Agent;
  } catch (error: unknown) {
    console.error('Unexpected error updating agent:', error);
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to update agent');
  }
});

export const agentsSlice = createSlice({
  name: 'agents',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAgents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgents.fulfilled, (state, action) => {
        state.loading = false;
        state.agents = action.payload;
      })
      .addCase(fetchAgents.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : action.error.message || 'Failed to fetch agents';
        state.agents = [];
      })
      .addCase(fetchAgentById.fulfilled, (state, action) => {
        const agent = action.payload;
        const existingIndex = state.agents.findIndex((a) => a.id === agent.id);
        if (existingIndex >= 0) {
          state.agents[existingIndex] = agent;
        } else {
          state.agents.push(agent);
        }
      })
      .addCase(createAgent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAgent.fulfilled, (state, action) => {
        state.loading = false;
        state.agents.unshift(action.payload);
      })
      .addCase(createAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : action.error.message || 'Failed to create agent';
      })
      .addCase(updateAgent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAgent.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.agents.findIndex((a) => a.id === action.payload.id);
        if (index >= 0) {
          state.agents[index] = action.payload;
        }
      })
      .addCase(updateAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : action.error.message || 'Failed to update agent';
      });
  },
});

