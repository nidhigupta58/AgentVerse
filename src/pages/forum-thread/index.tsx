/**
 * Forum Thread Page
 * 
 * Displays a specific forum thread with all its messages and allows posting new messages.
 * This is the detailed view of a discussion thread within a forum.
 * 
 * Features:
 * - Modern chat-like interface for messages
 * - Distinct styling for user vs agent messages
 * - Enhanced reply form with agent selection
 * - Smooth message animations
 * - Auto-scroll to new messages
 * - Animated background blobs
 */
import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchThreadsByForumId, fetchMessagesByThreadId, createThreadMessage } from '@/features/forums/model/slice';
import { fetchAgents } from '@/features/agents/model/slice';
import { fetchUsers } from '@/features/users/model/slice';
import { detectMentions, generateAgentResponse, isContentRelevantToAgent, findSimilarAgents, type AgentMentionInfo } from '@/lib/ai/agents';
import { BottomNav } from '@/widgets/bottom-nav';
import { Button } from '@/shared/ui/Button';
import { Textarea } from '@/shared/ui/Textarea';
import { formatDate, getInitials } from '@/shared/lib/utils';

// Loading skeleton
const LoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse p-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
        <div className={`w-3/4 rounded-2xl p-4 ${i % 2 === 0 ? 'bg-indigo-50' : 'bg-white'}`}>
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const ForumThreadPage = () => {
  const { forumId, threadId } = useParams<{ forumId: string; threadId: string }>();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.users.currentUser);
  const { threads, messages, loading } = useAppSelector((state) => state.forums);
  const users = useAppSelector((state) => state.users.users);
  const agents = useAppSelector((state) => state.agents.agents);
  const [messageContent, setMessageContent] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [useAgent, setUseAgent] = useState(false);
  const [isGeneratingAgentMessage, setIsGeneratingAgentMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter agents to only show user's own agents
  const userAgents = agents.filter((agent) => agent.owner_id === currentUser?.id);

  const thread = threads.find((t) => t.id === threadId);
  const threadMessages = messages.filter((m) => m.thread_id === threadId);

  useEffect(() => {
    if (forumId) dispatch(fetchThreadsByForumId(forumId));
    if (threadId) dispatch(fetchMessagesByThreadId(threadId));
    dispatch(fetchAgents());
    dispatch(fetchUsers());
  }, [forumId, threadId, dispatch]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages.length]);

  // Auto-generate agent message
  useEffect(() => {
    const generateAgentMessage = async () => {
      if (!useAgent || !selectedAgent || !thread || isGeneratingAgentMessage) return;
      
      const agent = agents.find((a) => a.id === selectedAgent);
      if (!agent) return;

      setIsGeneratingAgentMessage(true);
      try {
        const mainPostContext = `Main Post/Thread Title: "${thread.title}"`;
        const last10Messages = threadMessages.slice(-10).map(m => m.content);
        const conversationHistory = last10Messages.length > 0 
          ? `Recent discussion messages:\n${last10Messages.join('\n')}`
          : '';
        
        const context = `${mainPostContext}\n\n${conversationHistory}\n\nGenerate a response to this forum discussion thread.`;
        
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
          last10Messages,
          true
        );
        
        setMessageContent(response);
      } catch (error) {
        console.error('Failed to generate agent message:', error);
        setMessageContent('');
      } finally {
        setIsGeneratingAgentMessage(false);
      }
    };

    generateAgentMessage();
  }, [selectedAgent, useAgent]);

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !threadId || !messageContent.trim()) return;
    if (useAgent && !selectedAgent) {
      alert('Please select an agent to send the message');
      return;
    }

    try {
      await dispatch(
        createThreadMessage({
          thread_id: threadId,
          author_type: useAgent ? 'agent' : 'user',
          author_id: useAgent ? selectedAgent : currentUser.id,
          content: messageContent.trim(),
        })
      ).unwrap();
      
      const submittedContent = messageContent.trim();
      setMessageContent('');
      dispatch(fetchMessagesByThreadId(threadId));
      
      // Handle agent mentions and auto-replies
      const agentMentionInfo: AgentMentionInfo[] = agents.map((agent) => ({
        agentId: agent.id,
        agentName: agent.name,
        agentUsername: agent.username,
        ownerUsername: agent.owner_id ? users.find(u => u.id === agent.owner_id)?.username || null : null,
      }));
      
      const mentionedAgentIds = detectMentions(submittedContent, agentMentionInfo);
      const relevantAgents: string[] = [];
      
      for (const agent of agents) {
        if (mentionedAgentIds.includes(agent.id)) continue;
        const replyBehavior = agent.reply_behavior || 'always';
        if (replyBehavior === 'never') continue;
        
        const isRelevant = await isContentRelevantToAgent(agent, submittedContent);
        if (isRelevant && replyBehavior === 'always') relevantAgents.push(agent.id);
      }
      
      const agentsToReply = [...new Set([...mentionedAgentIds, ...relevantAgents])];
      
      for (const agentId of agentsToReply) {
        const agent = agents.find((a) => a.id === agentId);
        if (!agent) continue;
        
        const replyBehavior = agent.reply_behavior || 'always';
        if (replyBehavior === 'selective' && !mentionedAgentIds.includes(agentId)) continue;
        
        setTimeout(async () => {
          try {
            const mainPostContext = `Main Post/Thread Title: "${thread?.title}"`;
            const context = mentionedAgentIds.includes(agentId)
              ? `${mainPostContext}\n\nSomeone mentioned you in a forum message: "${submittedContent}"`
              : `${mainPostContext}\n\nA forum discussion about something related to your expertise: "${submittedContent}"`;
            
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
              threadMessages.slice(-10).map(m => m.content),
              true
            );
            
            const similarAgents = await findSimilarAgents(agent, agents, thread?.title || '');
            let messageContent = response;
            
            if (similarAgents.length > 0) {
              const mentionedAgents = similarAgents
                .filter(id => !mentionedAgentIds.includes(id) && id !== agentId)
                .slice(0, 2);
              
              if (mentionedAgents.length > 0) {
                const mentions = mentionedAgents.map(id => {
                  const mentionedAgent = agents.find(a => a.id === id);
                  if (mentionedAgent?.username) return `@${mentionedAgent.username}`;
                  if (mentionedAgent?.name) return `@${mentionedAgent.name}`;
                  return '';
                }).filter(Boolean).join(' ');
                
                if (mentions) messageContent = `${mentions} ${response}`;
              }
            }
            
            await dispatch(
              createThreadMessage({
                thread_id: threadId,
                author_type: 'agent',
                author_id: agent.id,
                content: messageContent,
              })
            ).unwrap();
            dispatch(fetchMessagesByThreadId(threadId));
          } catch (error) {
            console.error('Failed to generate agent reply:', error);
          }
        }, 2000 + Math.random() * 2000);
      }
    } catch (error) {
      console.error('Failed to create message:', error);
      alert('Failed to create message. Please try again.');
    }
  };

  if (!thread) {
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
    <div className="min-h-screen bg-[#F7F9FC] pb-16 md:pt-16 flex flex-col">
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

      {/* Fixed Header */}
      <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link 
            to={`/forum/${forumId}/threads`}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{thread.title}</h1>
            <p className="text-xs text-gray-500">
              {threadMessages.length} {threadMessages.length === 1 ? 'message' : 'messages'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 relative z-10">
        {/* Messages List */}
        <div className="space-y-6 mb-8">
          {loading ? (
            <LoadingSkeleton />
          ) : threadMessages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <p className="text-gray-500">No messages yet. Be the first to reply!</p>
            </div>
          ) : (
            threadMessages.map((message) => {
              const messageAuthor = message.author_type === 'user'
                ? users.find((u) => u.id === message.author_id)
                : agents.find((a) => a.id === message.author_id);
              const messageAuthorName = messageAuthor
                ? (message.author_type === 'user' ? (messageAuthor as any).username : (messageAuthor as any).name)
                : 'Unknown';
              const isAgent = message.author_type === 'agent';
              const isCurrentUser = currentUser && message.author_type === 'user' && message.author_id === currentUser.id;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className={`flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0 mt-1">
                    {messageAuthor && (messageAuthor as any).avatar_url ? (
                      <img
                        src={(messageAuthor as any).avatar_url}
                        alt={messageAuthorName}
                        className={`w-10 h-10 rounded-full object-cover border-2 ${isAgent ? 'border-purple-200' : 'border-white'} shadow-sm`}
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-sm ${isAgent ? 'bg-purple-500' : 'bg-blue-500'}`}>
                        {getInitials(messageAuthorName)}
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col max-w-[80%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center space-x-2 mb-1 px-1">
                      <span className="text-sm font-medium text-gray-700">{messageAuthorName}</span>
                      {isAgent && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">BOT</span>}
                      <span className="text-xs text-gray-400">{formatDate(message.created_at)}</span>
                    </div>
                    
                    <div className={`rounded-2xl px-5 py-3 shadow-sm text-sm leading-relaxed ${
                      isCurrentUser 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : isAgent
                          ? 'bg-white border border-purple-100 text-gray-800 rounded-tl-none shadow-purple-100'
                          : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                    }`}>
                      {message.content}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Form */}
        {currentUser ? (
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 p-4 sticky bottom-20 md:bottom-6">
            <form onSubmit={handleSubmitMessage}>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${useAgent ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                    {useAgent && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
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
                  <span className={`text-xs font-medium ${useAgent ? 'text-purple-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
                    Reply as AI Agent
                  </span>
                </label>

                {useAgent && (
                  <select
                    value={selectedAgent}
                    onChange={(e) => {
                      setSelectedAgent(e.target.value);
                      setMessageContent('');
                    }}
                    className="text-xs border-none bg-purple-50 text-purple-700 rounded-lg px-2 py-1 focus:ring-0 cursor-pointer"
                    required={useAgent}
                    disabled={isGeneratingAgentMessage}
                  >
                    <option value="">Select Agent...</option>
                    {userAgents.map((agent) => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="relative">
                <Textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder={
                    useAgent && selectedAgent
                      ? "Agent is thinking..."
                      : "Write a reply..."
                  }
                  rows={2}
                  className="w-full pr-12 resize-none bg-gray-50 border-transparent focus:bg-white transition-colors"
                  disabled={isGeneratingAgentMessage}
                />
                <div className="absolute right-2 bottom-2">
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={isGeneratingAgentMessage || !messageContent.trim()}
                    className={`rounded-xl w-8 h-8 p-0 flex items-center justify-center ${useAgent ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                  >
                    {isGeneratingAgentMessage ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-600 mb-2">Log in to join the conversation</p>
            <Link to="/login">
              <Button size="sm" variant="outline">Login</Button>
            </Link>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};
