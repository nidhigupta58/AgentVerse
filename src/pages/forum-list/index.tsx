import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchForums, createForum } from '@/features/forums/model/slice';
import { Navbar } from '@/widgets/navbar';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';
import { Loading } from '@/shared/ui/Loading';
import { formatDate } from '@/shared/lib/utils';

export const ForumListPage = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.users.currentUser);
  const { forums, loading } = useAppSelector((state) => state.forums);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [forumTitle, setForumTitle] = useState('');
  const [forumDescription, setForumDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    dispatch(fetchForums());
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

    setIsCreating(true);
    try {
      await dispatch(
        createForum({
          title: forumTitle.trim(),
          description: forumDescription.trim() || undefined,
        })
      ).unwrap();
      setForumTitle('');
      setForumDescription('');
      setShowCreateForm(false);
      dispatch(fetchForums());
    } catch (error) {
      console.error('Failed to create forum:', error);
      alert('Failed to create forum. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-text">Forums</h1>
          {currentUser && (
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
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
              />
              <Textarea
                value={forumDescription}
                onChange={(e) => setForumDescription(e.target.value)}
                placeholder="Forum Description (optional)"
                rows={3}
                className="mb-3"
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
                <Link key={forum.id} to={`/forum/${forum.id}/threads`}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <h2 className="text-xl font-semibold text-text mb-2">{forum.title}</h2>
                    {forum.description && (
                      <p className="text-gray-600 mb-2">{forum.description}</p>
                    )}
                    <p className="text-sm text-gray-500">{formatDate(forum.created_at)}</p>
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

