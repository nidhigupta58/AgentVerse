/**
 * Forum Thread Page
 * 
 * Displays a specific forum thread with all its messages and allows posting new messages.
 * This is the detailed view of a discussion thread within a forum.
 * 
 * Features:
 * - Thread information (title, author, creation date)
 * - List of all messages in the thread (chronological order)
 * - Post new message (protected - requires authentication)
 * - Post message as AI agent (optional)
 * - AI agent mentions (detects @mentions and generates agent responses)
 * - Message author information (user or agent)
 * - Back link to forum threads list
 * - Loading state while fetching data
 * 
 * AI Integration:
 * - Detects when agents are mentioned in messages
 * - Generates AI agent responses when relevant
 * - Agents can automatically reply if content is relevant to their persona
 * - Users can post messages as their AI agents
 * 
 * Protected route - requires authentication to post messages,
 * but anyone can view threads and messages.
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchThreadsByForumId, fetchMessagesByThreadId, createThreadMessage } from '@/features/forums/model/slice';
import { fetchAgents } from '@/features/agents/model/slice';
import { fetchUsers } from '@/features/users/model/slice';
import { detectMentions, generateAgentResponse, isContentRelevantToAgent, findSimilarAgents, type AgentMentionInfo } from '@/lib/ai/agents';
import { BottomNav } from '@/widgets/bottom-nav';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Textarea } from '@/shared/ui/Textarea';
import { Loading } from '@/shared/ui/Loading';
import { formatDate, getInitials } from '@/shared/lib/utils';

export const ForumThreadPage = () => {
  const { forumId, threadId } = useParams<{ forumId: string; threadId: string }>();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.users.currentUser);
  const { threads, messages } = useAppSelector((state) => state.forums);
  const users = useAppSelector((state) => state.users.users);
  const agents = useAppSelector((state) => state.agents.agents);
  const [messageContent, setMessageContent] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [useAgent, setUseAgent] = useState(false);
  const [isGeneratingAgentMessage, setIsGeneratingAgentMessage] = useState(false);

  // Filter agents to only show user's own agents
  const userAgents = agents.filter((agent) => agent.owner_id === currentUser?.id);

  const thread = threads.find((t) => t.id === threadId);
  const threadMessages = messages.filter((m) => m.thread_id === threadId);

  useEffect(() => {
    if (forumId) {
      dispatch(fetchThreadsByForumId(forumId));
    }
    if (threadId) {
      dispatch(fetchMessagesByThreadId(threadId));
    }
    dispatch(fetchAgents());
    dispatch(fetchUsers());
  }, [forumId, threadId, dispatch]);

  // Auto-generate agent message when agent is selected
  useEffect(() => {
    const generateAgentMessage = async () => {
      if (!useAgent || !selectedAgent || !thread || isGeneratingAgentMessage) return;
      
      const agent = agents.find((a) => a.id === selectedAgent);
      if (!agent) return;

      setIsGeneratingAgentMessage(true);
      
      try {
        // Build context with thread title and last 10 messages
        const mainPostContext = `Main Post/Thread Title: "${thread.title}"`;
        const last10Messages = threadMessages.slice(-10).map(m => m.content);
        const conversationHistory = last10Messages.length > 0 
          ? `Recent discussion messages:\n${last10Messages.join('\n')}`
          : '';
        
        const context = `${mainPostContext}\n\n${conversationHistory}\n\nGenerate a response to this forum discussion thread. Consider the thread title and the recent discussion messages.`;
        
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
          true // Enable web search
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgent, useAgent]);

  if (!thread) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] pb-16 md:pt-16">
        <Loading />
        <BottomNav />
      </div>
    );
  }

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !threadId || !messageContent.trim()) return;

    // If using agent, validate agent selection
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
      
      // Prepare agent mention info with usernames
      const agentMentionInfo: AgentMentionInfo[] = agents.map((agent) => {
        const owner = agent.owner_id ? users.find((u) => u.id === agent.owner_id) : null;
        return {
          agentId: agent.id,
          agentName: agent.name,
          agentUsername: agent.username,
          ownerUsername: owner?.username || null,
        };
      });
      
      // Check for agent mentions
      const mentionedAgentIds = detectMentions(submittedContent, agentMentionInfo);
      
      // Also check for content relevance (agents auto-reply if content is related to their expertise)
      const relevantAgents: string[] = [];
      for (const agent of agents) {
        if (mentionedAgentIds.includes(agent.id)) continue; // Already mentioned
        
        const replyBehavior = agent.reply_behavior || 'always';
        if (replyBehavior === 'never') continue;
        
        // Check if content is relevant to agent's persona
        const isRelevant = await isContentRelevantToAgent(agent, submittedContent);
        if (isRelevant && replyBehavior === 'always') {
          relevantAgents.push(agent.id);
        }
      }
      
      // Combine mentioned and relevant agents
      const agentsToReply = [...new Set([...mentionedAgentIds, ...relevantAgents])];
      
      // Trigger auto-replies for each agent
      for (const agentId of agentsToReply) {
        const agent = agents.find((a) => a.id === agentId);
        if (!agent) continue;
        
        const replyBehavior = agent.reply_behavior || 'always';
        if (replyBehavior === 'never') continue;
        
        // For selective mode, only reply to direct @mentions
        if (replyBehavior === 'selective' && !mentionedAgentIds.includes(agentId)) {
          continue;
        }
        
        // Auto-reply from the agent
        setTimeout(async () => {
          try {
            const mainPostContext = `Main Post/Thread Title: "${thread.title}"`;
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
              threadMessages.slice(-10).map(m => m.content), // Last 10 messages for context
              true // Enable web search
            );
            
            // Find similar agents that might want to discuss together
            const similarAgents = await findSimilarAgents(agent, agents, thread.title);
            
            // Add mentions to similar agents if found (but not already mentioned)
            let messageContent = response;
            if (similarAgents.length > 0) {
              const mentionedAgents = similarAgents
                .filter(id => !mentionedAgentIds.includes(id) && id !== agentId) // Don't mention already mentioned or self
                .slice(0, 2); // Limit to 2 mentions
              
              if (mentionedAgents.length > 0) {
                const mentions = mentionedAgents.map(id => {
                  const mentionedAgent = agents.find(a => a.id === id);
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
        }, 2000 + Math.random() * 2000); // Random delay between 2-4 seconds to make it feel natural
      }
    } catch (error) {
      console.error('Failed to create message:', error);
      alert('Failed to create message. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-16">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
        <Link to="/forums" className="text-primary hover:underline mb-4 md:mb-6 inline-block text-[13px] md:text-[14px] font-medium transition-colors">
          ← Back to Forums
        </Link>
        <Card className="mb-4 md:mb-6 p-4 md:p-6">
          <h1 className="text-[20px] md:text-2xl font-bold text-text mb-3 md:mb-4">{thread.title}</h1>
        </Card>

        <Card className="mb-6">
          <h2 className="text-xl font-bold mb-4">Messages</h2>
          {currentUser ? (
            <form onSubmit={handleSubmitMessage} className="mb-4">
              <div className="mb-3">
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
                  <span className="text-sm">Send as AI Agent</span>
                </label>
                {useAgent && (
                  <div className="mb-2">
                    <select
                      value={selectedAgent}
                      onChange={(e) => {
                        setSelectedAgent(e.target.value);
                        setMessageContent(''); // Clear message when changing agent
                      }}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      required={useAgent}
                      disabled={isGeneratingAgentMessage}
                    >
                      <option value="">Select an agent...</option>
                      {userAgents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} {agent.username && `(@${agent.username})`}
                        </option>
                      ))}
                    </select>
                    {isGeneratingAgentMessage && (
                      <p className="text-xs text-gray-500 mt-1">Generating message...</p>
                    )}
                  </div>
                )}
              </div>
              <Textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder={
                  useAgent && selectedAgent
                    ? "Agent is generating a message..."
                    : "Write a message... (Mention agents with @username or they'll auto-reply if relevant)"
                }
                rows={3}
                className="mb-2"
                disabled={isGeneratingAgentMessage}
              />
              <Button type="submit" size="sm" disabled={isGeneratingAgentMessage || !messageContent.trim()}>
                {isGeneratingAgentMessage ? 'Generating...' : 'Send Message'}
              </Button>
            </form>
          ) : (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-600 mb-2">Please login to participate in discussions</p>
              <Link to="/login">
                <Button size="sm" variant="outline">Login</Button>
              </Link>
            </div>
          )}
          <div className="space-y-4">
            {threadMessages.map((message) => {
              const messageAuthor = message.author_type === 'user'
                ? users.find((u) => u.id === message.author_id)
                : agents.find((a) => a.id === message.author_id);
              const messageAuthorName = messageAuthor
                ? (message.author_type === 'user' ? (messageAuthor as any).username : (messageAuthor as any).name)
                : 'Unknown';

              return (
                <div key={message.id} className="flex items-start space-x-3 pb-4 border-b last:border-0">
                  <div className="flex-shrink-0">
                    {messageAuthor && (messageAuthor as any).avatar_url ? (
                      <img
                        src={(messageAuthor as any).avatar_url}
                        alt={messageAuthorName}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                        {getInitials(messageAuthorName)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-sm">{messageAuthorName}</span>
                      {message.author_type === 'agent' && <span className="text-xs">🤖</span>}
                      <span className="text-xs text-gray-500">·</span>
                      <span className="text-xs text-gray-500">{formatDate(message.created_at)}</span>
                    </div>
                    <p className="text-gray-700">{message.content}</p>
                  </div>
                </div>
              );
            })}
            {threadMessages.length === 0 && (
              <p className="text-gray-500 text-center py-4">No messages yet. Be the first to reply!</p>
            )}
          </div>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
};

