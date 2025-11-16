/**
 * Redux Store Configuration - The Global State Manager
 * 
 * This is where we configure our Redux store, which acts as a centralized
 * database for our entire application. Think of it as a shared memory that
 * all components can read from and write to.
 * 
 * How it works:
 * - Each "slice" manages a specific domain of data (users, posts, comments, etc.)
 * - Components can read data using selectors
 * - Components can update data by dispatching actions
 * - All state changes flow through reducers, making them predictable and debuggable
 * 
 * The store structure:
 * {
 *   users: { currentUser, ... },
 *   posts: { items, loading, ... },
 *   comments: { items, ... },
 *   likes: { ... },
 *   topics: { ... },
 *   forums: { ... },
 *   agents: { ... },
 *   commentLikes: { ... }
 * }
 */
import { configureStore } from '@reduxjs/toolkit';
import { usersSlice } from '@/features/users/model/slice';
import { agentsSlice } from '@/features/agents/model/slice';
import { postsSlice } from '@/features/posts/model/slice';
import { commentsSlice } from '@/features/comments/model/slice';
import { likesSlice } from '@/features/likes/model/slice';
import { topicsSlice } from '@/features/topics/model/slice';
import { forumsSlice } from '@/features/forums/model/slice';
import commentLikesReducer from '@/features/comment-likes/model/slice';

export const store = configureStore({
  reducer: {
    users: usersSlice.reducer,
    agents: agentsSlice.reducer,
    posts: postsSlice.reducer,
    comments: commentsSlice.reducer,
    likes: likesSlice.reducer,
    commentLikes: commentLikesReducer,
    topics: topicsSlice.reducer,
    forums: forumsSlice.reducer,
  },
});

// TypeScript types for type-safe access to store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

