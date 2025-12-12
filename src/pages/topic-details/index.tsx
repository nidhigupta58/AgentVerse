/**
 * Topic Details Page
 * 
 * Displays a specific topic with all posts associated with it.
 * 
 * Features:
 * - Beautiful glassmorphic hero header with topic information
 * - Animated gradient background
 * - Topic statistics (post count, creation date)
 * - List of all posts tagged with this topic
 * - Back link to topics list
 * - Smooth loading animation
 * - Empty state with helpful message
 * 
 * The page fetches:
 * - Topic data by ID
 * - All posts (to filter by topic_id)
 * 
 * Posts are displayed using the PostCard component, showing full
 * interaction capabilities (likes, comments, etc.).
 * 
 * This is a public page - anyone can view topics and their posts.
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchTopicById } from '@/features/topics/model/slice';
import { fetchPosts } from '@/features/posts/model/slice';
import { BottomNav } from '@/widgets/bottom-nav';
import { PostCard } from '@/widgets/post-card';
import { formatDate } from '@/shared/lib/utils';

// Topic icons based on common topic names
const getTopicIcon = (topicName: string): string => {
  const name = topicName.toLowerCase();
  if (name.includes('tech') || name.includes('code') || name.includes('programming')) return '💻';
  if (name.includes('ai') || name.includes('artificial') || name.includes('machine')) return '🤖';
  if (name.includes('design') || name.includes('art') || name.includes('creative')) return '🎨';
  if (name.includes('science') || name.includes('research')) return '🔬';
  if (name.includes('business') || name.includes('startup') || name.includes('entrepreneur')) return '💼';
  if (name.includes('music') || name.includes('audio')) return '🎵';
  if (name.includes('game') || name.includes('gaming')) return '🎮';
  if (name.includes('health') || name.includes('fitness') || name.includes('wellness')) return '💪';
  if (name.includes('food') || name.includes('cook') || name.includes('recipe')) return '🍳';
  if (name.includes('travel') || name.includes('adventure')) return '✈️';
  if (name.includes('news') || name.includes('current')) return '📰';
  if (name.includes('education') || name.includes('learn')) return '📚';
  if (name.includes('photo') || name.includes('camera')) return '📷';
  if (name.includes('movie') || name.includes('film') || name.includes('cinema')) return '🎬';
  if (name.includes('sport')) return '⚽';
  if (name.includes('nature') || name.includes('environment')) return '🌿';
  return '💬'; // Default icon
};

// Generate gradient colors based on topic name
const getGradientColors = (topicName: string): [string, string] => {
  const name = topicName.toLowerCase();
  if (name.includes('tech') || name.includes('code')) return ['from-blue-600', 'to-cyan-500'];
  if (name.includes('ai') || name.includes('artificial')) return ['from-purple-600', 'to-pink-500'];
  if (name.includes('design') || name.includes('art')) return ['from-pink-500', 'to-orange-400'];
  if (name.includes('science')) return ['from-emerald-500', 'to-teal-400'];
  if (name.includes('business')) return ['from-slate-700', 'to-slate-500'];
  if (name.includes('music')) return ['from-violet-600', 'to-indigo-500'];
  if (name.includes('game')) return ['from-red-500', 'to-orange-500'];
  if (name.includes('health')) return ['from-green-500', 'to-lime-400'];
  if (name.includes('food')) return ['from-amber-500', 'to-yellow-400'];
  if (name.includes('travel')) return ['from-sky-500', 'to-blue-400'];
  return ['from-primary', 'to-primaryDark']; // Default gradient
};

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="animate-pulse">
    {/* Hero skeleton */}
    <div className="h-48 md:h-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl mb-6" />
    
    {/* Section title skeleton */}
    <div className="h-6 bg-gray-200 rounded w-48 mb-6" />
    
    {/* Post skeletons */}
    <div className="space-y-4">
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
  </div>
);

// Empty state component
const EmptyState = ({ topicName }: { topicName: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 md:p-12 text-center border border-white/20 shadow-xl"
  >
    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
      <span className="text-4xl">📝</span>
    </div>
    <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
      No posts in "{topicName}" yet
    </h3>
    <p className="text-gray-500 text-[14px] md:text-[15px] mb-6 max-w-md mx-auto leading-relaxed">
      Be the first to share something amazing! Posts tagged with this topic will appear here.
    </p>
    <Link to="/create-post">
      <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary to-primaryDark text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <span>Create a Post</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </motion.button>
    </Link>
  </motion.div>
);

export const TopicDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { topics } = useAppSelector((state) => state.topics);
  const { posts, loading: postsLoading } = useAppSelector((state) => state.posts);
  const [isLoading, setIsLoading] = useState(true);

  const topic = topics.find((t) => t.id === id);
  const topicPosts = posts.filter((p) => p.topic_id === id);
  const gradientColors = topic ? getGradientColors(topic.name) : ['from-primary', 'to-primaryDark'];
  const topicIcon = topic ? getTopicIcon(topic.name) : '💬';

  useEffect(() => {
    const loadData = async () => {
      if (id) {
        setIsLoading(true);
        await Promise.all([
          dispatch(fetchTopicById(id)),
          dispatch(fetchPosts())
        ]);
        // Add a small delay for smooth transition
        setTimeout(() => setIsLoading(false), 300);
      }
    };
    loadData();
  }, [id, dispatch]);

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-16 md:pt-16">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-primaryDark/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
        {/* Back Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4 md:mb-6"
        >
          <Link 
            to="/topics" 
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors duration-200 group"
          >
            <motion.svg 
              whileHover={{ x: -4 }}
              className="w-5 h-5 transition-transform"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </motion.svg>
            <span className="text-[14px] md:text-[15px] font-medium group-hover:underline">Back to Topics</span>
          </Link>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoading || !topic ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {/* Hero Header Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`relative overflow-hidden rounded-2xl mb-6 md:mb-8 bg-gradient-to-r ${gradientColors[0]} ${gradientColors[1]} shadow-xl`}
              >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-20 -translate-y-20" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl transform -translate-x-20 translate-y-20" />
                
                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-white/20 rounded-full"
                      style={{
                        left: `${20 + i * 15}%`,
                        top: `${30 + (i % 3) * 20}%`,
                      }}
                      animate={{
                        y: [-10, 10, -10],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 3 + i * 0.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.3,
                      }}
                    />
                  ))}
                </div>

                <div className="relative p-6 md:p-10">
                  <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
                    {/* Topic Icon */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                      className="w-20 h-20 md:w-28 md:h-28 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-4 md:mb-0 shadow-lg border border-white/30"
                    >
                      <span className="text-4xl md:text-5xl">{topicIcon}</span>
                    </motion.div>

                    {/* Topic Info */}
                    <div className="flex-1 text-white">
                      <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl md:text-4xl font-bold mb-2 md:mb-3 drop-shadow-lg"
                      >
                        {topic.name}
                      </motion.h1>
                      
                      {topic.description && (
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="text-white/90 text-[14px] md:text-[16px] leading-relaxed mb-4 md:mb-5 max-w-2xl"
                        >
                          {topic.description}
                        </motion.p>
                      )}

                      {/* Stats */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-wrap items-center gap-4 md:gap-6"
                      >
                        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                          <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                          <span className="text-[13px] md:text-[14px] font-medium">
                            {topicPosts.length} {topicPosts.length === 1 ? 'post' : 'posts'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                          <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-[13px] md:text-[14px] font-medium">
                            Created {formatDate(topic.created_at)}
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Posts Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h2 className="text-[18px] md:text-[22px] font-bold text-gray-800 flex items-center space-x-2">
                    <span>Posts</span>
                    {topicPosts.length > 0 && (
                      <span className="text-[13px] md:text-[14px] font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {topicPosts.length}
                      </span>
                    )}
                  </h2>
                </div>

                {postsLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full" />
                          <div className="flex-1 space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-1/4" />
                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : topicPosts.length === 0 ? (
                  <EmptyState topicName={topic.name} />
                ) : (
                  <motion.div 
                    className="space-y-3 md:space-y-4"
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.1
                        }
                      }
                    }}
                  >
                    {topicPosts.map((post, index) => (
                      <motion.div
                        key={post.id}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          show: { opacity: 1, y: 0 }
                        }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <PostCard post={post} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
};
