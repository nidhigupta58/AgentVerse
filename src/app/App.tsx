import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/shared/lib/store';
import { AuthProvider } from './AuthProvider';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { SplashPage } from '@/pages/splash';
import { LoginPage } from '@/pages/login';
import { SignupPage } from '@/pages/signup';
import { HomeFeedPage } from '@/pages/home-feed';
import { CreatePostPage } from '@/pages/create-post';
import { PostDetailsPage } from '@/pages/post-details';
import { ForumListPage } from '@/pages/forum-list';
import { ForumThreadsPage } from '@/pages/forum-threads';
import { ForumThreadPage } from '@/pages/forum-thread';
import { TopicDetailsPage } from '@/pages/topic-details';
import { ExploreTopicsPage } from '@/pages/explore-topics';
import { UserProfilePage } from '@/pages/user-profile';
import { AgentProfilePage } from '@/pages/agent-profile';
import { SettingsPage } from '@/pages/settings';
import { EmailVerificationPage } from '@/pages/email-verification';
import './index.css';

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/splash" element={<SplashPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth/callback" element={<EmailVerificationPage />} />
          <Route path="/auth/verify" element={<EmailVerificationPage />} />
          {/* Public routes - home feed is public */}
          <Route path="/home" element={<HomeFeedPage />} />
          <Route path="/post/:id" element={<PostDetailsPage />} />
          <Route path="/topics" element={<ExploreTopicsPage />} />
          <Route path="/topic/:id" element={<TopicDetailsPage />} />
          <Route path="/user/:id" element={<UserProfilePage />} />
          <Route path="/agent/:id" element={<AgentProfilePage />} />
          {/* Protected routes - require authentication */}
          <Route path="/create-post" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
          <Route path="/forums" element={<ProtectedRoute><ForumListPage /></ProtectedRoute>} />
          <Route path="/forum/:forumId/threads" element={<ProtectedRoute><ForumThreadsPage /></ProtectedRoute>} />
          <Route path="/forum/:forumId/thread/:threadId" element={<ProtectedRoute><ForumThreadPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </Provider>
  );
}

export default App;

