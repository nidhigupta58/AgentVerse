/**
 * Explore Topics Page
 * 
 * Displays all available topics in a beautiful grid layout. Topics are tags/categories
 * that can be associated with posts for better organization and discovery.
 * 
 * Features:
 * - Stunning animated hero header
 * - Responsive grid layout of topic cards (1 column mobile, 2 tablet, 3 desktop)
 * - Dynamic gradient backgrounds for each topic
 * - Topic icons based on category
 * - Topic name, description, and creation date
 * - Post count for each topic
 * - Clickable cards that navigate to topic details
 * - Smooth loading animations and transitions
 * - Beautiful empty state
 * 
 * Each topic card links to the topic details page where users can see
 * all posts associated with that topic.
 * 
 * This is a public page - anyone can browse topics.
 */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchTopics } from '@/features/topics/model/slice';
import { fetchPosts } from '@/features/posts/model/slice';
import { BottomNav } from '@/widgets/bottom-nav';
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
const getGradientColors = (topicName: string): string => {
  const name = topicName.toLowerCase();
  if (name.includes('tech') || name.includes('code')) return 'from-blue-600 to-cyan-500';
  if (name.includes('ai') || name.includes('artificial')) return 'from-purple-600 to-pink-500';
  if (name.includes('design') || name.includes('art')) return 'from-pink-500 to-orange-400';
  if (name.includes('science')) return 'from-emerald-500 to-teal-400';
  if (name.includes('business')) return 'from-slate-700 to-slate-500';
  if (name.includes('music')) return 'from-violet-600 to-indigo-500';
  if (name.includes('game')) return 'from-red-500 to-orange-500';
  if (name.includes('health')) return 'from-green-500 to-lime-400';
  if (name.includes('food')) return 'from-amber-500 to-yellow-400';
  if (name.includes('travel')) return 'from-sky-500 to-blue-400';
  return 'from-primary to-primaryDark'; // Default gradient
};

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl mb-8" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-14 h-14 bg-gray-200 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Empty state component
const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
    className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 md:p-12 text-center border border-white/20 shadow-xl col-span-full"
  >
    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary/10 to-primaryDark/10 rounded-full flex items-center justify-center">
      <span className="text-5xl">🏷️</span>
    </div>
    <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
      No Topics Yet
    </h3>
    <p className="text-gray-500 text-[14px] md:text-[15px] mb-6 max-w-md mx-auto leading-relaxed">
      Topics help organize and discover content. Check back soon for new topics to explore!
    </p>
  </motion.div>
);

// Topic Card Component
interface TopicCardProps {
  topic: {
    id: string;
    name: string;
    description?: string | null;
    created_at: string;
  };
  postCount: number;
  index: number;
}

const TopicCard = ({ topic, postCount, index }: TopicCardProps) => {
  const gradientColors = getGradientColors(topic.name);
  const icon = getTopicIcon(topic.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link to={`/topic/${topic.id}`}>
        <motion.div
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group relative bg-white rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 h-full"
        >
          {/* Gradient accent line */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientColors}`} />
          
          {/* Hover gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

          <div className="relative">
            {/* Icon and Title */}
            <div className="flex items-center space-x-4 mb-4">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${gradientColors} rounded-xl flex items-center justify-center shadow-lg`}
              >
                <span className="text-2xl md:text-3xl">{icon}</span>
              </motion.div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[16px] md:text-[18px] font-bold text-gray-800 group-hover:text-primary transition-colors truncate">
                  {topic.name}
                </h2>
                <div className="flex items-center space-x-2 text-[12px] md:text-[13px] text-gray-500">
                  <span className="flex items-center space-x-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    <span>{postCount} {postCount === 1 ? 'post' : 'posts'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {topic.description && (
              <p className="text-gray-600 text-[13px] md:text-[14px] mb-4 leading-relaxed line-clamp-2">
                {topic.description}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-[11px] md:text-[12px] text-gray-400 flex items-center space-x-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(topic.created_at)}</span>
              </span>
              <motion.div
                initial={{ x: 0 }}
                whileHover={{ x: 4 }}
                className="flex items-center text-primary text-[12px] md:text-[13px] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span>Explore</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
};

export const ExploreTopicsPage = () => {
  const dispatch = useAppDispatch();
  const { topics, loading } = useAppSelector((state) => state.topics);
  const { posts } = useAppSelector((state) => state.posts);

  useEffect(() => {
    dispatch(fetchTopics());
    dispatch(fetchPosts());
  }, [dispatch]);

  // Calculate post count for each topic
  const getPostCount = (topicId: string) => {
    return posts.filter((p) => p.topic_id === topicId).length;
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-16 md:pt-16">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-primaryDark/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl mb-6 md:mb-8 bg-gradient-to-r from-primary via-primaryDark to-primary shadow-xl"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl transform -translate-x-20 translate-y-20" />
          
          {/* Floating icons */}
          <div className="absolute inset-0 overflow-hidden">
            {['🏷️', '📚', '💡', '🌟', '🎯'].map((emoji, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl md:text-3xl opacity-20"
                style={{
                  left: `${15 + i * 18}%`,
                  top: `${20 + (i % 3) * 25}%`,
                }}
                animate={{
                  y: [-8, 8, -8],
                  rotate: [-10, 10, -10],
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

          <div className="relative p-6 md:p-10 text-white">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-3 mb-3"
            >
              <span className="text-3xl md:text-4xl">🗂️</span>
              <h1 className="text-2xl md:text-4xl font-bold drop-shadow-lg">
                Explore Topics
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white/90 text-[14px] md:text-[16px] max-w-2xl leading-relaxed"
            >
              Discover curated topics and find content that interests you. Each topic brings together posts from the community.
            </motion.p>
            
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-5 flex flex-wrap gap-4"
            >
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="text-lg">📊</span>
                <span className="text-[13px] md:text-[14px] font-medium">
                  {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="text-lg">📝</span>
                <span className="text-[13px] md:text-[14px] font-medium">
                  {posts.length} total posts
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Topics Grid */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {topics.length === 0 ? (
              <EmptyState />
            ) : (
              topics.map((topic, index) => (
                <TopicCard 
                  key={topic.id} 
                  topic={topic} 
                  postCount={getPostCount(topic.id)}
                  index={index} 
                />
              ))
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};
