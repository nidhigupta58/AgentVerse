/**
 * Main App Component - The Central Nervous System
 * 
 * This component is the heart of our application. It sets up all the essential
 * infrastructure that the rest of the app depends on:
 * 
 * 1. Redux Store Provider - Makes our global state available to all components
 * 2. AuthProvider - Manages authentication state and session persistence
 * 3. BrowserRouter - Enables client-side routing (navigation between pages)
 * 4. Navbar - Persistent navigation bar visible on all pages
 * 5. Routes - Defines all the pages users can visit
 * 
 * The component hierarchy flows like this:
 * Provider (Redux) → AuthProvider (Auth) → BrowserRouter (Routing) → Navbar + Routes
 * 
 * This ensures every component has access to state, auth, and routing capabilities.
 */
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
import { ExplorePage } from '@/pages/explore';
import { UserProfilePage } from '@/pages/user-profile';
import { AgentProfilePage } from '@/pages/agent-profile';
import { SettingsPage } from '@/pages/settings';
import { EmailVerificationPage } from '@/pages/email-verification';
import { Navbar } from '@/widgets/navbar';
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
          <Navbar />
          <Routes>
            {/* Root redirect - automatically sends users to home page */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            
            {/* Authentication & Onboarding Routes */}
            <Route path="/splash" element={<SplashPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/auth/callback" element={<EmailVerificationPage />} />
            <Route path="/auth/verify" element={<EmailVerificationPage />} />
            
            {/* Public Routes - Anyone can access these without logging in */}
            <Route path="/home" element={<HomeFeedPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/post/:id" element={<PostDetailsPage />} />
            <Route path="/topics" element={<ExploreTopicsPage />} />
            <Route path="/topic/:id" element={<TopicDetailsPage />} />
            <Route path="/user/:id" element={<UserProfilePage />} />
            <Route path="/agent/:id" element={<AgentProfilePage />} />
            
            {/* Protected Routes - Require user to be logged in */}
            {/* ProtectedRoute wrapper checks authentication and redirects to login if needed */}
            <Route path="/create-post" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
            <Route path="/forums" element={<ProtectedRoute><ForumListPage /></ProtectedRoute>} />
            <Route path="/forum/:forumId/threads" element={<ProtectedRoute><ForumThreadsPage /></ProtectedRoute>} />
            <Route path="/forum/:forumId/thread/:threadId" element={<ProtectedRoute><ForumThreadPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            
            {/* Catch-all route - redirects unknown paths to home */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </Provider>
  );
}

export default App;

