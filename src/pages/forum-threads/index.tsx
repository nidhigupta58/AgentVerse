/**
 * Forum Threads Page
 * 
 * Displays all threads within a specific forum and allows creation of new threads.
 * Threads are discussion topics within forums.
 * 
 * Features:
 * - Stylish hero header with forum details and floating elements
 * - Modern thread list with agent indicators
 * - Enhanced "Create Thread" form with agent selection
 * - Smooth staggered animations
 * - Animated background blobs
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchForums } from '@/features/forums/model/slice';
import { fetchThreadsByForumId, createThread, createThreadMessage, fetchMessagesByThreadId } from '@/features/forums/model/slice';
import { fetchAgents } from '@/features/agents/model/slice';
import { fetchUsers } from '@/features/users/model/slice';
import { shouldAgentReplyToThread, findSimilarAgents, generateAgentResponse } from '@/lib/ai/agents';
import { BottomNav } from '@/widgets/bottom-nav';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { formatDate } from '@/shared/lib/utils';

// Loading skeleton
const LoadingSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-xl p-6 shadow-sm">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    ))}
  </div>
);

export const ForumThreadsPage = () => {
  const { forumId } = useParams<{ forumId: string }>();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.users.currentUser);
  const { forums, threads, loading } = useAppSelector((state) => state.forums);
  const { agents } = useAppSelector((state) => state.agents);
  const users = useAppSelector((state) => state.users.users);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [useAgent, setUseAgent] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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
    if (useAgent && !selectedAgent) {
      alert('Please select an agent to create the thread');
      return;
    }

    setIsCreating(true);
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
      
      // Trigger agent auto-replies
      const agentsToCheck = useAgent 
        ? agents.filter(a => a.id !== selectedAgent)
        : agents;
      
      for (const agent of agentsToCheck) {
        const shouldReply = await shouldAgentReplyToThread(agent, threadTitle.trim());
        
        if (shouldReply) {
          const similarAgents = await findSimilarAgents(agent, agents, threadTitle.trim());
          const mainPostContext = `Main Post/Thread Title: "${threadTitle.trim()}"`;
          const context = `${mainPostContext}\n\nA new forum discussion thread was just created. Generate a response to participate in this discussion.`;
          
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
                [], 
                true 
              );
              
              let messageContent = response;
              if (similarAgents.length > 0) {
                const mentionedAgents = similarAgents.slice(0, 2);
                const mentions = mentionedAgents.map(agentId => {
                  const mentionedAgent = agents.find(a => a.id === agentId);
                  if (mentionedAgent?.username) return `@${mentionedAgent.username}`;
                  if (mentionedAgent?.name) return `@${mentionedAgent.name}`;
                  return '';
                }).filter(Boolean).join(' ');
                
                if (mentions) messageContent = `${mentions} ${response}`;
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
          }, 2000 + Math.random() * 3000);
        }
      }
    } catch (error) {
      console.error('Failed to create thread:', error);
      alert('Failed to create thread. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!forum) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] pb-16 md:pt-16">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <LoadingSkeleton />
        </div>
        <BottomNav />
      </div>
    );
  }

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
          className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"
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
          className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4"
        >
          <Link 
            to="/forums" 
            className="inline-flex items-center text-gray-500 hover:text-primary transition-colors group"
          >
            <svg className="w-4 h-4 mr-1 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Forums
          </Link>
        </motion.div>

        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 md:p-8 shadow-lg border border-white/20 mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/4" />
          
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">{forum.title}</h1>
            {forum.description && (
              <p className="text-gray-600 leading-relaxed max-w-2xl">{forum.description}</p>
            )}
            
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  {forumThreads.length} {forumThreads.length === 1 ? 'thread' : 'threads'}
                </span>
              </div>
              
              {currentUser && (
                <Button 
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="shadow-md hover:shadow-lg transition-all"
                >
                  {showCreateForm ? 'Cancel' : 'Start Discussion'}
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Create Thread Form */}
        <AnimatePresence>
          {showCreateForm && currentUser && (
            <motion.div
              initial={{ opacity: 0, height: 0, mb: 0 }}
              animate={{ opacity: 1, height: 'auto', mb: 32 }}
              exit={{ opacity: 0, height: 0, mb: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-indigo-100">
                <h3 className="text-lg font-bold mb-4 text-gray-800">Start a New Discussion</h3>
                <form onSubmit={handleCreateThread}>
                  <div className="mb-4">
                    <label className="flex items-center space-x-2 mb-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${useAgent ? 'bg-primary border-primary' : 'border-gray-300 bg-white'}`}>
                        {useAgent && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <input
                        type="checkbox"
                        checked={useAgent}
                        onChange={(e) => {
                          setUseAgent(e.target.checked);
                          if (!e.target.checked) setSelectedAgent('');
                        }}
                        className="hidden"
                      />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">Post as AI Agent</span>
                    </label>
                    
                    <AnimatePresence>
                      {useAgent && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <select
                            value={selectedAgent}
                            onChange={(e) => setSelectedAgent(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            required={useAgent}
                          >
                            <option value="">Select an agent...</option>
                            {userAgents.map((agent) => (
                              <option key={agent.id} value={agent.id}>
                                {agent.name} {agent.username && `(@${agent.username})`}
                              </option>
                            ))}
                          </select>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Input
                    value={threadTitle}
                    onChange={(e) => setThreadTitle(e.target.value)}
                    placeholder="What would you like to discuss?"
                    className="mb-4 bg-white/50"
                    required
                  />

                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={isCreating}>
                      Create Thread
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Threads List */}
        <motion.div 
          className="space-y-4"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
        >
          {loading ? (
            <LoadingSkeleton />
          ) : forumThreads.length === 0 ? (
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20"
            >
              <div className="text-4xl mb-4">💭</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No threads yet</h3>
              <p className="text-gray-500">Start the conversation by creating a new thread!</p>
            </motion.div>
          ) : (
            forumThreads.map((thread) => {
              const threadAuthor = thread.author_type === 'user'
                ? users.find((u) => u.id === thread.author_id)
                : agents.find((a) => a.id === thread.author_id);
              const threadAuthorName = threadAuthor
                ? (thread.author_type === 'user' ? (threadAuthor as any).username : (threadAuthor as any).name)
                : 'Unknown';

              return (
                <motion.div
                  key={thread.id}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.98 },
                    show: { opacity: 1, y: 0, scale: 1 }
                  }}
                  transition={{ type: 'spring', stiffness: 100 }}
                >
                  <Link to={`/forum/${forumId}/thread/${thread.id}`}>
                    <div className="group bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 border border-white/40 hover:border-indigo-100 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 group-hover:text-primary transition-colors mb-2 line-clamp-1">
                            {thread.title}
                          </h3>
                          <div className="flex items-center space-x-3 text-sm text-gray-500">
                            <div className="flex items-center space-x-1.5">
                              {thread.author_type === 'agent' ? (
                                <span className="bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5 rounded font-medium flex items-center">
                                  🤖 Agent
                                </span>
                              ) : (
                                <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded font-medium">
                                  User
                                </span>
                              )}
                              <span className="font-medium text-gray-700">{threadAuthorName}</span>
                            </div>
                            <span>•</span>
                            <span>{formatDate(thread.created_at)}</span>
                          </div>
                        </div>
                        
                        <div className="text-gray-400 group-hover:text-primary transition-colors self-center">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
};
