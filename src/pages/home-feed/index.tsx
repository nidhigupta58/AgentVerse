import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchPosts } from '@/features/posts/model/slice';
import { fetchUsers } from '@/features/users/model/slice';
import { fetchAgents } from '@/features/agents/model/slice';
import { Navbar } from '@/widgets/navbar';
import { PostCard } from '@/widgets/post-card';
import { Button } from '@/shared/ui/Button';
import { Loading } from '@/shared/ui/Loading';
import { getInitials } from '@/shared/lib/utils';

export const HomeFeedPage = () => {
  const dispatch = useAppDispatch();
  const { posts, loading, error } = useAppSelector((state) => state.posts);
  const { agents, loading: agentsLoading } = useAppSelector((state) => state.agents);
  const { users, loading: usersLoading } = useAppSelector((state) => state.users);
  const currentUser = useAppSelector((state) => state.users.currentUser);

  useEffect(() => {
    dispatch(fetchPosts());
    dispatch(fetchUsers());
    dispatch(fetchAgents());
  }, [dispatch]);

  // Get latest agents (already sorted by created_at desc)
  const latestAgents = agents.slice(0, 6);
  // Get latest users (already sorted by created_at desc)
  const latestUsers = users.slice(0, 6);

  return (
    <div className="h-screen bg-background overflow-hidden">
      <Navbar />
      <div className="max-w-7xl mx-auto px-3 py-4 h-[calc(100vh-80px)] overflow-hidden">
        {/* Main Content: Posts on left, Agents & Users on right */}
        <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden">
          {/* Left Side: Posts */}
          <div className="flex-1 min-w-0 lg:min-w-[60%] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
              <h2 className="text-xl font-bold text-text">Posts</h2>
              {currentUser && (
                <Link to="/create-post">
                  <Button className="text-sm py-1 px-3">Create Post</Button>
                </Link>
              )}
            </div>
            <div className="flex-1 hide-scrollbar-completely">
              {loading ? (
                <Loading />
              ) : error ? (
                <div className="text-center py-8">
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    <p className="font-semibold">Error loading posts</p>
                    <p className="text-sm">{error}</p>
                  </div>
                  <Button onClick={() => dispatch(fetchPosts())}>Retry</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No posts yet. Be the first to post!</p>
                      {currentUser && (
                        <Link to="/create-post">
                          <Button>Create Your First Post</Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    posts.map((post) => <PostCard key={post.id} post={post} />)
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Agents, Users, and Ads */}
          <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4 h-full">
            {/* Latest Agents Section */}
            <div className="bg-white rounded-lg shadow-md p-3 flex flex-col flex-shrink-0 overflow-hidden" style={{ height: 'calc(50% - 8px)' }}>
              <h2 className="text-lg font-bold text-text mb-3 flex-shrink-0">Latest Agents</h2>
              <div className="flex-1 hide-scrollbar-completely">
                {agentsLoading ? (
                  <Loading />
                ) : latestAgents.length === 0 ? (
                  <p className="text-sm text-gray-500">No agents yet</p>
                ) : (
                  <div className="space-y-2">
                    {latestAgents.map((agent) => (
                      <Link
                        key={agent.id}
                        to={`/agent/${agent.id}`}
                        className="block hover:bg-gray-50 rounded-lg p-2 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          {agent.avatar_url ? (
                            <img
                              src={agent.avatar_url}
                              alt={agent.name}
                              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {getInitials(agent.name)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-text text-sm truncate">{agent.name}</h3>
                            {agent.username && (
                              <p className="text-xs text-gray-500 truncate">@{agent.username}</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ad Space 1 */}
            <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center flex-shrink-0" style={{ height: '120px' }}>
              <div className="text-center text-gray-400 text-sm">
                <p className="font-semibold mb-1">Advertisement</p>
                <p className="text-xs">300x120</p>
              </div>
            </div>

            {/* Latest Users Section */}
            <div className="bg-white rounded-lg shadow-md p-3 flex flex-col flex-shrink-0 overflow-hidden" style={{ height: 'calc(50% - 8px)' }}>
              <h2 className="text-lg font-bold text-text mb-3 flex-shrink-0">Latest Users</h2>
              <div className="flex-1 hide-scrollbar-completely">
                {usersLoading ? (
                  <Loading />
                ) : latestUsers.length === 0 ? (
                  <p className="text-sm text-gray-500">No users yet</p>
                ) : (
                  <div className="space-y-2">
                    {latestUsers.map((user) => (
                      <Link
                        key={user.id}
                        to={`/user/${user.id}`}
                        className="block hover:bg-gray-50 rounded-lg p-2 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.username || user.name || 'User'}
                              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {getInitials(user.username || user.name || 'U')}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-text text-sm truncate">
                              {user.name || user.username || 'User'}
                            </h3>
                            {user.username && (
                              <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ad Space 2 */}
            <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center flex-shrink-0" style={{ height: '120px' }}>
              <div className="text-center text-gray-400 text-sm">
                <p className="font-semibold mb-1">Advertisement</p>
                <p className="text-xs">300x120</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

