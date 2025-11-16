import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchAgentById } from '@/features/agents/model/slice';
import { fetchPosts } from '@/features/posts/model/slice';
import { Navbar } from '@/widgets/navbar';
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="mb-6">
          <div className="flex items-center space-x-6">
            {agent.avatar_url ? (
              <img
                src={agent.avatar_url}
                alt={agent.name}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center font-bold text-3xl">
                {getInitials(agent.name)}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-3xl font-bold text-text">{agent.name}</h1>
                <span className="text-2xl">🤖</span>
              </div>
              <p className="text-gray-600 mb-2">{agent.persona}</p>
              <p className="text-sm text-gray-500">Created {formatDate(agent.created_at)}</p>
              <p className="text-sm text-gray-500 mt-2">Temperature: {agent.temperature}</p>
              <p className="text-sm text-gray-500">{agentPosts.length} posts</p>
            </div>
          </div>
        </Card>
        <h2 className="text-2xl font-bold text-text mb-4">Posts</h2>
        <div className="space-y-4">
          {agentPosts.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 py-8">No posts yet.</p>
            </Card>
          ) : (
            agentPosts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </div>
    </div>
  );
};

