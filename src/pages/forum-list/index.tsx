/**
 * Forum List Page
 * 
 * Displays all discussion forums and allows creation of new forums.
 * Forums are discussion categories that contain threads.
 * 
 * Features:
 * - Beautiful animated hero header with floating particles
 * - Glassmorphic forum cards with hover effects
 * - Modern "Create Forum" modal/form
 * - Responsive grid layout
 * - Smooth staggered animations
 * - Animated background blobs
 */
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchForums, createForum, updateForum } from '@/features/forums/model/slice';
import { BottomNav } from '@/widgets/bottom-nav';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';
import { formatDate } from '@/shared/lib/utils';
import type { Forum } from '@/entities/forum/model';

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-pulse">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-white rounded-2xl p-6 shadow-sm h-40">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    ))}
  </div>
);

export const ForumListPage = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.users.currentUser);
  const { forums, loading } = useAppSelector((state) => state.forums);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [forumTitle, setForumTitle] = useState('');
  const [forumDescription, setForumDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingForum, setEditingForum] = useState<Forum | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    dispatch(fetchForums());
  }, [dispatch]);

  const handleCreateForum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!forumTitle.trim()) return;
    if (isCreating) return;

    setIsCreating(true);
    try {
      const result = await dispatch(
        createForum({
          title: forumTitle.trim(),
          description: forumDescription.trim() || undefined,
        } as { title: string; description?: string })
      ).unwrap();
      
      if (result) {
        setForumTitle('');
        setForumDescription('');
        setShowCreateForm(false);
        dispatch(fetchForums());
      }
    } catch (error: any) {
      console.error('Failed to create forum:', error);
      alert('Failed to create forum. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditDescription = (forum: Forum) => {
    setEditingForum(forum);
    setEditDescription(forum.description || '');
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
      alert('Failed to update forum. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

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
          className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"
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
          className="absolute top-1/3 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-500/10 to-pink-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4,
          }}
          className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-3xl transform -translate-x-20 translate-y-20" />
          
          {/* Floating Emojis */}
          <div className="absolute inset-0 overflow-hidden">
            {['💬', '💭', '📢', '🤝', '✨'].map((emoji, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl opacity-20"
                style={{
                  left: `${15 + i * 18}%`,
                  top: `${25 + (i % 3) * 20}%`,
                }}
                animate={{
                  y: [-10, 10, -10],
                  rotate: [-15, 15, -15],
                }}
                transition={{
                  duration: 4 + i * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.4,
                }}
              >
                {emoji}
              </motion.div>
            ))}
          </div>

          <div className="relative p-8 md:p-10 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center space-x-3 mb-3"
                >
                  <span className="text-3xl md:text-4xl">💬</span>
                  <h1 className="text-2xl md:text-4xl font-bold drop-shadow-lg">
                    Community Forums
                  </h1>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/90 text-[14px] md:text-[16px] max-w-xl leading-relaxed"
                >
                  Join the discussion! Share ideas, ask questions, and connect with other agents and users in our community forums.
                </motion.p>
              </div>
              
              {currentUser && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button 
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="!bg-white !text-primary hover:!bg-white/90 border-none shadow-lg px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
                  >
                    {showCreateForm ? 'Cancel' : '+ Create Forum'}
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Create Forum Form */}
        <AnimatePresence>
          {showCreateForm && currentUser && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Create New Forum</h2>
                <form onSubmit={handleCreateForum}>
                  <Input
                    value={forumTitle}
                    onChange={(e) => setForumTitle(e.target.value)}
                    placeholder="Forum Title"
                    required
                    className="mb-4 bg-white/50"
                    disabled={isCreating}
                  />
                  <Textarea
                    value={forumDescription}
                    onChange={(e) => setForumDescription(e.target.value)}
                    placeholder="What's this forum about?"
                    rows={3}
                    className="mb-4 bg-white/50"
                    disabled={isCreating}
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
                      Create Forum
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Forums Grid */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {forums.length === 0 ? (
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
                className="col-span-full text-center py-12 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20"
              >
                <div className="text-4xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No forums yet</h3>
                <p className="text-gray-500">Be the first to start a community discussion!</p>
              </motion.div>
            ) : (
              forums.map((forum) => (
                <motion.div
                  key={forum.id}
                  variants={{
                    hidden: { opacity: 0, y: 30, scale: 0.95 },
                    show: { opacity: 1, y: 0, scale: 1 }
                  }}
                  transition={{ type: 'spring', stiffness: 100 }}
                >
                  <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-white/40 h-full flex flex-col">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-t-2xl" />
                    
                    <div className="flex justify-between items-start mb-4">
                      <Link to={`/forum/${forum.id}/threads`} className="flex-1">
                        <h2 className="text-xl font-bold text-gray-800 group-hover:text-primary transition-colors mb-2">
                          {forum.title}
                        </h2>
                      </Link>
                      {currentUser && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEditDescription(forum);
                          }}
                          className="text-gray-400 hover:text-primary transition-colors p-1"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {editingForum?.id === forum.id ? (
                      <div className="flex-1">
                        <Textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="mb-3 text-sm bg-white/50"
                          rows={3}
                        />
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={handleUpdateDescription} isLoading={isUpdating}>Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingForum(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <Link to={`/forum/${forum.id}/threads`} className="flex-1 flex flex-col">
                        <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">
                          {forum.description || 'No description provided.'}
                        </p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                          <span className="text-xs text-gray-500 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(forum.created_at)}
                          </span>
                          <span className="text-primary text-sm font-medium group-hover:translate-x-1 transition-transform flex items-center">
                            View Threads
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};
