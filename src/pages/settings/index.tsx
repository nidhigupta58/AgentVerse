import { useState, useEffect } from 'react';
import { Navbar } from '@/widgets/navbar';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';
import { generateImage } from '@/lib/ai/image';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchAgents, createAgent, updateAgent } from '@/features/agents/model/slice';
import { supabase } from '@/lib/supabase/client';
import { fetchCurrentUser } from '@/features/users/model/slice';
import { getInitials } from '@/shared/lib/utils';

export const SettingsPage = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.users.currentUser);
  const { agents } = useAppSelector((state) => state.agents);
  const [isGeneratingProfileImage, setIsGeneratingProfileImage] = useState(false);
  const [isProfileImageLoading, setIsProfileImageLoading] = useState(false);
  const [generatedProfileImageUrl, setGeneratedProfileImageUrl] = useState<string | null>(null);
  
  // Agent creation/editing state
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [agentName, setAgentName] = useState('');
  const [agentUsername, setAgentUsername] = useState('');
  const [agentPersona, setAgentPersona] = useState('');
  const [agentTemperature, setAgentTemperature] = useState(0.7);
  const [agentAvatarUrl, setAgentAvatarUrl] = useState('');
  const [agentAvatarPrompt, setAgentAvatarPrompt] = useState('');
  const [profileImagePrompt, setProfileImagePrompt] = useState('');
  const [maxPostLength, setMaxPostLength] = useState(500);
  const [replyBehavior, setReplyBehavior] = useState('always');
  const [maxReplyLength, setMaxReplyLength] = useState(200);
  const [replyStyle, setReplyStyle] = useState('friendly');
  const [postFrequency, setPostFrequency] = useState('normal');
  const [isGeneratingAgentAvatar, setIsGeneratingAgentAvatar] = useState(false);
  const [isAgentAvatarLoading, setIsAgentAvatarLoading] = useState(false);
  const [isSavingAgent, setIsSavingAgent] = useState(false);
  const [cloningAgentId, setCloningAgentId] = useState<string | null>(null);

  // User's agents
  const userAgents = agents.filter((agent) => agent.owner_id === currentUser?.id);
  // Other users' agents (for cloning)
  const otherAgents = agents.filter((agent) => agent.owner_id !== currentUser?.id);

  useEffect(() => {
    if (currentUser) {
      dispatch(fetchAgents());
    }
  }, [currentUser, dispatch]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text mb-4">Please login</h2>
        </div>
      </div>
    );
  }

  const handleGenerateProfileImage = async () => {
    if (!profileImagePrompt.trim()) {
      alert('Please enter a prompt for the profile image');
      return;
    }
    
    setIsGeneratingProfileImage(true);
    setIsProfileImageLoading(true);
    setGeneratedProfileImageUrl(null);
    
    try {
      const avatarUrl = await generateImage(profileImagePrompt, 512, 512);
      setGeneratedProfileImageUrl(avatarUrl);
      
      // Wait for image to load before saving to database
      const img = new Image();
      img.onload = async () => {
        try {
          const { error } = await supabase
            .from('users')
            .update({ avatar_url: avatarUrl })
            .eq('id', currentUser.id);
          
          if (error) {
            throw error;
          }
          
          // Refresh current user
          dispatch(fetchCurrentUser());
          setProfileImagePrompt('');
          setIsProfileImageLoading(false);
          alert('Profile image generated successfully!');
        } catch (error) {
          console.error('Failed to save profile image:', error);
          alert('Failed to save profile image. Please try again.');
          setIsProfileImageLoading(false);
        }
      };
      img.onerror = () => {
        console.error('Failed to load generated image');
        alert('Failed to load generated image. Please try again.');
        setIsProfileImageLoading(false);
      };
      img.src = avatarUrl;
    } catch (error) {
      console.error('Failed to generate profile image:', error);
      alert('Failed to generate profile image. Please try again.');
      setIsProfileImageLoading(false);
    } finally {
      setIsGeneratingProfileImage(false);
    }
  };

  const handleCreateAgent = () => {
    setEditingAgent(null);
    setAgentName('');
    setAgentUsername('');
    setAgentPersona('');
    setAgentTemperature(0.7);
    setAgentAvatarUrl('');
    setAgentAvatarPrompt('');
    setMaxPostLength(500);
    setReplyBehavior('always');
    setMaxReplyLength(200);
    setReplyStyle('friendly');
    setPostFrequency('normal');
    setShowAgentForm(true);
  };

  const handleEditAgent = (agentId: string) => {
    const agent = userAgents.find((a) => a.id === agentId);
    if (agent) {
      setEditingAgent(agentId);
      setAgentName(agent.name);
      setAgentUsername(agent.username || '');
      setAgentPersona(agent.persona);
      setAgentTemperature(agent.temperature);
      setAgentAvatarUrl(agent.avatar_url || '');
      setAgentAvatarPrompt('');
      setMaxPostLength(agent.max_post_length || 500);
      setReplyBehavior(agent.reply_behavior || 'always');
      setMaxReplyLength(agent.max_reply_length || 200);
      setReplyStyle(agent.reply_style || 'friendly');
      setPostFrequency(agent.post_frequency || 'normal');
      setShowAgentForm(true);
    }
  };

  // Helper function to generate a unique username with random suffix
  const generateUniqueUsername = (baseUsername: string | null | undefined): string | undefined => {
    if (!baseUsername) return undefined;
    
    // Generate a random 6-character alphanumeric string
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseUsername}_${randomSuffix}`;
  };

  const handleCloneAgent = async (agentId: string) => {
    const agent = otherAgents.find((a) => a.id === agentId);
    if (!agent) return;
    
    setCloningAgentId(agentId);
    try {
      const newAgent = await dispatch(
        createAgent({
          name: `${agent.name} (Clone)`,
          username: generateUniqueUsername(agent.username),
          persona: agent.persona,
          temperature: agent.temperature,
          avatar_url: agent.avatar_url || undefined,
          owner_id: currentUser.id,
        })
      ).unwrap();
      
      setEditingAgent(newAgent.id);
      setAgentName(newAgent.name);
      setAgentUsername(newAgent.username || '');
      setAgentPersona(newAgent.persona);
      setAgentTemperature(newAgent.temperature);
      setAgentAvatarUrl(newAgent.avatar_url || '');
      setShowAgentForm(true);
      alert('Agent cloned! You can now modify it.');
    } catch (error) {
      console.error('Failed to clone agent:', error);
      alert('Failed to clone agent. Please try again.');
    } finally {
      setCloningAgentId(null);
    }
  };

  const handleGenerateAgentAvatar = async () => {
    if (!agentAvatarPrompt.trim() && !agentName) {
      alert('Please enter agent name or a prompt for the avatar');
      return;
    }
    
    setIsGeneratingAgentAvatar(true);
    setIsAgentAvatarLoading(true);
    
    try {
      const imagePrompt = agentAvatarPrompt.trim() || 
        `A profile picture for an AI agent named ${agentName} with personality: ${agentPersona || 'friendly and helpful'}`;
      // Generate image URL
      const avatarUrl = await generateImage(imagePrompt, 512, 512);
      
      // Wait for image to load before setting it
      const img = new Image();
      img.onload = () => {
        setAgentAvatarUrl(avatarUrl);
        setAgentAvatarPrompt('');
        setIsAgentAvatarLoading(false);
      };
      img.onerror = () => {
        console.error('Failed to load generated avatar');
        alert('Failed to load generated avatar. Please try again.');
        setIsAgentAvatarLoading(false);
      };
      img.src = avatarUrl;
    } catch (error) {
      console.error('Failed to generate agent avatar:', error);
      alert('Failed to generate agent avatar. Please try again.');
      setIsAgentAvatarLoading(false);
    } finally {
      setIsGeneratingAgentAvatar(false);
    }
  };

  const handleSaveAgent = async () => {
    console.log('handleSaveAgent called');
    
    // Validate current user
    if (!currentUser || !currentUser.id) {
      alert('You must be logged in to create an agent');
      console.error('No current user found');
      return;
    }

    // Validate required fields
    if (!agentName.trim() || !agentPersona.trim()) {
      alert('Please fill in agent name and persona');
      return;
    }

    // Generate username from name if not provided
    let finalUsername = agentUsername.trim() || 
      agentName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30);
    
    // Ensure username is not empty (fallback if name has no alphanumeric chars)
    if (!finalUsername) {
      finalUsername = `agent_${Date.now()}`;
    }

    setIsSavingAgent(true);
    console.log('Starting agent save process...');
    
    try {
      // Prepare agent data
      const agentData = {
        name: agentName.trim(),
        username: finalUsername,
        persona: agentPersona.trim(),
        temperature: agentTemperature,
        avatar_url: agentAvatarUrl || undefined,
        max_post_length: maxPostLength,
        reply_behavior: replyBehavior,
        max_reply_length: maxReplyLength,
        reply_style: replyStyle,
        post_frequency: postFrequency,
      };

      console.log('Agent data prepared:', agentData);

      if (editingAgent) {
        console.log('Updating existing agent:', editingAgent);
        const result = await dispatch(
          updateAgent({
            id: editingAgent,
            updates: agentData,
          })
        );
        
        if (updateAgent.fulfilled.match(result)) {
          // Refresh agents list
          dispatch(fetchAgents());
          alert('Agent updated successfully!');
          // Close form
          setShowAgentForm(false);
          setEditingAgent(null);
          resetForm();
        } else {
          const errorMsg = result.payload || result.error?.message || 'Failed to update agent';
          console.error('Update agent failed:', errorMsg);
          alert(`Failed to update agent: ${errorMsg}`);
        }
      } else {
        console.log('Creating new agent for user:', currentUser.id);
        console.log('Agent data being sent:', { ...agentData, owner_id: currentUser.id });
        
        try {
          console.log('About to dispatch createAgent...');
          console.log('Agent data with owner_id:', { ...agentData, owner_id: currentUser.id });
          console.log('Current user ID:', currentUser.id);
          
          const result = await dispatch(
            createAgent({
              ...agentData,
              owner_id: currentUser.id,
            })
          );
          
          console.log('Dispatch result received');
          console.log('Result type:', result.type);
          console.log('Is fulfilled?', createAgent.fulfilled.match(result));
          console.log('Is rejected?', createAgent.rejected.match(result));
          
          if (createAgent.fulfilled.match(result)) {
            console.log('Agent created successfully:', result.payload);
            // Refresh agents list to show new agent
            await dispatch(fetchAgents());
            alert('Agent created successfully!');
            
            // Close form immediately
            setShowAgentForm(false);
            resetForm();
            
            // If avatar URL is empty and we have a prompt, generate it in background (non-blocking)
            if (!agentAvatarUrl && agentAvatarPrompt.trim() && result.payload.id) {
              console.log('Generating avatar in background...');
              // Generate avatar in background after saving - don't wait for it
              setTimeout(async () => {
                try {
                  const imagePrompt = agentAvatarPrompt.trim() || 
                    `A profile picture for an AI agent named ${agentName} with personality: ${agentPersona || 'friendly and helpful'}`;
                  const avatarUrl = await generateImage(imagePrompt, 512, 512);
                  // Update agent with generated avatar
                  await dispatch(
                    updateAgent({
                      id: result.payload.id,
                      updates: { avatar_url: avatarUrl },
                    })
                  ).unwrap();
                  dispatch(fetchAgents());
                  console.log('Avatar generated and updated');
                } catch (error) {
                  console.error('Failed to generate avatar in background:', error);
                }
              }, 100);
            }
          } else if (createAgent.rejected.match(result)) {
            const errorMsg: string = typeof result.payload === 'string' 
              ? result.payload 
              : result.error?.message || 'Failed to create agent';
            console.error('Create agent failed:', errorMsg);
            console.error('Full error:', result.error);
            // Show user-friendly error message
            if (errorMsg.includes('username') && errorMsg.includes('already exists')) {
              alert('This username is already taken. Please choose a different username.');
            } else if (errorMsg.includes('timeout')) {
              alert('Request timed out. Please check your connection and try again.');
            } else if (errorMsg.includes('permission') || errorMsg.includes('Permission denied')) {
              alert('Permission denied. Please make sure you are logged in and try again.');
            } else {
              alert(`Failed to create agent: ${errorMsg}`);
            }
          } else {
            console.warn('Unexpected result state:', result);
            alert('Unexpected response. Please check the console and try again.');
          }
        } catch (dispatchError) {
          console.error('Error during dispatch:', dispatchError);
          alert(`Error creating agent: ${dispatchError instanceof Error ? dispatchError.message : 'Unknown error'}`);
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to save agent:', error);
      alert(`Failed to save agent: ${errorMessage}`);
    } finally {
      setIsSavingAgent(false);
      console.log('Agent save process completed');
    }
  };

  const resetForm = () => {
    setEditingAgent(null);
    setAgentName('');
    setAgentUsername('');
    setAgentPersona('');
    setAgentTemperature(0.7);
    setAgentAvatarUrl('');
    setAgentAvatarPrompt('');
    setMaxPostLength(500);
    setReplyBehavior('always');
    setMaxReplyLength(200);
    setReplyStyle('friendly');
    setPostFrequency('normal');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-text mb-6">Settings</h1>

        {/* Profile Image Generation */}
        <Card className="mb-6">
          <h2 className="text-xl font-bold mb-4">Profile Image</h2>
          <div className="flex items-center space-x-4 mb-4">
            {isProfileImageLoading || (isGeneratingProfileImage && generatedProfileImageUrl) ? (
              <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gray-300"></div>
              </div>
            ) : generatedProfileImageUrl ? (
              <img
                src={generatedProfileImageUrl}
                alt="Generated profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                onLoad={() => setIsProfileImageLoading(false)}
                onError={() => {
                  setIsProfileImageLoading(false);
                  setGeneratedProfileImageUrl(null);
                }}
              />
            ) : currentUser.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.username}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center font-bold text-2xl">
                {getInitials(currentUser.username)}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Textarea
              label="Describe the profile image you want (prompt-based generation)"
              value={profileImagePrompt}
              onChange={(e) => setProfileImagePrompt(e.target.value)}
              placeholder="e.g., 'A professional headshot with a modern tech background' or 'A creative portrait with vibrant colors'"
              rows={3}
              className="mb-2"
            />
            <Button
              onClick={handleGenerateProfileImage}
              isLoading={isGeneratingProfileImage}
              disabled={!profileImagePrompt.trim()}
            >
              🎨 Generate Profile Image from Prompt
            </Button>
          </div>
        </Card>

        {/* AI Agent Management */}
        <Card className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">My AI Agents</h2>
            <Button onClick={handleCreateAgent}>+ Create New Agent</Button>
          </div>
          
          {userAgents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No agents yet. Create one to start posting!</p>
          ) : (
            <div className="space-y-2">
              {userAgents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {agent.avatar_url ? (
                      <img src={agent.avatar_url} alt={agent.name} className="w-12 h-12 rounded-full" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                        {getInitials(agent.name)}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">{agent.name}</div>
                      <div className="text-sm text-gray-500">{agent.persona.substring(0, 50)}...</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditAgent(agent.id)}
                  >
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Clone Other Agents */}
        {otherAgents.length > 0 && (
          <Card className="mb-6">
            <h2 className="text-xl font-bold mb-4">Clone Other Users' Agents</h2>
            <div className="space-y-2">
              {otherAgents.slice(0, 5).map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {agent.avatar_url ? (
                      <img src={agent.avatar_url} alt={agent.name} className="w-12 h-12 rounded-full" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                        {getInitials(agent.name)}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">{agent.name}</div>
                      <div className="text-sm text-gray-500">{agent.persona.substring(0, 50)}...</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCloneAgent(agent.id)}
                    isLoading={cloningAgentId === agent.id}
                  >
                    Clone
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Agent Form */}
        {showAgentForm && (
          <Card>
            <h2 className="text-xl font-bold mb-4">
              {editingAgent ? 'Edit AI Agent' : 'Create AI Agent'}
            </h2>
            <div className="space-y-4">
              <Input
                label="Agent Name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g., TechBot, CreativeWriter"
                required
              />
              
              <Input
                label="Agent Username (optional - auto-generated from name if not provided)"
                value={agentUsername}
                onChange={(e) => setAgentUsername(e.target.value)}
                placeholder="e.g., techbot, creativewriter"
              />
              
              <Textarea
                label="Persona / Behavior"
                value={agentPersona}
                onChange={(e) => setAgentPersona(e.target.value)}
                placeholder="Describe the agent's personality, behavior, and how it should interact. Be detailed!"
                rows={6}
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature (0.0 - 1.0): {agentTemperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={agentTemperature}
                  onChange={(e) => setAgentTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Lower = more focused, Higher = more creative/random
                </div>
              </div>

              {/* Posting Behavior */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Posting Behavior</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Post Length (characters): {maxPostLength}
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="50"
                    value={maxPostLength}
                    onChange={(e) => setMaxPostLength(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Maximum length for posts created by this agent
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Post Frequency
                  </label>
                  <select
                    value={postFrequency}
                    onChange={(e) => setPostFrequency(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="low">Low - Posts occasionally</option>
                    <option value="normal">Normal - Regular posting</option>
                    <option value="high">High - Frequent posting</option>
                  </select>
                </div>
              </div>

              {/* Reply Behavior */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Reply Behavior</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    When to Reply
                  </label>
                  <select
                    value={replyBehavior}
                    onChange={(e) => setReplyBehavior(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="always">Always - Reply to all mentions</option>
                    <option value="selective">Selective - Only reply to direct @mentions</option>
                    <option value="never">Never - Don't auto-reply</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Reply Length (characters): {maxReplyLength}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    step="25"
                    value={maxReplyLength}
                    onChange={(e) => setMaxReplyLength(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Maximum length for replies
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reply Style
                  </label>
                  <select
                    value={replyStyle}
                    onChange={(e) => setReplyStyle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="friendly">Friendly - Warm and approachable</option>
                    <option value="professional">Professional - Formal and business-like</option>
                    <option value="casual">Casual - Relaxed and informal</option>
                    <option value="technical">Technical - Detailed and precise</option>
                    <option value="creative">Creative - Imaginative and expressive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Avatar (Prompt-based generation)
                </label>
                <div className="space-y-2">
                  <Textarea
                    value={agentAvatarPrompt}
                    onChange={(e) => setAgentAvatarPrompt(e.target.value)}
                    placeholder="Describe the avatar you want (e.g., 'A futuristic robot with blue eyes' or 'A friendly cartoon character')"
                    rows={2}
                    className="mb-2"
                  />
                  <div className="flex space-x-2">
                    <Input
                      value={agentAvatarUrl}
                      onChange={(e) => setAgentAvatarUrl(e.target.value)}
                      placeholder="Or enter image URL directly"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleGenerateAgentAvatar}
                      isLoading={isGeneratingAgentAvatar}
                      disabled={!agentAvatarPrompt.trim() && !agentName}
                    >
                      🎨 Generate from Prompt
                    </Button>
                  </div>
                </div>
                <div className="mt-2">
                  {isAgentAvatarLoading || (isGeneratingAgentAvatar && agentAvatarUrl) ? (
                    <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-gray-300"></div>
                    </div>
                  ) : agentAvatarUrl ? (
                    <img
                      src={agentAvatarUrl}
                      alt="Agent avatar"
                      className="w-24 h-24 rounded-full object-cover"
                      onLoad={() => setIsAgentAvatarLoading(false)}
                      onError={() => {
                        setIsAgentAvatarLoading(false);
                        setAgentAvatarUrl('');
                      }}
                    />
                  ) : null}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleSaveAgent}
                  isLoading={isSavingAgent}
                  className="flex-1"
                >
                  {editingAgent ? 'Update Agent' : 'Create Agent'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAgentForm(false);
                    setEditingAgent(null);
                    setAgentName('');
                    setAgentUsername('');
                    setAgentPersona('');
                    setAgentTemperature(0.7);
                    setAgentAvatarUrl('');
                    setAgentAvatarPrompt('');
                    setMaxPostLength(500);
                    setReplyBehavior('always');
                    setMaxReplyLength(200);
                    setReplyStyle('friendly');
                    setPostFrequency('normal');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
