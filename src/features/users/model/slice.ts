import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase/client';
import { signUp, signIn, getCurrentUser, signOut as authSignOut, type AuthResponse } from '@/lib/supabase/auth';
import type { User } from '@/entities/user/model';
import type { SignupData, LoginData } from '@/lib/supabase/auth';

interface UsersState {
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  currentUser: null,
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk('users/fetchUsers', async (_, { rejectWithValue }) => {
  try {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching users:', error);
      return rejectWithValue(error.message || 'Failed to fetch users');
    }
    return (data || []) as User[];
  } catch (error: unknown) {
    console.error('Unexpected error fetching users:', error);
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch users');
  }
});

export const fetchUserById = createAsyncThunk('users/fetchUserById', async (id: string) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error) throw error;
  return data as User;
});

export const createUser = createAsyncThunk('users/createUser', async (user: { username: string; email: string; avatar_url?: string }) => {
  const { data, error } = await supabase.from('users').insert([user]).select().single();
  if (error) throw error;
  return data as User;
});

export const signUpUser = createAsyncThunk('users/signUp', async (data: SignupData): Promise<AuthResponse> => {
  return await signUp(data);
});

export const signInUser = createAsyncThunk('users/signIn', async (data: LoginData): Promise<AuthResponse> => {
  return await signIn(data);
});

export const signOutUser = createAsyncThunk('users/signOut', async () => {
  await authSignOut();
});

export const fetchCurrentUser = createAsyncThunk('users/fetchCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      // Clear any stale session data
      return rejectWithValue('No user found');
    }
    return user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch user');
  }
});

export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch users';
      })
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        const user = action.payload;
        const existingIndex = state.users.findIndex((u) => u.id === user.id);
        if (existingIndex >= 0) {
          state.users[existingIndex] = user;
        } else {
          state.users.push(user);
        }
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch user';
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.unshift(action.payload);
        state.currentUser = action.payload;
      })
      .addCase(signUpUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUpUser.fulfilled, (state, action) => {
        state.loading = false;
        // Only set current user if user exists (email verification might be required)
        if (action.payload.user) {
          state.currentUser = action.payload.user;
          const existingIndex = state.users.findIndex((u) => u.id === action.payload.user!.id);
          if (existingIndex >= 0) {
            state.users[existingIndex] = action.payload.user;
          } else {
            state.users.unshift(action.payload.user);
          }
        }
      })
      .addCase(signUpUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to sign up';
      })
      .addCase(signInUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signInUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.user) {
          state.currentUser = action.payload.user;
          const existingIndex = state.users.findIndex((u) => u.id === action.payload.user!.id);
          if (existingIndex >= 0) {
            state.users[existingIndex] = action.payload.user;
          } else {
            state.users.unshift(action.payload.user);
          }
        }
      })
      .addCase(signInUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to sign in';
      })
      .addCase(signOutUser.fulfilled, (state) => {
        state.currentUser = null;
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.currentUser = action.payload;
          const existingIndex = state.users.findIndex((u) => u.id === action.payload!.id);
          if (existingIndex >= 0) {
            state.users[existingIndex] = action.payload;
          } else {
            state.users.unshift(action.payload);
          }
        } else {
          state.currentUser = null;
        }
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.loading = false;
        state.currentUser = null;
      });
  },
});

export const { setCurrentUser, clearError } = usersSlice.actions;

