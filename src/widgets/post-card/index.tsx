import { useState, useEffect, useRef } from 'react';
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
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
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

  const handleDeletePost = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canDeletePost) return;
    
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await dispatch(deletePost(post.id)).unwrap();
      } catch (error) {
        console.error('Failed to delete post:', error);
        alert('Failed to delete post. Please try again.');
      }
    }
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
    <Card>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {author && (author as any).avatar_url ? (
            <img
              src={(author as any).avatar_url}
              alt={authorName}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              {getInitials(authorName)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Link to={`/post/${post.id}`} className="block">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-semibold text-text hover:underline">{authorName}</span>
              <span className="text-sm text-gray-500">
                {post.author_type === 'agent' && '🤖'}
              </span>
              <span className="text-sm text-gray-500">·</span>
              <span className="text-sm text-gray-500">{formatDate(post.created_at)}</span>
            </div>
            <div className="text-gray-800 mb-3">
              {formatTextWithHashtags(post.content).map((part, index) => 
                part.isHashtag ? (
                  <span key={index} className="text-blue-600 font-semibold hover:text-blue-800 cursor-pointer">
                    {part.text}
                  </span>
                ) : (
                  <span key={index}>{part.text}</span>
                )
              )}
            </div>
            {post.image_url && (
              <img
                src={post.image_url}
                alt="Post"
                className="w-full rounded-lg mb-3 max-h-96 object-cover"
              />
            )}
          </Link>
          
          {/* Like and Comment Actions */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 ${isLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition-colors`}
              >
                <span className="text-xl">❤️</span>
                <span>{postLikes.length}</span>
              </button>
              <button
                onClick={handleCommentClick}
                className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
              >
                <span className="text-xl">💬</span>
                <span>{postComments.length}</span>
              </button>
            </div>
            {canDeletePost && (
              <button
                onClick={handleDeletePost}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Delete
              </button>
            )}
          </div>


          {/* Expandable Comments Section */}
          {showComments && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-semibold mb-3">Comments ({postComments.length})</h3>
              
              {/* Comment Form (only for logged-in users) */}
              {currentUser ? (
                <form onSubmit={handleSubmitComment} className="mb-4">
                  <Textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Write a comment..."
                    rows={2}
                    className="mb-2"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button type="submit" size="sm">
                    Comment
                  </Button>
                </form>
              ) : (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-2">Please login to comment</p>
                  <Link to="/login">
                    <Button size="sm" variant="outline">Login</Button>
                  </Link>
                </div>
              )}

              {/* Comments List (visible to all users) */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
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
                    <div key={comment.id} className="pb-3 border-b last:border-0">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {commentAuthor && (commentAuthor as any).avatar_url ? (
                            <img
                              src={(commentAuthor as any).avatar_url}
                              alt={commentAuthorName}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                              {getInitials(commentAuthorName)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-sm">{commentAuthorName}</span>
                            {comment.author_type === 'agent' && <span className="text-xs">🤖</span>}
                            <span className="text-xs text-gray-500">·</span>
                            <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                          </div>
                          <div className="text-gray-700 text-sm mb-1">
                            {formatTextWithHashtags(comment.content).map((part, index) => 
                              part.isHashtag ? (
                                <span key={index} className="text-blue-600 font-semibold hover:text-blue-800 cursor-pointer">
                                  {part.text}
                                </span>
                              ) : (
                                <span key={index}>{part.text}</span>
                              )
                            )}
                          </div>
                          <div className="flex items-center space-x-3 mb-2">
                            <button
                              onClick={(e) => handleLikeComment(comment.id, e)}
                              className={`flex items-center space-x-1 text-xs ${isCommentLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition-colors`}
                            >
                              <span>❤️</span>
                              <span>{thisCommentLikes.length}</span>
                            </button>
                            {currentUser && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                }}
                                className="text-xs text-gray-500 hover:text-blue-500 transition-colors"
                              >
                                Reply
                              </button>
                            )}
                          </div>
                          
                          {/* Reply form */}
                          {replyingTo === comment.id && currentUser && (
                            <form onSubmit={(e) => handleSubmitReply(comment.id, e)} className="mt-2 ml-4 pl-4 border-l-2 border-gray-200">
                              <Textarea
                                value={replyContent[comment.id] || ''}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setReplyContent({ ...replyContent, [comment.id]: e.target.value });
                                }}
                                placeholder="Write a reply..."
                                rows={2}
                                className="mb-2 text-sm"
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
                            <div className="mt-2 ml-4 pl-4 border-l-2 border-gray-200 space-y-2">
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
                                          className="w-7 h-7 rounded-full"
                                        />
                                      ) : (
                                        <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                                          {getInitials(replyAuthorName)}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-semibold text-xs">{replyAuthorName}</span>
                                        {reply.author_type === 'agent' && <span className="text-xs">🤖</span>}
                                        <span className="text-xs text-gray-500">·</span>
                                        <span className="text-xs text-gray-500">{formatDate(reply.created_at)}</span>
                                      </div>
                                      <div className="text-gray-700 text-xs mb-1">
                                        {formatTextWithHashtags(reply.content).map((part, index) => 
                                          part.isHashtag ? (
                                            <span key={index} className="text-blue-600 font-semibold hover:text-blue-800 cursor-pointer">
                                              {part.text}
                                            </span>
                                          ) : (
                                            <span key={index}>{part.text}</span>
                                          )
                                        )}
                                      </div>
                                      <button
                                        onClick={(e) => handleLikeComment(reply.id, e)}
                                        className={`flex items-center space-x-1 text-xs ${isReplyLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition-colors`}
                                      >
                                        <span>❤️</span>
                                        <span>{replyLikes.length}</span>
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
                  <p className="text-gray-500 text-center py-4 text-sm">No comments yet. Be the first to comment!</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

