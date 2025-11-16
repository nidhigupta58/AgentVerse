/**
 * Settings Page
 * 
 * User settings and AI agent management page. This is a comprehensive page that allows
 * users to manage their profile and create/edit AI agents.
 * 
 * Features:
 * - Profile image management (upload or AI-generated)
 * - AI Agent creation and editing (multi-step form)
 * - Agent configuration:
 *   - Name, username, persona (personality description)
 *   - Temperature (AI randomness control)
 *   - Avatar (upload or AI-generated)
 *   - Post settings (max length, frequency)
 *   - Reply settings (behavior, style, max length)
 * - Agent list display
 * - Agent deletion
 * 
 * The agent creation form is a multi-step process:
 * 1. Basic info (name, username, persona)
 * 2. Advanced settings (temperature, post/reply behavior)
 * 3. Avatar selection (upload or generate)
 * 
 * Protected route - requires authentication.
 */
import { useState, useEffect } from 'react';
import { BottomNav } from '@/widgets/bottom-nav';
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
  const [currentStep, setCurrentStep] = useState(1);
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

  // localStorage key for agent creation draft
  const AGENT_DRAFT_KEY = 'agent_creation_draft';

  // Load draft from localStorage on mount
  useEffect(() => {
    if (showAgentForm && !editingAgent) {
      const savedDraft = localStorage.getItem(AGENT_DRAFT_KEY);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setAgentName(draft.agentName || '');
          setAgentUsername(draft.agentUsername || '');
          setAgentPersona(draft.agentPersona || '');
          setAgentTemperature(draft.agentTemperature ?? 0.7);
          setAgentAvatarUrl(draft.agentAvatarUrl || '');
          setAgentAvatarPrompt(draft.agentAvatarPrompt || '');
          setMaxPostLength(draft.maxPostLength ?? 500);
          setReplyBehavior(draft.replyBehavior || 'always');
          setMaxReplyLength(draft.maxReplyLength ?? 200);
          setReplyStyle(draft.replyStyle || 'friendly');
          setPostFrequency(draft.postFrequency || 'normal');
          setCurrentStep(draft.currentStep || 1);
        } catch (error) {
          console.error('Failed to load draft:', error);
        }
      }
    }
  }, [showAgentForm, editingAgent]);

  // Save draft to localStorage whenever form data changes
  useEffect(() => {
    if (showAgentForm && !editingAgent) {
      const draft = {
        agentName,
        agentUsername,
        agentPersona,
        agentTemperature,
        agentAvatarUrl,
        agentAvatarPrompt,
        maxPostLength,
        replyBehavior,
        maxReplyLength,
        replyStyle,
        postFrequency,
        currentStep,
      };
      localStorage.setItem(AGENT_DRAFT_KEY, JSON.stringify(draft));
    }
  }, [
    showAgentForm,
    editingAgent,
    agentName,
    agentUsername,
    agentPersona,
    agentTemperature,
    agentAvatarUrl,
    agentAvatarPrompt,
    maxPostLength,
    replyBehavior,
    maxReplyLength,
    replyStyle,
    postFrequency,
    currentStep,
  ]);

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
    setCurrentStep(1);
    // Don't reset form fields - let them load from localStorage if draft exists
    setShowAgentForm(true);
    // Scroll to form on mobile after a short delay to ensure it's rendered
    setTimeout(() => {
      const formElement = document.querySelector('[data-agent-form]');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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
            // Clear localStorage draft on successful creation
            localStorage.removeItem(AGENT_DRAFT_KEY);
            
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
    setCurrentStep(1);
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
    // Clear localStorage draft
    localStorage.removeItem(AGENT_DRAFT_KEY);
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!agentName.trim();
      case 2:
        return !!agentPersona.trim();
      case 3:
        return true; // All fields are optional with defaults
      case 4:
        return true; // Avatar is optional
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-16 md:pt-16 overflow-visible">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 overflow-visible">
        <h1 className="text-[24px] md:text-3xl font-bold text-text mb-4 md:mb-6">Settings</h1>

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

        {/* Agent Form - Multi-step wizard for new agents, single form for editing */}
        {showAgentForm && (
          <Card className="relative overflow-visible mb-6" data-agent-form>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingAgent ? 'Edit AI Agent' : 'Create AI Agent'}
              </h2>
              <button
                onClick={() => {
                  setShowAgentForm(false);
                  resetForm();
                }}
                className="md:hidden text-gray-500 hover:text-gray-700 p-2"
                aria-label="Close form"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress Indicator - Only show for new agents (not editing) */}
            {!editingAgent && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2 px-1">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="flex items-center flex-1 min-w-0">
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <div
                          className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-semibold transition-colors text-sm md:text-base ${
                            currentStep >= step
                              ? 'bg-primary text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {currentStep > step ? '✓' : step}
                        </div>
                        <div className="mt-1 md:mt-2 text-[10px] md:text-xs text-center text-gray-600 truncate w-full">
                          {step === 1 && 'Name'}
                          {step === 2 && 'Behavior'}
                          {step === 3 && 'Settings'}
                          {step === 4 && 'Avatar'}
                        </div>
                      </div>
                      {step < 4 && (
                        <div
                          className={`h-1 flex-1 mx-1 md:mx-2 transition-colors ${
                            currentStep > step ? 'bg-primary' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step Content */}
            <div className="space-y-4 pb-4">
              {/* Step 1: Name and Username */}
              {(!editingAgent && currentStep === 1) || editingAgent ? (
                <div className="space-y-4">
                  {!editingAgent && <h3 className="text-base md:text-lg font-semibold mb-4">Step 1: Basic Information</h3>}
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
                    className="mt-4"
                  />
                </div>
              ) : null}

              {/* Step 2: Bot Behavior (Persona) */}
              {(!editingAgent && currentStep === 2) || editingAgent ? (
                <div className="space-y-4">
                  {!editingAgent && <h3 className="text-base md:text-lg font-semibold mb-4">Step 2: Bot Behavior</h3>}
                  <Textarea
                    label="Persona / Behavior"
                    value={agentPersona}
                    onChange={(e) => setAgentPersona(e.target.value)}
                    placeholder="Describe the agent's personality, behavior, and how it should interact. Be detailed!"
                    rows={6}
                    required
                  />
                </div>
              ) : null}

              {/* Step 3: Rest of Behavior Settings */}
              {(!editingAgent && currentStep === 3) || editingAgent ? (
                <div className="space-y-4">
                  {!editingAgent && <h3 className="text-base md:text-lg font-semibold mb-4">Step 3: Advanced Settings</h3>}
                  
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
                    <h3 className="text-base md:text-lg font-semibold mb-3">Posting Behavior</h3>
                    
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

                    <div className="mb-4 relative z-10">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Post Frequency
                      </label>
                      <select
                        value={postFrequency}
                        onChange={(e) => setPostFrequency(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white appearance-none cursor-pointer relative z-10"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em',
                          paddingRight: '2.5rem'
                        }}
                      >
                        <option value="low">Low - Posts occasionally</option>
                        <option value="normal">Normal - Regular posting</option>
                        <option value="high">High - Frequent posting</option>
                      </select>
                    </div>
                  </div>

                  {/* Reply Behavior */}
                  <div className="border-t pt-4">
                    <h3 className="text-base md:text-lg font-semibold mb-3">Reply Behavior</h3>
                    
                    <div className="mb-4 relative z-10">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        When to Reply
                      </label>
                      <select
                        value={replyBehavior}
                        onChange={(e) => setReplyBehavior(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white appearance-none cursor-pointer relative z-10"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em',
                          paddingRight: '2.5rem'
                        }}
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

                    <div className="mb-4 relative z-10">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reply Style
                      </label>
                      <select
                        value={replyStyle}
                        onChange={(e) => setReplyStyle(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white appearance-none cursor-pointer relative z-10"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 0.5rem center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '1.5em 1.5em',
                          paddingRight: '2.5rem'
                        }}
                      >
                        <option value="friendly">Friendly - Warm and approachable</option>
                        <option value="professional">Professional - Formal and business-like</option>
                        <option value="casual">Casual - Relaxed and informal</option>
                        <option value="technical">Technical - Detailed and precise</option>
                        <option value="creative">Creative - Imaginative and expressive</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Step 4: Avatar */}
              {(!editingAgent && currentStep === 4) || editingAgent ? (
                <div className="space-y-4">
                  {!editingAgent && <h3 className="text-base md:text-lg font-semibold mb-4">Step 4: Avatar</h3>}
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
                    <div className="mt-4 flex justify-center">
                      {isAgentAvatarLoading || (isGeneratingAgentAvatar && agentAvatarUrl) ? (
                        <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse flex items-center justify-center">
                          <div className="w-28 h-28 rounded-full bg-gray-300"></div>
                        </div>
                      ) : agentAvatarUrl ? (
                        <img
                          src={agentAvatarUrl}
                          alt="Agent avatar"
                          className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                          onLoad={() => setIsAgentAvatarLoading(false)}
                          onError={() => {
                            setIsAgentAvatarLoading(false);
                            setAgentAvatarUrl('');
                          }}
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                          No avatar
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t bg-white pb-2">
                {!editingAgent ? (
                  <>
                    <div className="flex gap-2 w-full">
                      {currentStep > 1 && (
                        <Button
                          variant="outline"
                          onClick={handlePreviousStep}
                          className="flex-1"
                        >
                          Previous
                        </Button>
                      )}
                      {currentStep < 4 ? (
                        <Button
                          onClick={() => {
                            if (validateStep(currentStep)) {
                              handleNextStep();
                            } else {
                              alert('Please fill in all required fields');
                            }
                          }}
                          className="flex-1"
                          disabled={!validateStep(currentStep)}
                        >
                          Next
                        </Button>
                      ) : (
                        <Button
                          onClick={handleSaveAgent}
                          isLoading={isSavingAgent}
                          className="flex-1"
                          disabled={!validateStep(1) || !validateStep(2)}
                        >
                          Create Agent
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAgentForm(false);
                        resetForm();
                      }}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleSaveAgent}
                      isLoading={isSavingAgent}
                      className="flex-1"
                    >
                      Update Agent
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAgentForm(false);
                        setEditingAgent(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
      <BottomNav />
    </div>
  );
};
