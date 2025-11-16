import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchForums } from '@/features/forums/model/slice';
import { fetchThreadsByForumId, createThread } from '@/features/forums/model/slice';
import { fetchAgents } from '@/features/agents/model/slice';
import { Navbar } from '@/widgets/navbar';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Loading } from '@/shared/ui/Loading';
import { formatDate } from '@/shared/lib/utils';

export const ForumThreadsPage = () => {
  const { forumId } = useParams<{ forumId: string }>();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.users.currentUser);
  const { forums, threads } = useAppSelector((state) => state.forums);
  const { agents } = useAppSelector((state) => state.agents);
  const users = useAppSelector((state) => state.users.users);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [useAgent, setUseAgent] = useState(false);

  // Filter agents to only show user's own agents
  const userAgents = agents.filter((agent) => agent.owner_id === currentUser?.id);

  const forum = forums.find((f) => f.id === forumId);
  const forumThreads = threads.filter((t) => t.forum_id === forumId);

  useEffect(() => {
    if (forumId) {
      dispatch(fetchForums());
      dispatch(fetchThreadsByForumId(forumId));
      dispatch(fetchAgents());
    }
  }, [forumId, dispatch]);

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !forumId || !threadTitle.trim()) return;

    // If using agent, validate agent selection
    if (useAgent && !selectedAgent) {
      alert('Please select an agent to create the thread');
      return;
    }

    try {
      await dispatch(
        createThread({
          forum_id: forumId,
          author_type: useAgent ? 'agent' : 'user',
          author_id: useAgent ? selectedAgent : currentUser.id,
          title: threadTitle.trim(),
        })
      ).unwrap();
      setThreadTitle('');
      setSelectedAgent('');
      setUseAgent(false);
      setShowCreateForm(false);
      dispatch(fetchThreadsByForumId(forumId));
    } catch (error) {
      console.error('Failed to create thread:', error);
      alert('Failed to create thread. Please try again.');
    }
  };

  if (!forum) {
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
        <Link to="/forums" className="text-primary hover:underline mb-4 inline-block">
          ← Back to Forums
        </Link>
        <Card className="mb-6">
          <h1 className="text-3xl font-bold text-text mb-2">{forum.title}</h1>
          {forum.description && (
            <p className="text-gray-600">{forum.description}</p>
          )}
        </Card>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-text">Threads</h2>
          {currentUser && (
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? 'Cancel' : 'Create Thread'}
            </Button>
          )}
        </div>

        {showCreateForm && currentUser && (
          <Card className="mb-6">
            <form onSubmit={handleCreateThread}>
              <div className="mb-4">
                <label className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    checked={useAgent}
                    onChange={(e) => {
                      setUseAgent(e.target.checked);
                      if (!e.target.checked) setSelectedAgent('');
                    }}
                    className="rounded"
                  />
                  <span>Create thread as AI Agent</span>
                </label>
                {useAgent && (
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg mb-2"
                    required={useAgent}
                  >
                    <option value="">Select an agent...</option>
                    {userAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} {agent.username && `(@${agent.username})`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <Input
                label="Thread Title"
                value={threadTitle}
                onChange={(e) => setThreadTitle(e.target.value)}
                placeholder="Enter thread title..."
                className="mb-4"
                required
              />
              <Button type="submit">Create Thread</Button>
            </form>
          </Card>
        )}

        <div className="space-y-4">
          {forumThreads.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 py-8">No threads yet. Be the first to create one!</p>
            </Card>
          ) : (
            forumThreads.map((thread) => {
              const threadAuthor = thread.author_type === 'user'
                ? users.find((u) => u.id === thread.author_id)
                : agents.find((a) => a.id === thread.author_id);
              const threadAuthorName = threadAuthor
                ? (thread.author_type === 'user' ? (threadAuthor as any).username : (threadAuthor as any).name)
                : 'Unknown';

              return (
                <Link key={thread.id} to={`/forum/${forumId}/thread/${thread.id}`}>
                  <Card>
                    <h3 className="text-xl font-semibold text-text mb-2">{thread.title}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>By {threadAuthorName}</span>
                      {thread.author_type === 'agent' && <span>🤖</span>}
                      <span>·</span>
                      <span>{formatDate(thread.created_at)}</span>
                    </div>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

