/**
 * User Profile Page
 * 
 * Displays a user's profile with their posts, comments, and AI agents.
 * 
 * Features:
 * - User profile information (name, username, avatar, bio)
 * - Tabbed interface:
 *   - Tab 0: User's AI Agents
 *   - Tab 1: Posts by user's agents
 *   - Tab 2: Posts by the user
 * - Post count and comment count
 * - Swipeable tabs on mobile
 * - Logout functionality (if viewing own profile)
 * - Edit profile link (if viewing own profile)
 * 
 * The page fetches:
 * - User data by ID
 * - All posts (to filter by author)
 * - All comments (to filter by author)
 * - All agents (to show user's agents)
 * 
 * If viewing own profile, additional options are available:
 * - Logout button
 * - Settings link
 * - Edit profile
 */
import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchUserById, signOutUser, updateUserAvatar } from '@/features/users/model/slice';
import { fetchPosts } from '@/features/posts/model/slice';
import { fetchAgents } from '@/features/agents/model/slice';
import { fetchAllComments } from '@/features/comments/model/slice';
import { BottomNav } from '@/widgets/bottom-nav';
import { PostCard } from '@/widgets/post-card';
import { Loading } from '@/shared/ui/Loading';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { getInitials } from '@/shared/lib/utils';
import { uploadUserAvatar } from '@/lib/supabase/storage';

export const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.users.currentUser);
  const { users } = useAppSelector((state) => state.users);
  const { posts } = useAppSelector((state) => state.posts);
  const { agents } = useAppSelector((state) => state.agents);
  const { comments } = useAppSelector((state) => state.comments);

  const user = users.find((u) => u.id === id);
  const userPosts = posts.filter((p) => p.author_type === 'user' && p.author_id === id);
  const userComments = comments.filter((c) => c.author_type === 'user' && c.author_id === id);
  const userAgents = agents.filter((a) => a.owner_id === id);
  const agentPosts = posts.filter((p) => p.author_type === 'agent' && userAgents.some(a => a.id === p.author_id));
  const isOwnProfile = !!(currentUser && currentUser.id === id);

  // Tab state: 0 = Agents, 1 = Agent Posts, 2 = User Posts
  const [activeTab, setActiveTab] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuDropdownRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImageOpen, setIsImageOpen] = useState(false);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) {
      console.log('No file selected or no current user.');
      return;
    }

    try {
      const avatarUrl = await uploadUserAvatar(currentUser.id, file);
      if (avatarUrl) {
        await dispatch(updateUserAvatar({ userId: currentUser.id, avatarUrl })).unwrap();
        console.log('Avatar updated successfully:', avatarUrl);
      } else {
        console.error('Failed to get avatar URL after upload.');
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchUserById(id));
      dispatch(fetchPosts());
      dispatch(fetchAgents());
      dispatch(fetchAllComments());
    }
  }, [id, dispatch]);
 
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideButton = menuButtonRef.current && !menuButtonRef.current.contains(target);
      const isOutsideDropdown = menuDropdownRef.current && !menuDropdownRef.current.contains(target);
      
      if (isOutsideButton && isOutsideDropdown) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Close image modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsImageOpen(false);
    };
    if (isImageOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isImageOpen]);

  const handleLogoutClick = () => {
    setShowMenu(false);
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    try {
      await dispatch(signOutUser());
      setShowLogoutConfirm(false);
      navigate('/home');
    } catch (error) {
      console.error('Error during logout:', error);
      setShowLogoutConfirm(false);
      navigate('/home');
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
    navigate("/home");
  };

  // Handle touch start
  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  // Handle touch move
  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  // Handle touch end and determine swipe direction
  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance < -minSwipeDistance && activeTab > 0) setActiveTab(activeTab - 1);
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activeTab < 2) {
      setActiveTab(activeTab + 1);
    }
    if (isRightSwipe && activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  // ✨ FIX: Move conditional returns after all hook calls
  if (!currentUser || !user) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] pb-16 md:pt-16">
        <Loading />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-16">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
        {/* Top Header: Username and Menu */}
        <div className="flex justify-between items-center mb-6 relative">
          <h1 className="text-[20px] md:text-[24px] font-bold text-text">{user.username}</h1>
          {isOwnProfile && (
            <>
              <button
                ref={menuButtonRef}
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Menu"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>
              {showMenu && (
                <div
                  ref={menuDropdownRef}
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg z-50 overflow-hidden p-3 origin-top-right animate-[fadeInScale_0.2s_ease-out] border border-gray-200"
                >
                  <Link
                    to="/settings"
                    onClick={() => setShowMenu(false)}
                    className="block w-full py-2 px-4 rounded-md text-[14px] font-semibold text-primary border-2 border-primary hover:bg-primary hover:text-white transition-colors mb-2"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogoutClick}
                    className="block w-full py-2 px-4 rounded-md text-[14px] font-semibold text-red-600 border-2 border-red-600 hover:bg-red-600 hover:text-white transition-colors"
                  >
                    Log out
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Profile Picture - Centered (Bigger) */}
        <div className="flex flex-col items-center mb-6 relative"> {/* Changed to flex-col and items-center */}
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.username}
              className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-lg cursor-pointer hover:ring-4 hover:ring-primary/30 transition-all duration-200"
              onClick={() => setIsImageOpen(true)}
              title="Click to view profile picture"
            />
          ) : (
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-primary text-white flex items-center justify-center font-bold text-3xl md:text-5xl border-4 border-white shadow-lg">
              {getInitials(user.username)}
            </div>
          )}
          {isOwnProfile && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                className="hidden"
                accept="image/*"
              />

              {/* ✨ Updated Edit Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change profile picture"
                className="absolute bottom-2 right-[38%] md:right-[42%] bg-white w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-300 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-all"
              >
                <svg
                  className="w-4 h-4 md:w-5 md:h-5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Stats Section */}
        <Card className="mb-6 p-4 md:p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[20px] md:text-[24px] font-bold text-text">{userPosts.length}</p>
              <p className="text-[12px] md:text-[13px] text-gray-500">Posts</p>
            </div>
            <div>
              <p className="text-[20px] md:text-[24px] font-bold text-text">{userComments.length}</p>
              <p className="text-[12px] md:text-[13px] text-gray-500">Comments</p>
            </div>
            <div>
              <p className="text-[20px] md:text-[24px] font-bold text-text">{userAgents.length}</p>
              <p className="text-[12px] md:text-[13px] text-gray-500">Agents</p>
            </div>
          </div>
        </Card>

        {/* Tabs Navigation */}
        <div className="mb-4 border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab(0)}
              className={`flex-1 py-3 px-4 text-center font-medium text-[14px] md:text-[15px] transition-colors relative ${
                activeTab === 0
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Agents
            </button>
            <button
              onClick={() => setActiveTab(1)}
              className={`flex-1 py-3 px-4 text-center font-medium text-[14px] md:text-[15px] transition-colors relative ${
                activeTab === 1
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Agent Posts
            </button>
            <button
              onClick={() => setActiveTab(2)}
              className={`flex-1 py-3 px-4 text-center font-medium text-[14px] md:text-[15px] transition-colors relative ${
                activeTab === 2
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              User Posts
            </button>
          </div>
        </div>

        {/* Swipeable Content Container */}
        <div
          ref={swipeContainerRef}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="relative"
        >
          {/* Section 1: Agents (Tab 0) */}
          <div className={activeTab === 0 ? 'block' : 'hidden'}>
            <div className="space-y-3">
              {userAgents.length === 0 ? (
                <Card className="p-4 md:p-6">
                  <p className="text-center text-gray-500 py-6 md:py-8 text-[13px] md:text-[14px]">No agents yet.</p>
                </Card>
              ) : (
                userAgents.map((agent) => (
                  <Link key={agent.id} to={`/agent/${agent.id}`}>
                    <Card className="p-4 md:p-6 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-3 md:space-x-4">
                        {agent.avatar_url ? (
                          <img
                            src={agent.avatar_url}
                            alt={agent.name}
                            className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm md:text-lg flex-shrink-0">
                            {getInitials(agent.name)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-text text-[15px] md:text-[16px] truncate">{agent.name}</h3>
                            <span className="text-sm">🤖</span>
                          </div>
                          {agent.username && (
                            <p className="text-[13px] md:text-[14px] text-gray-500 truncate">@{agent.username}</p>
                          )}
                          {agent.persona && (
                            <p className="text-[12px] md:text-[13px] text-gray-600 line-clamp-2 mt-1">{agent.persona}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Section 2: Agent Posts (Tab 1) */}
          <div className={activeTab === 1 ? 'block' : 'hidden'}>
            <div className="space-y-3 md:space-y-4">
              {agentPosts.length === 0 ? (
                <Card className="p-4 md:p-6">
                  <p className="text-center text-gray-500 py-6 md:py-8 text-[13px] md:text-[14px]">No posts by agents yet.</p>
                </Card>
              ) : (
                agentPosts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    showDelete={isOwnProfile}
                    onDelete={() => dispatch(fetchPosts())}
                  />
                ))
              )}
            </div>
          </div>

          {/* Section 3: User Posts (Tab 2) */}
          <div className={activeTab === 2 ? 'block' : 'hidden'}>
            <div className="space-y-3 md:space-y-4">
              {userPosts.length === 0 ? (
                <Card className="p-4 md:p-6">
                  <p className="text-center text-gray-500 py-6 md:py-8 text-[13px] md:text-[14px]">No posts yet.</p>
                </Card>
              ) : (
                userPosts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    showDelete={isOwnProfile}
                    onDelete={() => dispatch(fetchPosts())}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCancelLogout}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-[fadeInScale_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-orange-100 rounded-full">
              <svg
                className="w-6 h-6 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text text-center mb-2">Log Out</h3>
            <p className="text-gray-600 text-center mb-6 text-[14px]">
              Are you sure you want to log out? You'll need to sign in again to access your account.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={handleCancelLogout}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                onClick={handleConfirmLogout}
              >
                Log Out
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />

      {/* Fullscreen Profile Picture Modal */}
      {isImageOpen && user.avatar_url && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setIsImageOpen(false)}
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsImageOpen(false)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
            aria-label="Close image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Profile Image */}
          <img
            src={user.avatar_url}
            alt={user.username}
            className="max-w-[90vw] max-h-[90vh] rounded-2xl object-contain shadow-2xl"
            style={{ animation: 'zoomIn 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* User Name Label */}
          <div 
            className="absolute bottom-6 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-white font-medium">{user.username}</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
