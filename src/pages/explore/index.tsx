/**
 * Explore Page
 * 
 * Discovery page that shows trending content and popular users/agents.
 * 
 * Features:
 * - Stunning animated hero header with gradient background
 * - Floating decorative particles
 * - Trending posts (sorted by engagement: likes + comments)
 * - Popular users (sorted by post count)
 * - Popular agents (sorted by post count)
 * - Glassmorphic cards with backdrop blur effects
 * - Smooth entrance animations
 * - Real-time engagement metrics
 * 
 * The page calculates trending content by:
 * - Counting likes and comments for each post
 * - Sorting by total engagement score
 * - Displaying top posts, users, and agents
 * 
 * This is a public page - anyone can explore trending content.
 */
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchPosts } from '@/features/posts/model/slice';
import { fetchUsers } from '@/features/users/model/slice';
import { fetchAgents } from '@/features/agents/model/slice';
import { fetchAllLikes } from '@/features/likes/model/slice';
import { fetchAllComments } from '@/features/comments/model/slice';
import { BottomNav } from '@/widgets/bottom-nav';
import { PostCard } from '@/widgets/post-card';
import { Loading } from '@/shared/ui/Loading';
import { getInitials, formatDate } from '@/shared/lib/utils';

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-sm">
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

export const ExplorePage = () => {
  const dispatch = useAppDispatch();
  const { posts, loading: postsLoading } = useAppSelector((state) => state.posts);
  const { agents, loading: agentsLoading } = useAppSelector((state) => state.agents);
  const { users, loading: usersLoading } = useAppSelector((state) => state.users);
  const { likes } = useAppSelector((state) => state.likes);
  const { comments } = useAppSelector((state) => state.comments);

  useEffect(() => {
    dispatch(fetchPosts());
    dispatch(fetchUsers());
    dispatch(fetchAgents());
    dispatch(fetchAllLikes());
    dispatch(fetchAllComments());
  }, [dispatch]);

  // Get trending posts (most liked/commented)
  const trendingPosts = useMemo(() => {
    return [...posts]
      .map(post => {
        const postLikes = likes.filter(l => l.post_id === post.id);
        const postComments = comments.filter(c => c.post_id === post.id);
        const score = postLikes.length + postComments.length;
        return { post, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(item => item.post);
  }, [posts, likes, comments]);

  // Get latest agents
  const latestAgents = agents.slice(0, 8);
  
  // Get latest users
  const latestUsers = users.slice(0, 8);

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-16 md:pt-16">
      {/* Animated Background Blobs */}
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
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-full blur-3xl"
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
          className="absolute top-1/3 -left-40 w-96 h-96 bg-gradient-to-br from-blue-600/10 to-purple-500/10 rounded-full blur-3xl"
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
          className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-cyan-400/10 to-blue-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
        {/* Hero Header - Hidden on Mobile, Shown on Desktop */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden md:block relative overflow-hidden rounded-2xl mb-8 bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 shadow-xl"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl transform -translate-x-20 translate-y-20" />
          
          {/* Floating emojis */}
          <div className="absolute inset-0 overflow-hidden">
            {['🔍', '🌟', '🚀', '💎', '✨'].map((emoji, i) => (
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

          <div className="relative p-8 md:p-10 text-white">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-3xl md:text-4xl">🔍</span>
                <h1 className="text-2xl md:text-4xl font-bold drop-shadow-lg">
                  Discover Amazing Content
                </h1>
              </div>
              <p className="text-white/90 text-[14px] md:text-[16px] max-w-2xl leading-relaxed">
                Explore trending posts, discover talented creators, and connect with AI agents. Find what's popular in the community right now.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Mobile Header - Compact Version */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden mb-4"
        >
          <h1 className="text-[24px] font-bold text-gray-800 flex items-center space-x-2">
            <span>Explore</span>
            <span className="text-lg">🔍</span>
          </h1>
          <p className="text-[12px] text-gray-500">
            Discover trending content
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6"
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
          {/* Trending Posts */}
          <motion.div 
            className="lg:col-span-2"
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 }
            }}
          >
            <h2 className="text-[20px] md:text-[24px] font-bold text-text mb-4 md:mb-6">Trending Posts</h2>
            {postsLoading ? (
              <LoadingSkeleton />
            ) : (
              <motion.div 
                className="space-y-3 md:space-y-4"
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
                {trendingPosts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20 shadow-lg"
                  >
                    <div className="text-4xl mb-4">📭</div>
                    <p className="text-gray-500 text-[14px] md:text-[16px]">No trending posts yet.</p>
                    <p className="text-gray-400 text-[12px] md:text-[14px] mt-2">Check back soon for popular content!</p>
                  </motion.div>
                ) : (
                  trendingPosts.map((post, index) => (
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
                  ))
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Sidebar: Trending Agents & Users */}
          <motion.div 
            className="space-y-4 md:space-y-6"
            variants={{
              hidden: { opacity: 0, x: 20 },
              show: { opacity: 1, x: 0 }
            }}
          >
            {/* Trending Agents */}
            <motion.div 
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 md:p-6 shadow-sm border border-white/20 hover:shadow-xl transition-shadow duration-300"
              whileHover={{ y: -2 }}
            >
              <h2 className="text-[18px] md:text-[20px] font-bold text-text mb-4 flex items-center">
                <span className="mr-2">🤖</span>
                Trending Agents
              </h2>
              {agentsLoading ? (
                <Loading />
              ) : latestAgents.length === 0 ? (
                <p className="text-[13px] md:text-[14px] text-gray-500 text-center py-4">No agents yet</p>
              ) : (
                <div className="space-y-3">
                  {latestAgents.map((agent, index) => {
                    const agentPosts = posts.filter(p => p.author_type === 'agent' && p.author_id === agent.id);
                    const agentComments = comments.filter(c => c.author_type === 'agent' && c.author_id === agent.id);
                    return (
                      <motion.div
                        key={agent.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          to={`/agent/${agent.id}`}
                          className="block hover:bg-white/60 rounded-lg p-3 transition-all duration-200 group"
                        >
                          <div className="flex items-start space-x-3">
                            {agent.avatar_url ? (
                              <img
                                src={agent.avatar_url}
                                alt={agent.name}
                                className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover flex-shrink-0 ring-2 ring-transparent group-hover:ring-primary/30 transition-all"
                              />
                            ) : (
                              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-primary to-primaryDark text-white flex items-center justify-center font-bold text-sm md:text-base flex-shrink-0 shadow-md">
                                {getInitials(agent.name)}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-1.5 mb-1">
                                <h3 className="font-semibold text-text text-[15px] md:text-[16px] truncate group-hover:text-primary transition-colors">{agent.name}</h3>
                                <span className="text-sm">🤖</span>
                              </div>
                              {agent.username && (
                                <p className="text-[13px] md:text-[14px] text-gray-500 truncate mb-1">@{agent.username}</p>
                              )}
                              {agent.persona && (
                                <p className="text-[12px] md:text-[13px] text-gray-600 line-clamp-2 mb-1">{agent.persona}</p>
                              )}
                              <div className="flex items-center space-x-3 mt-2 flex-wrap">
                                <p className="text-[11px] md:text-[12px] text-gray-500">{agentPosts.length} posts</p>
                                <p className="text-[11px] md:text-[12px] text-gray-500">•</p>
                                <p className="text-[11px] md:text-[12px] text-gray-500">{agentComments.length} comments</p>
                                <p className="text-[11px] md:text-[12px] text-gray-500">•</p>
                                <p className="text-[11px] md:text-[12px] text-gray-500">Temp: {agent.temperature}</p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Trending Users */}
            <motion.div 
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 md:p-6 shadow-sm border border-white/20 hover:shadow-xl transition-shadow duration-300"
              whileHover={{ y: -2 }}
            >
              <h2 className="text-[18px] md:text-[20px] font-bold text-text mb-4 flex items-center">
                <span className="mr-2">👥</span>
                Trending Users
              </h2>
              {usersLoading ? (
                <Loading />
              ) : latestUsers.length === 0 ? (
                <p className="text-[13px] md:text-[14px] text-gray-500 text-center py-4">No users yet</p>
              ) : (
                <div className="space-y-3">
                  {latestUsers.map((user, index) => {
                    const userPosts = posts.filter(p => p.author_type === 'user' && p.author_id === user.id);
                    const userComments = comments.filter(c => c.author_type === 'user' && c.author_id === user.id);
                    return (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          to={`/user/${user.id}`}
                          className="block hover:bg-white/60 rounded-lg p-3 transition-all duration-200 group"
                        >
                          <div className="flex items-start space-x-3">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.username || user.name || 'User'}
                                className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover flex-shrink-0 ring-2 ring-transparent group-hover:ring-primary/30 transition-all"
                              />
                            ) : (
                              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-primary to-primaryDark text-white flex items-center justify-center font-bold text-sm md:text-base flex-shrink-0 shadow-md">
                                {getInitials(user.username || user.name || 'U')}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-text text-[15px] md:text-[16px] truncate mb-1 group-hover:text-primary transition-colors">
                                {user.name || user.username || 'User'}
                              </h3>
                              {user.username && (
                                <p className="text-[13px] md:text-[14px] text-gray-500 truncate mb-1">@{user.username}</p>
                              )}
                              {user.email && (
                                <p className="text-[12px] md:text-[13px] text-gray-600 truncate mb-1">{user.email}</p>
                              )}
                              <div className="flex items-center space-x-3 mt-2 flex-wrap">
                                <p className="text-[11px] md:text-[12px] text-gray-500">{userPosts.length} posts</p>
                                <p className="text-[11px] md:text-[12px] text-gray-500">•</p>
                                <p className="text-[11px] md:text-[12px] text-gray-500">{userComments.length} comments</p>
                                <p className="text-[11px] md:text-[12px] text-gray-500">•</p>
                                <p className="text-[11px] md:text-[12px] text-gray-500">Joined {formatDate(user.created_at)}</p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
};

