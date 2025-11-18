/**
 * Users Redux Slice
 * 
 * This slice manages all user-related state in the Redux store. It handles:
 * - User authentication (sign up, sign in, sign out)
 * - Fetching user data from the database
 * - Managing the current logged-in user
 * - Storing a list of users
 * 
 * The slice uses Redux Toolkit's createAsyncThunk for async operations,
 * which automatically handles loading states and errors.
 */
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

/**
 * Fetch All Users
 * 
 * Retrieves all users from the database, ordered by creation date (newest first).
 * Used for displaying user lists, search results, etc.
 */
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

/**
 * Fetch User by ID
 * 
 * Retrieves a specific user from the database by their ID.
 * Used for user profile pages and displaying user information.
 */
export const fetchUserById = createAsyncThunk('users/fetchUserById', async (id: string) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error) throw error;
  return data as User;
});

/**
 * Create New User
 * 
 * Creates a new user record in the database. Note: This is different from
 * signUpUser - this is for creating user records directly, while signUpUser
 * handles the full authentication flow.
 */
export const createUser = createAsyncThunk('users/createUser', async (user: { username: string; email: string; avatar_url?: string }) => {
  const { data, error } = await supabase.from('users').insert([user]).select().single();
  if (error) throw error;
  return data as User;
});

/**
 * Sign Up New User
 * 
 * Handles the complete signup flow: creates auth account, creates user profile,
 * and manages email verification. Wraps the signUp function from auth.ts.
 */
export const signUpUser = createAsyncThunk('users/signUp', async (data: SignupData): Promise<AuthResponse> => {
  return await signUp(data);
});

/**
 * Sign In User
 * 
 * Authenticates a user with email/username and password. Wraps the signIn
 * function from auth.ts and updates Redux state with the authenticated user.
 */
export const signInUser = createAsyncThunk('users/signIn', async (data: LoginData): Promise<AuthResponse> => {
  return await signIn(data);
});

/**
 * Sign Out User
 * 
 * Logs out the current user by calling the auth signOut function.
 * The reducer clears the currentUser from state when this completes.
 */
export const signOutUser = createAsyncThunk('users/signOut', async () => {
  await authSignOut();
});

/**
 * Fetch Current User
 * 
 * Retrieves the currently authenticated user's profile. This is called:
 * - On app initialization (by AuthProvider)
 * - After login
 * - When checking if user is still authenticated
 * 
 * Returns the user if authenticated, or rejects if no user found.
 */
export const fetchCurrentUser = createAsyncThunk('users/fetchCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return rejectWithValue('No user found');
    }
    return user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch user');
  }
});

/**
 * Update User Avatar
 * 
 * Updates the avatar_url for a specific user in the database.
 */
export const updateUserAvatar = createAsyncThunk(
  'users/updateUserAvatar',
  async ({ userId, avatarUrl }: { userId: string; avatarUrl: string }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user avatar:', error);
        return rejectWithValue(error.message || 'Failed to update avatar');
      }
      return data as User;
    } catch (error: unknown) {
      console.error('Unexpected error updating user avatar:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update avatar');
    }
  }
);

/**
 * Users Slice
 * 
 * Defines the Redux slice with:
 * - Reducers: Synchronous state updates (setCurrentUser, clearError)
 * - ExtraReducers: Handles async thunk states (pending, fulfilled, rejected)
 * 
 * The extraReducers automatically update loading and error states for each
 * async operation, and update the users array and currentUser as needed.
 */
export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    /**
     * Set Current User
     * 
     * Directly sets the current user in state. Used by AuthProvider
     * to update user state when auth events occur.
     */
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
    },
    /**
     * Clear Error
     * 
     * Removes any error message from state. Useful for clearing
     * errors when user dismisses them or retries an operation.
     */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users handlers
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
      // Fetch User By ID handlers
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        // Update existing user or add new one to the list
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
      // Create User handlers
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.unshift(action.payload);
        state.currentUser = action.payload;
      })
      // Sign Up handlers
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
      // Sign In handlers
      .addCase(signInUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signInUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.user) {
          state.currentUser = action.payload.user;
          // Update or add user to the users list
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
      // Sign Out handlers
      .addCase(signOutUser.fulfilled, (state) => {
        state.currentUser = null;
      })
      // Fetch Current User handlers
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.currentUser = action.payload;
          // Update or add user to the users list
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
      })
      // Update User Avatar handlers
      .addCase(updateUserAvatar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserAvatar.fulfilled, (state, action) => {
        state.loading = false;
        const updatedUser = action.payload;
        // Update currentUser if it's the one being updated
        if (state.currentUser?.id === updatedUser.id) {
          state.currentUser = updatedUser;
        }
        // Update user in the users array
        const existingIndex = state.users.findIndex((u) => u.id === updatedUser.id);
        if (existingIndex >= 0) {
          state.users[existingIndex] = updatedUser;
        }
      })
      .addCase(updateUserAvatar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update user avatar';
      });
  },
});

export const { setCurrentUser, clearError } = usersSlice.actions;



