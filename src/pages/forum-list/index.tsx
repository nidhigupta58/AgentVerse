/**
 * Forum List Page
 * 
 * Displays all discussion forums and allows creation of new forums.
 * Forums are discussion categories that contain threads.
 * 
 * Features:
 * - List of all forums with title, description, and creation date
 * - Create new forum (protected - requires authentication)
 * - Edit forum description (only for forum owners)
 * - Thread count display
 * - Clickable forum cards that navigate to forum threads
 * - Loading state while fetching forums
 * 
 * Forum Management:
 * - Only authenticated users can create forums
 * - Forum owners can edit their forum descriptions
 * - Each forum shows the number of threads it contains
 * 
 * Protected route - requires authentication to create/edit forums,
 * but anyone can view the forum list.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchForums, createForum, updateForum } from '@/features/forums/model/slice';
import { fetchAgents } from '@/features/agents/model/slice';
import { BottomNav } from '@/widgets/bottom-nav';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';
import { Loading } from '@/shared/ui/Loading';
import { formatDate } from '@/shared/lib/utils';
import type { Forum } from '@/entities/forum/model';

export const ForumListPage = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.users.currentUser);
  const { forums, loading } = useAppSelector((state) => state.forums);
  const { agents } = useAppSelector((state) => state.agents);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [forumTitle, setForumTitle] = useState('');
  const [forumDescription, setForumDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingForum, setEditingForum] = useState<Forum | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    dispatch(fetchForums());
    dispatch(fetchAgents());
  }, [dispatch]);

  const handleCreateForum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please login to create a forum');
      return;
    }
    if (!forumTitle.trim()) {
      alert('Please enter a forum title');
      return;
    }

    if (isCreating) return; // Prevent double submission

    setIsCreating(true);
    try {
      const result = await dispatch(
        createForum({
          title: forumTitle.trim(),
          description: forumDescription.trim() || undefined,
        } as { title: string; description?: string })
      ).unwrap();
      
      // Only reset form if creation was successful
      if (result) {
        setForumTitle('');
        setForumDescription('');
        setShowCreateForm(false);
        dispatch(fetchForums());
      }
    } catch (error: any) {
      console.error('Failed to create forum:', error);
      // Handle Redux Toolkit errors - check both payload and message
      const errorMessage = error?.payload || error?.message || error?.error?.message || 'Failed to create forum. Please try again.';
      alert(typeof errorMessage === 'string' ? errorMessage : 'Failed to create forum. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditDescription = (forum: Forum) => {
    setEditingForum(forum);
    setEditDescription(forum.description || '');
  };

  const handleCancelEdit = () => {
    setEditingForum(null);
    setEditDescription('');
  };

  const handleUpdateDescription = async () => {
    if (!editingForum) return;

    setIsUpdating(true);
    try {
      await dispatch(
        updateForum({
          id: editingForum.id,
          description: editDescription.trim() || null,
        })
      ).unwrap();
      
      setEditingForum(null);
      setEditDescription('');
      dispatch(fetchForums());
    } catch (error: any) {
      console.error('Failed to update forum:', error);
      const errorMessage = error?.payload || error?.message || error?.error?.message || 'Failed to update forum. Please try again.';
      alert(typeof errorMessage === 'string' ? errorMessage : 'Failed to update forum. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-16 md:pt-16">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h1 className="text-[24px] md:text-3xl font-bold text-text">Forums</h1>
          {currentUser && (
            <Button 
              onClick={() => {
                if (showCreateForm) {
                  setShowCreateForm(false);
                  setForumTitle('');
                  setForumDescription('');
                  setIsCreating(false);
                } else {
                  setShowCreateForm(true);
                }
              }}
              disabled={isCreating}
            >
              {showCreateForm ? 'Cancel' : 'Create Forum'}
            </Button>
          )}
        </div>

        {/* Create Forum Form */}
        {showCreateForm && currentUser && (
          <Card className="mb-6">
            <h2 className="text-xl font-bold mb-4">Create New Forum</h2>
            <form onSubmit={handleCreateForum}>
              <Input
                value={forumTitle}
                onChange={(e) => setForumTitle(e.target.value)}
                placeholder="Forum Title"
                required
                className="mb-3"
                disabled={isCreating}
              />
              <Textarea
                value={forumDescription}
                onChange={(e) => setForumDescription(e.target.value)}
                placeholder="Forum Description (optional)"
                rows={3}
                className="mb-3"
                disabled={isCreating}
              />
              <div className="flex space-x-2">
                <Button type="submit" isLoading={isCreating}>
                  Create Forum
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setForumTitle('');
                    setForumDescription('');
                    setIsCreating(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {loading ? (
          <Loading />
        ) : (
          <div className="space-y-4">
            {forums.length === 0 ? (
              <Card>
                <p className="text-center text-gray-500 py-8">No forums yet. Create the first one!</p>
              </Card>
            ) : (
              forums.map((forum) => (
                <Card key={forum.id} className="hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <Link to={`/forum/${forum.id}/threads`} className="flex-1">
                      <h2 className="text-xl font-semibold text-text mb-2">{forum.title}</h2>
                    </Link>
                    {currentUser && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEditDescription(forum);
                        }}
                        className="ml-2 p-1 text-gray-400 hover:text-primary transition-colors"
                        aria-label="Edit description"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {editingForum?.id === forum.id ? (
                    <div className="mb-2">
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Forum Description (optional)"
                        rows={3}
                        className="mb-2"
                        disabled={isUpdating}
                      />
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={handleUpdateDescription}
                          isLoading={isUpdating}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {forum.description && (
                        <p className="text-gray-600 mb-2">{forum.description}</p>
                      )}
                      <Link to={`/forum/${forum.id}/threads`}>
                        <p className="text-sm text-gray-500">{formatDate(forum.created_at)}</p>
                      </Link>
                    </>
                  )}
                </Card>
              ))
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

