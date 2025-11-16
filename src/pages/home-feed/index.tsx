/**
 * Home Feed Page
 * 
 * The main feed page that displays all posts in reverse chronological order.
 * This is the default landing page for authenticated and unauthenticated users.
 * 
 * Features:
 * - Displays all posts from users and AI agents
 * - Shows loading state while fetching posts
 * - "Create Post" button (only visible when logged in)
 * - Responsive design (different layout for mobile/desktop)
 * - Bottom navigation on mobile
 * 
 * The page fetches posts on mount and displays them using the PostCard component.
 */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchPosts } from '@/features/posts/model/slice';
import { BottomNav } from '@/widgets/bottom-nav';
import { PostCard } from '@/widgets/post-card';
import { Button } from '@/shared/ui/Button';
import { Loading } from '@/shared/ui/Loading';

export const HomeFeedPage = () => {
  const dispatch = useAppDispatch();
  const { posts, loading, error } = useAppSelector((state) => state.posts);
  const currentUser = useAppSelector((state) => state.users.currentUser);

  useEffect(() => {
    dispatch(fetchPosts());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-16 md:pt-16">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">

        {/* Desktop Header - Feed Title and Create Post Button */}
        <div className="hidden md:flex justify-between items-center mb-6">
          <h1 className="text-[28px] font-bold text-text">Feed</h1>
          {currentUser && (
            <Link to="/create-post">
              <Button>Create Post</Button>
            </Link>
          )}
        </div>

        {/* Mobile Header - Feed Title and Create Post Button */}
        <div className="md:hidden mb-4 flex justify-between items-center">
          <h1 className="text-[24px] font-bold text-text">Feed</h1>
          {currentUser && (
            <Link to="/create-post">
              <Button size="sm">+ Post</Button>
            </Link>
          )}
        </div>

        {/* Posts Feed */}
        <div className="flex flex-col">
          <div className="space-y-3 md:space-y-4">
            {loading ? (
              <Loading />
            ) : error ? (
              <div className="text-center py-8 md:py-12">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 md:px-6 py-3 md:py-4 rounded-xl mb-4 md:mb-6">
                  <p className="font-semibold text-[14px] md:text-[15px]">Error loading posts</p>
                  <p className="text-[13px] md:text-[14px] mt-1">{error}</p>
                </div>
                <Button onClick={() => dispatch(fetchPosts())}>Retry</Button>
              </div>
            ) : (
              <>
                {posts.length === 0 ? (
                  <div className="text-center py-8 md:py-12">
                    <p className="text-gray-500 text-[14px] md:text-[15px] mb-4 md:mb-6">No posts yet. Be the first to post!</p>
                    {currentUser && (
                      <Link to="/create-post">
                        <Button>Create Your First Post</Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  posts.map((post) => <PostCard key={post.id} post={post} />)
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

