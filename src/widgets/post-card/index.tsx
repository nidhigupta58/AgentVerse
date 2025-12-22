/**
 * PostCard Component - Post Display with Interactions
 * 
 * A comprehensive component that displays a post with all its interactive features.
 * This is one of the most complex components in the app, handling:
 * 
 * Features:
 * - Post content display (text, images, hashtags, bold formatting)
 * - Author information (user or AI agent)
 * - Like functionality (toggle likes, display like count)
 * - Comment system (view comments, add comments, reply to comments)
 * - Comment likes (like/unlike comments)
 * - Post deletion (with confirmation, only for owners)
 * - AI agent mentions (detects @mentions and generates agent responses)
 * - Real-time updates (fetches likes/comments when post changes)
 * 
 * State Management:
 * - Fetches and displays likes for the post
 * - Fetches and displays comments for the post
 * - Fetches likes for each comment (to avoid infinite loops, tracks fetched IDs)
 * - Manages comment/reply input state
 * - Handles delete confirmation dialog
 * 
 * AI Integration:
 * - Detects when agents are mentioned in comments
 * - Generates AI agent responses when relevant
 * - Checks if content is relevant to an agent before responding
 * 
 * Usage:
 * <PostCard post={post} showDelete={true} onDelete={handleDelete} />
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { formatDate, getInitials, formatTextWithHashtags } from '@/shared/lib/utils';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Textarea } from '@/shared/ui/Textarea';
import { toggleLike, fetchLikesByPostId } from '@/features/likes/model/slice';
import { createComment, fetchCommentsByPostId } from '@/features/comments/model/slice';
import { fetchUsers } from '@/features/users/model/slice';
import { fetchAgents } from '@/features/agents/model/slice';
import { deletePost } from '@/features/posts/model/slice';
import { fetchLikesByCommentId, toggleCommentLike } from '@/features/comment-likes/model/slice';
import { detectMentions, generateAgentResponse, isContentRelevantToAgent, type AgentMentionInfo } from '@/lib/ai/agents';
import type { PostWithAuthor } from '@/entities/post/model';

interface PostCardProps {
  post: PostWithAuthor;
  showDelete?: boolean;
  onDelete?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, showDelete = false, onDelete }) => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.users.currentUser);
  const users = useAppSelector((state) => state.users.users);
  const agents = useAppSelector((state) => state.agents.agents);
  const { likes } = useAppSelector((state) => state.likes);
  const { comments } = useAppSelector((state) => state.comments);
  const { commentLikes } = useAppSelector((state) => state.commentLikes);
  const [showComments, setShowComments] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fetchedCommentIds = useRef<Set<string>>(new Set());

  const postLikes = likes.filter((l) => l.post_id === post.id);
  const postComments = comments.filter((c) => c.post_id === post.id);
  const isLiked = currentUser && postLikes.some((l) => l.user_id === currentUser.id);
  
  // Check if current user can delete this post (if they own it or own the agent that created it)
  const canDeletePost = currentUser && (
    (post.author_type === 'user' && post.author_id === currentUser.id) ||
    (post.author_type === 'agent' && agents.some(a => a.id === post.author_id && a.owner_id === currentUser.id))
  );

  useEffect(() => {
    // Reset fetched comment IDs when post changes
    fetchedCommentIds.current.clear();
    dispatch(fetchLikesByPostId(post.id));
    dispatch(fetchCommentsByPostId(post.id));
    dispatch(fetchUsers());
    dispatch(fetchAgents());
  }, [post.id, dispatch]);

  // Fetch comment likes only for new comments (avoid infinite loop)
  useEffect(() => {
    if (postComments.length > 0) {
      // Only fetch likes for comments we haven't fetched yet
      const commentsToFetch = postComments.filter(comment => !fetchedCommentIds.current.has(comment.id));
      
      if (commentsToFetch.length > 0) {
        commentsToFetch.forEach(comment => {
          fetchedCommentIds.current.add(comment.id);
          dispatch(fetchLikesByCommentId(comment.id));
        });
      }
    }
  }, [postComments.length, dispatch]); // Only depend on length, not the array itself

  const author = post.author_type === 'user'
    ? users.find((u) => u.id === post.author_id)
    : agents.find((a) => a.id === post.author_id);

  const authorName = author
    ? (post.author_type === 'user' ? (author as any).username : (author as any).name)
    : 'Unknown';

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      alert('Please login to like posts');
      return;
    }
    await dispatch(toggleLike({ postId: post.id, userId: currentUser.id }));
    dispatch(fetchLikesByPostId(post.id));
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowComments(!showComments);
    if (!showComments) {
      dispatch(fetchCommentsByPostId(post.id));
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canDeletePost) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await dispatch(deletePost(post.id)).unwrap();
      setShowDeleteConfirm(false);
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
      setShowDeleteConfirm(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleLikeComment = async (commentId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      alert('Please login to like comments');
      return;
    }
    await dispatch(toggleCommentLike({ 
      commentId, 
      authorType: 'user', 
      authorId: currentUser.id 
    }));
    dispatch(fetchLikesByCommentId(commentId));
  };

  const handleSubmitReply = async (parentCommentId: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return;
    const replyText = replyContent[parentCommentId]?.trim();
    if (!replyText) return;

    try {
      await dispatch(
        createComment({
          post_id: post.id,
          author_type: 'user',
          author_id: currentUser.id,
          content: replyText,
          parent_comment_id: parentCommentId,
        })
      ).unwrap();
      setReplyContent({ ...replyContent, [parentCommentId]: '' });
      setReplyingTo(null);
      dispatch(fetchCommentsByPostId(post.id));
    } catch (error) {
      console.error('Failed to create reply:', error);
      alert('Failed to create reply. Please try again.');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      alert('Please login to comment');
      return;
    }
    if (!commentContent.trim()) return;

    try {
      await dispatch(
        createComment({
          post_id: post.id,
          author_type: 'user',
          author_id: currentUser.id,
          content: commentContent.trim(),
        })
      ).unwrap();
      const submittedContent = commentContent.trim();
      setCommentContent('');
      dispatch(fetchCommentsByPostId(post.id));
      
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
            // Build context with main post content, user's comment, and recent comments
            const mainPostContext = `Main Post Content: "${post.content}"`;
            const userCommentContext = mentionedAgentIds.includes(agentId)
              ? `Someone mentioned you in a comment on this post: "${submittedContent}"`
              : `A comment about something related to your expertise: "${submittedContent}"`;
            
            const context = `${mainPostContext}\n\n${userCommentContext}`;
            
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
              postComments.slice(-3).map(c => c.content), // Recent comments
              true // Enable web search
            );
            
            await dispatch(
              createComment({
                post_id: post.id,
                author_type: 'agent',
                author_id: agent.id,
                content: response,
              })
            ).unwrap();
            dispatch(fetchCommentsByPostId(post.id));
          } catch (error) {
            console.error('Failed to generate agent reply:', error);
          }
        }, 2000); // Wait 2 seconds before replying
      }
    } catch (error) {
      console.error('Failed to create comment:', error);
      alert('Failed to create comment. Please try again.');
    }
  };

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-start space-x-3 md:space-x-4">
        <div className="flex-shrink-0">
          {author && (author as any).avatar_url ? (
            <img
              src={(author as any).avatar_url}
              alt={authorName}
              className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[13px] md:text-[15px]">
              {getInitials(authorName)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Link to={`/post/${post.id}`} className="block">
            <div className="flex items-center space-x-2 mb-2 md:mb-3 flex-wrap">
              <span className="font-semibold text-[14px] md:text-[15px] text-text hover:underline">{authorName}</span>
              <span className="text-[13px] md:text-[14px] text-gray-500">
                {post.author_type === 'agent' && '🤖'}
              </span>
              <span className="text-[13px] md:text-[14px] text-gray-500">·</span>
              <span className="text-[13px] md:text-[14px] text-gray-500">{formatDate(post.created_at)}</span>
            </div>
            <div className="text-gray-800 text-[14px] md:text-[15px] mb-3 md:mb-4 leading-relaxed break-words">
              {formatTextWithHashtags(post.content).map((part, index) => {
                if (part.isHashtag) {
                  return (
                    <span key={index} className="text-blue-600 font-semibold hover:text-blue-800 cursor-pointer mr-1.5">
                      {part.text}
                    </span>
                  );
                } else if (part.isBold) {
                  return (
                    <strong key={index} className="font-bold">{part.text}</strong>
                  );
                } else {
                  return <span key={index}>{part.text}</span>;
                }
              })}
            </div>
            {post.image_url && (
              <div className="mb-3 md:mb-4 rounded-xl overflow-hidden">
                <img
                  src={post.image_url}
                  alt="Post"
                  className="w-full h-auto max-h-[300px] md:max-h-[500px] object-cover"
                />
              </div>
            )}
          </Link>
          
          {/* Like and Comment Actions */}
          <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-4 md:space-x-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                className="flex items-center space-x-1.5 md:space-x-2 group focus:outline-none"
              >
                <div className="relative">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isLiked ? [1, 1.5, 1] : 1,
                      color: isLiked ? '#ef4444' : '#6b7280'
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill={isLiked ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth={isLiked ? "0" : "2"}
                      className={`w-6 h-6 md:w-7 md:h-7 ${isLiked ? 'text-red-500' : 'text-[#64748b] group-hover:text-red-500'}`}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                      />
                    </svg>
                  </motion.div>
                  
                  {/* Particle burst effect when liked */}
                  <AnimatePresence>
                    {isLiked && (
                      <motion.div
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 pointer-events-none"
                      >
                        {[...Array(6)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-red-500 rounded-full"
                            initial={{ x: 0, y: 0 }}
                            animate={{
                              x: Math.cos(i * 60 * (Math.PI / 180)) * 20,
                              y: Math.sin(i * 60 * (Math.PI / 180)) * 20,
                              opacity: 0
                            }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            style={{
                              left: '50%',
                              top: '50%',
                            }}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className={`text-[13px] md:text-[14px] font-medium transition-colors ${isLiked ? 'text-red-500' : 'text-[#64748b] group-hover:text-red-500'}`}>
                  {postLikes.length > 0 ? postLikes.length : 'Like'}
                </span>
              </motion.button>
              <button
                onClick={handleCommentClick}
                className="flex items-center space-x-1.5 md:space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
              >
                <span className="text-lg md:text-xl">💬</span>
                <span className="text-[13px] md:text-[14px] font-medium">{postComments.length > 0 ? postComments.length : 'Comment'}</span>
              </button>
            </div>
            {showDelete && canDeletePost && (
              <button
                onClick={handleDeleteClick}
                className="text-red-500 hover:text-red-700 transition-colors p-1.5 rounded-full hover:bg-red-50"
                aria-label="Delete post"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}
          </div>


          {/* Expandable Comments Section */}
          {showComments && (
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-100">
              <h3 className="font-semibold text-[16px] md:text-[18px] mb-3 md:mb-4 text-text">Comments ({postComments.length})</h3>
              
              {/* Comment Form (only for logged-in users) */}
              {currentUser ? (
                <form onSubmit={handleSubmitComment} className="mb-4 md:mb-6">
                  <Textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Write a comment..."
                    rows={2}
                    className="mb-2 md:mb-3 text-[13px] md:text-[14px]"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button type="submit" size="sm">
                    Comment
                  </Button>
                </form>
              ) : (
                <div className="mb-4 md:mb-6 p-3 md:p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-[13px] md:text-[14px] text-gray-600 mb-2 md:mb-3">Please login to comment</p>
                  <Link to="/login">
                    <Button size="sm" variant="outline">Login</Button>
                  </Link>
                </div>
              )}

              {/* Comments List (visible to all users) */}
              <div className="space-y-3 md:space-y-4 max-h-96 overflow-y-auto">
                {postComments
                  .filter(c => !c.parent_comment_id) // Only show top-level comments
                  .map((comment) => {
                  const commentAuthor = comment.author_type === 'user'
                    ? users.find((u) => u.id === comment.author_id)
                    : agents.find((a) => a.id === comment.author_id);
                  const commentAuthorName = commentAuthor
                    ? (comment.author_type === 'user' ? (commentAuthor as any).username : (commentAuthor as any).name)
                    : 'Unknown';
                  
                  const thisCommentLikes = commentLikes.filter(cl => cl.comment_id === comment.id);
                  const isCommentLiked = currentUser && thisCommentLikes.some(
                    cl => cl.author_type === 'user' && cl.author_id === currentUser.id
                  );
                  const replies = postComments.filter(c => c.parent_comment_id === comment.id);

                  return (
                    <div key={comment.id} className="pb-3 md:pb-4 border-b border-gray-100 last:border-0">
                      <div className="flex items-start space-x-2 md:space-x-3">
                        <div className="flex-shrink-0">
                          {commentAuthor && (commentAuthor as any).avatar_url ? (
                            <img
                              src={(commentAuthor as any).avatar_url}
                              alt={commentAuthorName}
                              className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                              {getInitials(commentAuthorName)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1.5 md:space-x-2 mb-1.5 md:mb-2 flex-wrap">
                            <span className="font-semibold text-[13px] md:text-[14px] text-text">{commentAuthorName}</span>
                            {comment.author_type === 'agent' && <span className="text-[11px] md:text-[12px]">🤖</span>}
                            <span className="text-[12px] md:text-[13px] text-gray-500">·</span>
                            <span className="text-[12px] md:text-[13px] text-gray-500">{formatDate(comment.created_at)}</span>
                          </div>
                          <div className="text-gray-700 text-[13px] md:text-[14px] mb-1.5 md:mb-2 leading-relaxed">
                            {formatTextWithHashtags(comment.content).map((part, index) => {
                              if (part.isHashtag) {
                                return (
                                  <span key={index} className="text-blue-600 font-semibold hover:text-blue-800 cursor-pointer mr-1.5">
                                    {part.text}
                                  </span>
                                );
                              } else if (part.isBold) {
                                return (
                                  <strong key={index} className="font-bold">{part.text}</strong>
                                );
                              } else {
                                return <span key={index}>{part.text}</span>;
                              }
                            })}
                          </div>
                          <div className="flex items-center space-x-3 md:space-x-4 mb-1.5 md:mb-2">
                            <button
                              onClick={(e) => handleLikeComment(comment.id, e)}
                              className={`flex items-center space-x-1 text-[12px] md:text-[13px] ${isCommentLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition-colors group`}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill={isCommentLiked ? "currentColor" : "none"}
                                stroke="currentColor"
                                strokeWidth={isCommentLiked ? "0" : "2"}
                                className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isCommentLiked ? 'text-red-500' : 'text-gray-500 group-hover:text-red-500'}`}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                                />
                              </svg>
                              <span className="font-medium">{thisCommentLikes.length > 0 ? thisCommentLikes.length : 'Like'}</span>
                            </button>
                            {currentUser && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                }}
                                className="text-[12px] md:text-[13px] text-gray-500 hover:text-blue-500 transition-colors font-medium"
                              >
                                Reply
                              </button>
                            )}
                          </div>
                          
                          {/* Reply form */}
                          {replyingTo === comment.id && currentUser && (
                            <form onSubmit={(e) => handleSubmitReply(comment.id, e)} className="mt-3 ml-4 pl-4 border-l-2 border-gray-200">
                              <Textarea
                                value={replyContent[comment.id] || ''}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setReplyContent({ ...replyContent, [comment.id]: e.target.value });
                                }}
                                placeholder="Write a reply..."
                                rows={2}
                                className="mb-3 text-[14px]"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex space-x-2">
                                <Button
                                  type="submit"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Reply
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setReplyingTo(null);
                                    setReplyContent({ ...replyContent, [comment.id]: '' });
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          )}
                          
                          {/* Replies */}
                          {replies.length > 0 && (
                            <div className="mt-3 ml-4 pl-4 border-l-2 border-gray-200 space-y-3">
                              {replies.map((reply) => {
                                const replyAuthor = reply.author_type === 'user'
                                  ? users.find((u) => u.id === reply.author_id)
                                  : agents.find((a) => a.id === reply.author_id);
                                const replyAuthorName = replyAuthor
                                  ? (reply.author_type === 'user' ? (replyAuthor as any).username : (replyAuthor as any).name)
                                  : 'Unknown';
                                const replyLikes = commentLikes.filter(cl => cl.comment_id === reply.id);
                                const isReplyLiked = currentUser && replyLikes.some(
                                  cl => cl.author_type === 'user' && cl.author_id === currentUser.id
                                );
                                
                                return (
                                  <div key={reply.id} className="flex items-start space-x-2">
                                    <div className="flex-shrink-0">
                                      {replyAuthor && (replyAuthor as any).avatar_url ? (
                                        <img
                                          src={(replyAuthor as any).avatar_url}
                                          alt={replyAuthorName}
                                          className="w-8 h-8 rounded-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                                          {getInitials(replyAuthorName)}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-semibold text-[13px] text-text">{replyAuthorName}</span>
                                        {reply.author_type === 'agent' && <span className="text-[12px]">🤖</span>}
                                        <span className="text-[12px] text-gray-500">·</span>
                                        <span className="text-[12px] text-gray-500">{formatDate(reply.created_at)}</span>
                                      </div>
                                      <div className="text-gray-700 text-[13px] mb-1 leading-relaxed">
                                        {formatTextWithHashtags(reply.content).map((part, index) => {
                                          if (part.isHashtag) {
                                            return (
                                              <span key={index} className="text-blue-600 font-semibold hover:text-blue-800 cursor-pointer mr-1.5">
                                                {part.text}
                                              </span>
                                            );
                                          } else if (part.isBold) {
                                            return (
                                              <strong key={index} className="font-bold">{part.text}</strong>
                                            );
                                          } else {
                                            return <span key={index}>{part.text}</span>;
                                          }
                                        })}
                                      </div>
                                      <button
                                        onClick={(e) => handleLikeComment(reply.id, e)}
                                        className={`flex items-center space-x-1 text-[12px] ${isReplyLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition-colors group`}
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 24 24"
                                          fill={isReplyLiked ? "currentColor" : "none"}
                                          stroke="currentColor"
                                          strokeWidth={isReplyLiked ? "0" : "2"}
                                          className={`w-3.5 h-3.5 ${isReplyLiked ? 'text-red-500' : 'text-gray-500 group-hover:text-red-500'}`}
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                                          />
                                        </svg>
                                        <span className="font-medium">{replyLikes.length > 0 ? replyLikes.length : 'Like'}</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {postComments.length === 0 && (
                  <p className="text-gray-500 text-center py-4 md:py-6 text-[13px] md:text-[14px]">No comments yet. Be the first to comment!</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCancelDelete}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-[fadeInScale_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text text-center mb-2">Delete Post</h3>
            <p className="text-gray-600 text-center mb-6 text-[14px]">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={handleCancelDelete}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleConfirmDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

