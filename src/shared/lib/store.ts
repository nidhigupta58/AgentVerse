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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

