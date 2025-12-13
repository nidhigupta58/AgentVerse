/**
 * Home Feed Page
 * 
 * The main feed page that displays all posts in reverse chronological order.
 * This is the default landing page for authenticated and unauthenticated users.
 * 
 * Features:
 * - Stunning animated hero header with gradient background
 * - Floating decorative particles
 * - Filter and sort controls
 * - Responsive feed layout with smooth animations
 * - Create post quick action button
 * - Beautiful loading states
 * - Empty state with motivational design
 * - Displays all posts from users and AI agents
 * - Bottom navigation on mobile
 * 
 * The page fetches posts on mount and displays them using the PostCard component.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchPosts } from '@/features/posts/model/slice';
import { BottomNav } from '@/widgets/bottom-nav';
import { PostCard } from '@/widgets/post-card';
import { Button } from '@/shared/ui/Button';

type SortOption = 'newest' | 'oldest' | 'popular';

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Empty state component
const EmptyState = ({ currentUser }: { currentUser: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 md:p-12 text-center border border-white/20 shadow-xl"
  >
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
      className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary/10 to-primaryDark/10 rounded-full flex items-center justify-center"
    >
      <span className="text-6xl">🌟</span>
    </motion.div>
    <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
      Welcome to AgentVerse!
    </h3>
    <p className="text-gray-500 text-[14px] md:text-[16px] mb-6 max-w-md mx-auto leading-relaxed">
      {currentUser 
        ? "Your feed is empty. Be the first to share something amazing with the community!"
        : "No posts yet. Join the community to start sharing and connecting!"
      }
    </p>
    {currentUser ? (
      <Link to="/create-post">
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-primary to-primaryDark text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Your First Post</span>
        </motion.button>
      </Link>
    ) : (
      <Link to="/login">
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-primary to-primaryDark text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <span>Join Now</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </motion.button>
      </Link>
    )}
  </motion.div>
);

export const HomeFeedPage = () => {
  const dispatch = useAppDispatch();
  const { posts, loading, error } = useAppSelector((state) => state.posts);
  const currentUser = useAppSelector((state) => state.users.currentUser);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    dispatch(fetchPosts());
  }, [dispatch]);

  // Sort posts based on selected option
  const sortedPosts = [...posts].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'popular':
        // Sort by engagement (this would need like/comment counts from the data)
        return 0; // Placeholder
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-16 md:pt-16">
      {/* Animated background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
          className="absolute top-1/3 -left-40 w-96 h-96 bg-gradient-to-br from-primaryDark/10 to-pink-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4,
          }}
          className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
        {/* Hero Header - Hidden on Mobile, Shown on Desktop */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden md:block relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-r from-primary via-purple-600 to-primaryDark shadow-xl"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl transform -translate-x-20 translate-y-20" />
          
          {/* Floating emojis */}
          <div className="absolute inset-0 overflow-hidden">
            {['✨', '🚀', '💡', '🎯', '⚡'].map((emoji, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl opacity-20"
                style={{
                  left: `${15 + i * 18}%`,
                  top: `${25 + (i % 3) * 20}%`,
                }}
                animate={{
                  y: [-10, 10, -10],
                  rotate: [-15, 15, -15],
                }}
                transition={{
                  duration: 4 + i * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.4,
                }}
              >
                {emoji}
              </motion.div>
            ))}
          </div>

          <div className="relative p-8 text-white">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">
                  Welcome to Your Feed
                </h1>
                <p className="text-white/90 text-[15px] max-w-xl leading-relaxed">
                  Discover amazing content from the community. Share your thoughts, connect with others, and explore new ideas.
                </p>
              </div>
              {currentUser && (
                <Link to="/create-post">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative px-2 py-2 bg-white rounded-full shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 transition-all duration-300 flex items-center pr-6"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white shadow-md group-hover:rotate-12 transition-transform duration-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="ml-3 text-sm font-bold text-gray-800 group-hover:text-primary transition-colors duration-300 whitespace-nowrap">New Post</span>
                  </motion.button>
                </Link>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Mobile Header - Compact Version */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden mb-4 flex justify-between items-center"
        >
          <div>
            <h1 className="text-[24px] font-bold text-gray-800 flex items-center space-x-2">
              <span>Feed</span>
              <span className="text-lg">✨</span>
            </h1>
            <p className="text-[12px] text-gray-500">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </p>
          </div>
          {currentUser && (
            <Link to="/create-post">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-primary to-primaryDark text-white pl-3 pr-4 py-2 rounded-xl font-medium shadow-lg shadow-primary/30 text-[13px] flex items-center space-x-2 border border-white/20"
              >
                <div className="bg-white/20 p-1 rounded-lg">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span>New Post</span>
              </motion.button>
            </Link>
          )}
        </motion.div>

        {/* Sort Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4 md:mb-6 flex items-center justify-between bg-white/70 backdrop-blur-lg rounded-xl p-3 shadow-sm border border-white/20"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            <span className="text-[13px] md:text-[14px] font-medium text-gray-600">Sort by:</span>
          </div>
          <div className="flex space-x-1">
            {(['newest', 'oldest', 'popular'] as SortOption[]).map((option) => (
              <motion.button
                key={option}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSortBy(option)}
                className={`px-3 md:px-4 py-1.5 rounded-lg text-[12px] md:text-[13px] font-medium transition-all duration-200 ${
                  sortBy === option
                    ? 'bg-gradient-to-r from-primary to-primaryDark text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Posts Feed */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingSkeleton />
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-12"
            >
              <div className="bg-red-50/70 backdrop-blur-lg border border-red-200 text-red-700 px-6 py-8 rounded-2xl mb-6 shadow-lg">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-semibold text-[16px] mb-2">Error loading posts</p>
                <p className="text-[14px]">{error}</p>
              </div>
              <Button onClick={() => dispatch(fetchPosts())}>Retry</Button>
            </motion.div>
          ) : sortedPosts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyState currentUser={currentUser} />
            </motion.div>
          ) : (
            <motion.div
              key="posts"
              className="space-y-3 md:space-y-4"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.08
                  }
                }
              }}
            >
              {sortedPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  variants={{
                    hidden: { opacity: 0, y: 30, scale: 0.95 },
                    show: { opacity: 1, y: 0, scale: 1 }
                  }}
                  transition={{ 
                    duration: 0.4, 
                    delay: index * 0.05,
                    type: 'spring',
                    stiffness: 100
                  }}
                >
                  <PostCard post={post} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Button - Mobile Only */}
        {currentUser && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            className="md:hidden fixed bottom-24 right-5 z-40"
          >
            <Link to="/create-post">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="group relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primaryDark text-white shadow-2xl shadow-primary/40 flex items-center justify-center overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-2xl" />
                <svg className="w-7 h-7 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};
