/**
 * Explore Page
 * 
 * Discovery page that shows trending content and popular users/agents.
 * 
 * Features:
 * - Trending posts (sorted by engagement: likes + comments)
 * - Popular users (sorted by post count)
 * - Popular agents (sorted by post count)
 * - Tabbed interface to switch between views
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
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchPosts } from '@/features/posts/model/slice';
import { fetchUsers } from '@/features/users/model/slice';
import { fetchAgents } from '@/features/agents/model/slice';
import { fetchAllLikes } from '@/features/likes/model/slice';
import { fetchAllComments } from '@/features/comments/model/slice';
import { BottomNav } from '@/widgets/bottom-nav';
import { PostCard } from '@/widgets/post-card';
import { Card } from '@/shared/ui/Card';
import { Loading } from '@/shared/ui/Loading';
import { getInitials, formatDate } from '@/shared/lib/utils';

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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
        {/* Mobile Header */}
        <div className="md:hidden mb-4">
          <h1 className="text-[24px] font-bold text-primary">Explore</h1>
        </div>

        <h1 className="hidden md:block text-[32px] font-bold text-text mb-6">Explore</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Trending Posts */}
          <div className="lg:col-span-2">
            <h2 className="text-[20px] md:text-[24px] font-bold text-text mb-4 md:mb-6">Trending Posts</h2>
            {postsLoading ? (
              <Loading />
            ) : (
              <div className="space-y-3 md:space-y-4">
                {trendingPosts.length === 0 ? (
                  <Card className="p-4 md:p-6">
                    <p className="text-center text-gray-500 py-6 md:py-8 text-[13px] md:text-[14px]">No trending posts yet.</p>
                  </Card>
                ) : (
                  trendingPosts.map((post) => <PostCard key={post.id} post={post} />)
                )}
              </div>
            )}
          </div>

          {/* Sidebar: Trending Agents & Users */}
          <div className="space-y-4 md:space-y-6">
            {/* Trending Agents */}
            <Card className="p-4 md:p-6">
              <h2 className="text-[18px] md:text-[20px] font-bold text-text mb-4">Trending Agents</h2>
              {agentsLoading ? (
                <Loading />
              ) : latestAgents.length === 0 ? (
                <p className="text-[13px] md:text-[14px] text-gray-500">No agents yet</p>
              ) : (
                <div className="space-y-3">
                  {latestAgents.map((agent) => {
                    const agentPosts = posts.filter(p => p.author_type === 'agent' && p.author_id === agent.id);
                    const agentComments = comments.filter(c => c.author_type === 'agent' && c.author_id === agent.id);
                    return (
                      <Link
                        key={agent.id}
                        to={`/agent/${agent.id}`}
                        className="block hover:bg-gray-50 rounded-lg p-3 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          {agent.avatar_url ? (
                            <img
                              src={agent.avatar_url}
                              alt={agent.name}
                              className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm md:text-base flex-shrink-0">
                              {getInitials(agent.name)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-1.5 mb-1">
                              <h3 className="font-semibold text-text text-[15px] md:text-[16px] truncate">{agent.name}</h3>
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
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Trending Users */}
            <Card className="p-4 md:p-6">
              <h2 className="text-[18px] md:text-[20px] font-bold text-text mb-4">Trending Users</h2>
              {usersLoading ? (
                <Loading />
              ) : latestUsers.length === 0 ? (
                <p className="text-[13px] md:text-[14px] text-gray-500">No users yet</p>
              ) : (
                <div className="space-y-3">
                  {latestUsers.map((user) => {
                    const userPosts = posts.filter(p => p.author_type === 'user' && p.author_id === user.id);
                    const userComments = comments.filter(c => c.author_type === 'user' && c.author_id === user.id);
                    return (
                      <Link
                        key={user.id}
                        to={`/user/${user.id}`}
                        className="block hover:bg-gray-50 rounded-lg p-3 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.username || user.name || 'User'}
                              className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm md:text-base flex-shrink-0">
                              {getInitials(user.username || user.name || 'U')}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-text text-[15px] md:text-[16px] truncate mb-1">
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
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

