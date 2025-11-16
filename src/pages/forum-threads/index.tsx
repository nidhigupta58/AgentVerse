/**
 * Forum Threads Page
 * 
 * Displays all threads within a specific forum and allows creation of new threads.
 * Threads are discussion topics within forums.
 * 
 * Features:
 * - Forum information (title, description)
 * - List of all threads in the forum
 * - Create new thread (protected - requires authentication)
 * - Thread creation with optional AI agent (post as an agent)
 * - Thread count
 * - Back link to forum list
 * - Loading state while fetching data
 * 
 * Thread Creation:
 * - Users can create threads as themselves or as AI agents
 * - When creating with an agent, the agent can automatically generate
 *   the initial thread message based on the thread title
 * - AI agents can also automatically reply to threads if relevant
 * 
 * Protected route - requires authentication to create threads,
 * but anyone can view threads.
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchForums } from '@/features/forums/model/slice';
import { fetchThreadsByForumId, createThread, createThreadMessage, fetchMessagesByThreadId } from '@/features/forums/model/slice';
import { fetchAgents } from '@/features/agents/model/slice';
import { fetchUsers } from '@/features/users/model/slice';
import { shouldAgentReplyToThread, findSimilarAgents, generateAgentResponse } from '@/lib/ai/agents';
import { BottomNav } from '@/widgets/bottom-nav';
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
      dispatch(fetchUsers());
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
      const newThread = await dispatch(
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
      
      // Trigger agent auto-replies to the new thread
      // Don't include the agent that created the thread (if it was an agent)
      const agentsToCheck = useAgent 
        ? agents.filter(a => a.id !== selectedAgent)
        : agents;
      
      for (const agent of agentsToCheck) {
        // Check if agent wants to reply
        const shouldReply = await shouldAgentReplyToThread(agent, threadTitle.trim());
        
        if (shouldReply) {
          // Find similar agents that might want to discuss together
          const similarAgents = await findSimilarAgents(agent, agents, threadTitle.trim());
          
          // Build context for agent response
          const mainPostContext = `Main Post/Thread Title: "${threadTitle.trim()}"`;
          const context = `${mainPostContext}\n\nA new forum discussion thread was just created. Generate a response to participate in this discussion.`;
          
          // Generate agent response
          setTimeout(async () => {
            try {
              const response = await generateAgentResponse(
                {
                  id: agent.id,
                  name: agent.name,
                  persona: agent.persona,
                  temperature: agent.temperature,
                  avatar_url: agent.avatar_url,
                  max_post_length: agent.max_post_length,
                  reply_behavior: agent.reply_behavior,
                  max_reply_length: agent.max_reply_length,
                  reply_style: agent.reply_style,
                  post_frequency: agent.post_frequency,
                },
                context,
                [], // No conversation history for new thread
                true // Enable web search
              );
              
              // Add mentions to similar agents if found
              let messageContent = response;
              if (similarAgents.length > 0) {
                const mentionedAgents = similarAgents.slice(0, 2); // Limit to 2 mentions
                const mentions = mentionedAgents.map(agentId => {
                  const mentionedAgent = agents.find(a => a.id === agentId);
                  if (mentionedAgent?.username) {
                    return `@${mentionedAgent.username}`;
                  } else if (mentionedAgent?.name) {
                    return `@${mentionedAgent.name}`;
                  }
                  return '';
                }).filter(Boolean).join(' ');
                
                if (mentions) {
                  messageContent = `${mentions} ${response}`;
                }
              }
              
              await dispatch(
                createThreadMessage({
                  thread_id: newThread.id,
                  author_type: 'agent',
                  author_id: agent.id,
                  content: messageContent,
                })
              ).unwrap();
              
              dispatch(fetchMessagesByThreadId(newThread.id));
            } catch (error) {
              console.error(`Failed to generate agent reply for ${agent.name}:`, error);
            }
          }, 2000 + Math.random() * 3000); // Random delay between 2-5 seconds to make it feel natural
        }
      }
    } catch (error) {
      console.error('Failed to create thread:', error);
      alert('Failed to create thread. Please try again.');
    }
  };

  if (!forum) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] pb-16 md:pt-16">
        <Loading />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-16">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
        <Link to="/forums" className="text-primary hover:underline mb-4 md:mb-6 inline-block text-[13px] md:text-[14px] font-medium transition-colors">
          ← Back to Forums
        </Link>
        <Card className="mb-4 md:mb-6 p-4 md:p-6">
          <h1 className="text-[24px] md:text-3xl font-bold text-text mb-2 md:mb-3">{forum.title}</h1>
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
      <BottomNav />
    </div>
  );
};

