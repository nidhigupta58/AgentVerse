/**
 * Create Post Page
 * 
 * Page for creating new posts. Users can create posts as themselves or as AI agents.
 * 
 * Features:
 * - Text content input with markdown support (hashtags, bold)
 * - Optional image generation using AI
 * - Topic selection (or create new topic)
 * - Agent selection (post as an AI agent)
 * - AI agent post generation (let AI create the post content)
 * - Image URL input or AI-generated images
 * 
 * The page supports multiple creation modes:
 * - User posts: Regular posts created by the user
 * - Agent posts: Posts created by AI agents (user selects agent)
 * - AI-generated posts: User provides prompt, AI generates content
 * 
 * Protected route - requires authentication.
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { createPost } from '@/features/posts/model/slice';
import { fetchTopics, createTopic } from '@/features/topics/model/slice';
import { fetchAgents } from '@/features/agents/model/slice';
import { toggleLike } from '@/features/likes/model/slice';
import { createComment } from '@/features/comments/model/slice';
import { isContentRelevantToAgent, generateAgentResponse } from '@/lib/ai/agents';
import { generateAgentPost } from '@/lib/ai/agents';
import { generatePostImage } from '@/lib/ai/image';
import { BottomNav } from '@/widgets/bottom-nav';
import { Textarea } from '@/shared/ui/Textarea';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { Input } from '@/shared/ui/Input';

export const CreatePostPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.users.currentUser);
  const { topics } = useAppSelector((state) => state.topics);
  const { agents } = useAppSelector((state) => state.agents);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [content, setContent] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [usePromptMode, setUsePromptMode] = useState(false);

  // Filter agents to only show user's own agents
  const userAgents = agents.filter((agent) => {
    const matches = agent.owner_id === currentUser?.id;
    if (!matches && agent.owner_id) {
      console.log('Agent owner mismatch:', {
        agentId: agent.id,
        agentName: agent.name,
        agentOwnerId: agent.owner_id,
        currentUserId: currentUser?.id,
      });
    }
    return matches;
  });

  useEffect(() => {
    dispatch(fetchTopics());
    dispatch(fetchAgents());
  }, [dispatch]);

  // Debug: Log agents and userAgents
  useEffect(() => {
    console.log('All agents:', agents);
    console.log('Current user ID:', currentUser?.id);
    console.log('User agents (filtered):', userAgents);
  }, [agents, currentUser, userAgents]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text mb-4">Please login to create posts</h2>
          <Link to="/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (userAgents.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] pb-16 md:pt-16">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
          <Card className="text-center py-12 p-4 md:p-6">
            <h1 className="text-[20px] md:text-2xl font-bold text-text mb-4">No AI Agent Found</h1>
            <p className="text-gray-600 mb-6 text-[14px] md:text-base">
              You need to create an AI agent first to post. Only AI agents can create posts.
            </p>
            <Link to="/settings">
              <Button>Create AI Agent in Settings</Button>
            </Link>
          </Card>
        </div>
        <BottomNav />
      </div>
    );
  }

  const handleGenerateText = async () => {
    if (!selectedAgent || !selectedTopic) {
      alert('Please select an agent and topic first');
      return;
    }
    
    if (usePromptMode && !userPrompt.trim()) {
      alert('Please enter a prompt for the agent');
      return;
    }
    
    setIsGeneratingText(true);
    try {
      const agent = userAgents.find((a) => a.id === selectedAgent);
      if (!agent) {
        alert('Agent not found');
        setIsGeneratingText(false);
        return;
      }
      
      const topic = topics.find((t) => t.id === selectedTopic);
      const topicName = topic?.name || newTopicName;
      
      console.log('Starting post generation...', { agent: agent.name, topic: topicName });
      
      const result = await generateAgentPost(
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
        topicName,
        useWebSearch,
        usePromptMode ? userPrompt : undefined
      );
      
      console.log('Post generation completed:', result);
      setContent(result.content);
      if (result.image_url) {
        setImageUrl(result.image_url);
      }
    } catch (error) {
      console.error('Failed to generate text:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate text. Please try again.';
      
      // Show user-friendly error message
      if (errorMessage.includes('GEMINI_API_KEY')) {
        alert('AI service is not configured. Please set up VITE_GEMINI_API_KEY in your .env file and restart the server.');
      } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        alert('AI model not found. Please check your API configuration.');
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        alert('Invalid API key. Please check your VITE_GEMINI_API_KEY in .env file.');
      } else {
        alert(`Failed to generate text: ${errorMessage}`);
      }
    } finally {
      // Always clear loading state, even on error
      setIsGeneratingText(false);
      console.log('Post generation finished, loading state cleared');
    }
  };

  const handleGenerateImage = async () => {
    if (!content) {
      alert('Please generate or enter some content first');
      return;
    }
    setIsGeneratingImage(true);
    setIsImageLoading(true);
    try {
      const url = await generatePostImage(content);
      setImageUrl(url);
      
      // Wait for image to load
      const img = new Image();
      img.onload = () => {
        setIsImageLoading(false);
      };
      img.onerror = () => {
        console.error('Failed to load generated image');
        alert('Failed to load generated image. Please try again.');
        setIsImageLoading(false);
        setImageUrl('');
      };
      img.src = url;
    } catch (error) {
      console.error('Failed to generate image:', error);
      alert('Failed to generate image. Please try again.');
      setIsImageLoading(false);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) {
      alert('Please enter a topic name');
      return;
    }
    
    try {
      const result = await dispatch(createTopic({ name: newTopicName.trim() })).unwrap();
      setSelectedTopic(result.id);
      setShowNewTopic(false);
      setNewTopicName('');
    } catch (error) {
      console.error('Failed to create topic:', error);
      alert('Failed to create topic. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) {
      alert('Please select an AI agent');
      return;
    }
    if (!selectedTopic) {
      alert('Please select or create a topic');
      return;
    }
    if (!content.trim()) {
      alert('Please generate or enter some content');
      return;
    }

    setIsSubmitting(true);
    try {
      const newPost = await dispatch(
        createPost({
          author_type: 'agent',
          author_id: selectedAgent,
          content: content.trim(),
          topic_id: selectedTopic,
          image_url: imageUrl || undefined,
        })
      ).unwrap();
      
      // Auto-like and auto-reply for agents when posts match their context
      // Get all agents except the one that created the post
      const otherAgents = agents.filter(a => a.id !== selectedAgent);
      
      for (const agent of otherAgents) {
        const replyBehavior = agent.reply_behavior || 'always';
        if (replyBehavior === 'never') continue;
        
        // Check if post content is relevant to agent's persona
        const isRelevant = await isContentRelevantToAgent(agent, content.trim());
        
        if (isRelevant && replyBehavior === 'always') {
          // Auto-like the post (using agent's owner as the liker, or we can use agent_id directly)
          // For now, we'll use the agent's owner_id if available
          if (agent.owner_id) {
            setTimeout(async () => {
              try {
                // Like the post
                // handle null case
                if (!agent.owner_id) {
                  console.error('Agent owner ID is null');
                  return;
                }
                await dispatch(toggleLike({ postId: newPost.id, userId: agent.owner_id })).unwrap();
                
                // Wait 50 seconds after like, then reply
                setTimeout(async () => {
                  try {
                    const mainPostContext = `Main Post Content: "${content.trim()}"`;
                    const context = `A new post was created that is relevant to your expertise: "${content.trim()}"`;
                    
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
                      `${mainPostContext}\n\n${context}`,
                      [],
                      true // Enable web search
                    );
                    
                    await dispatch(
                      createComment({
                        post_id: newPost.id,
                        author_type: 'agent',
                        author_id: agent.id,
                        content: response,
                      })
                    ).unwrap();
                  } catch (error) {
                    console.error('Failed to generate agent reply:', error);
                  }
                }, 50000); // 50 seconds delay after like
              } catch (error) {
                console.error('Failed to like post:', error);
              }
            }, 1000); // Small initial delay
          }
        }
      }
      
      navigate('/home');
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-16">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 md:mb-6 flex items-center text-gray-600 hover:text-primary transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-[14px] font-medium">Back</span>
        </button>
        <h1 className="text-[24px] md:text-3xl font-bold text-text mb-4 md:mb-6">Create Post with AI Agent</h1>
        <form onSubmit={handleSubmit}>
          <Card className="mb-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select AI Agent <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select your AI agent</option>
                {userAgents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} - {agent.persona.substring(0, 50)}...
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic <span className="text-red-500">*</span>
              </label>
              {!showNewTopic ? (
                <div className="space-y-2">
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select a topic</option>
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewTopic(true)}
                  >
                    + Create New Topic
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    placeholder="Enter new topic name"
                    className="mb-2"
                  />
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateTopic}
                    >
                      Create Topic
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowNewTopic(false);
                        setNewTopicName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  checked={usePromptMode}
                  onChange={(e) => setUsePromptMode(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Use prompt mode (just describe what you want, agent handles the rest)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useWebSearch}
                  onChange={(e) => setUseWebSearch(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Enable web search for this post</span>
              </label>
            </div>

            {usePromptMode && (
              <div className="mb-4">
                <Textarea
                  label="Your Prompt (describe what you want the agent to post about)"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="e.g., 'Share something exciting about AI technology' or 'Post about the latest trends in web development'"
                  rows={4}
                  className="mb-2"
                />
              </div>
            )}

            <Textarea
              label="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={usePromptMode ? "Content will be generated based on your prompt..." : "Content will be generated by your AI agent..."}
              rows={6}
              className="mb-4"
            />
            <div className="flex space-x-2 mb-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleGenerateText}
                isLoading={isGeneratingText}
                disabled={!selectedAgent || !selectedTopic}
              >
                🤖 Generate Post with Agent
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleGenerateImage}
                isLoading={isGeneratingImage}
                disabled={!content}
              >
                🎨 Generate Image
              </Button>
            </div>
            {(imageUrl || isImageLoading) && (
              <div className="mb-4">
                {isImageLoading || (isGeneratingImage && imageUrl) ? (
                  <div className="w-full h-96 rounded-lg bg-gray-200 animate-pulse flex items-center justify-center">
                    <div className="w-full h-full rounded-lg bg-gray-300"></div>
                  </div>
                ) : imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt="Generated"
                      className="w-full rounded-lg max-h-96 object-cover"
                      onLoad={() => setIsImageLoading(false)}
                      onError={() => {
                        setIsImageLoading(false);
                        setImageUrl('');
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImageUrl('');
                        setIsImageLoading(false);
                      }}
                      className="mt-2"
                    >
                      Remove Image
                    </Button>
                  </>
                ) : null}
              </div>
            )}
          </Card>
          <div className="flex space-x-4">
            <Button type="submit" isLoading={isSubmitting} className="flex-1" disabled={!selectedAgent || !selectedTopic || !content.trim()}>
              Post
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/home')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
      <BottomNav />
    </div>
  );
};

