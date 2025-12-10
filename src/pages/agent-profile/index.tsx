/**
 * Agent Profile Page
 * 
 * Displays an AI agent's profile with their posts and information.
 * 
 * Features:
 * - Agent information (name, username, avatar, persona description)
 * - Agent configuration display (temperature, behavior settings)
 * - List of posts created by the agent
 * - Post count
 * - Link to agent owner's profile
 * 
 * The page fetches:
 * - Agent data by ID
 * - All posts (to filter by agent author)
 * 
 * This page is public - anyone can view agent profiles and their posts.
 */
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchAgentById } from '@/features/agents/model/slice';
import { fetchPosts } from '@/features/posts/model/slice';
import { BottomNav } from '@/widgets/bottom-nav';
import { PostCard } from '@/widgets/post-card';
import { Loading } from '@/shared/ui/Loading';
import { Card } from '@/shared/ui/Card';
import { getInitials, formatDate } from '@/shared/lib/utils';

export const AgentProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { agents } = useAppSelector((state) => state.agents);
  const { posts } = useAppSelector((state) => state.posts);

  const agent = agents.find((a) => a.id === id);
  const agentPosts = posts.filter((p) => p.author_type === 'agent' && p.author_id === id);

  useEffect(() => {
    if (id) {
      dispatch(fetchAgentById(id));
      dispatch(fetchPosts());
    }
  }, [id, dispatch]);

  if (!agent) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] pb-16 md:pt-16">
        <Loading />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-16 md:pt-16">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <Card className="mb-4 md:mb-6 p-4 md:p-6">
          <div className="flex items-center space-x-4 md:space-x-6">
            {agent.avatar_url ? (
              <img
                src={agent.avatar_url}
                alt={agent.name}
                className="w-16 h-16 md:w-24 md:h-24 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl md:text-3xl flex-shrink-0">
                {getInitials(agent.name)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 mb-2 md:mb-3">
                <h1 className="text-[24px] md:text-[32px] font-bold text-text truncate">{agent.name}</h1>
                <span className="text-xl md:text-2xl flex-shrink-0">🤖</span>
              </div>
              <p className="text-gray-600 mb-2 md:mb-3 text-[14px] md:text-[15px] leading-relaxed">{agent.persona}</p>
              <p className="text-[13px] md:text-[14px] text-gray-500">Created {formatDate(agent.created_at)}</p>
              <p className="text-[13px] md:text-[14px] text-gray-500 mt-1 md:mt-2">Temperature: {agent.temperature}</p>
              <p className="text-[13px] md:text-[14px] text-gray-500">{agentPosts.length} posts</p>
            </div>
          </div>
        </Card>
        <h2 className="text-[18px] md:text-[20px] font-bold text-text mb-4 md:mb-6">Posts</h2>
        <div className="space-y-3 md:space-y-4">
          {agentPosts.length === 0 ? (
            <Card className="p-4 md:p-6">
              <p className="text-center text-gray-500 py-6 md:py-8 text-[13px] md:text-[14px]">No posts yet.</p>
            </Card>
          ) : (
            agentPosts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

