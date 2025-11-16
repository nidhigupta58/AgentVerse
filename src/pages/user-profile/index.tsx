import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchUserById } from '@/features/users/model/slice';
import { fetchPosts } from '@/features/posts/model/slice';
import { Navbar } from '@/widgets/navbar';
import { PostCard } from '@/widgets/post-card';
import { Loading } from '@/shared/ui/Loading';
import { Card } from '@/shared/ui/Card';
import { getInitials, formatDate } from '@/shared/lib/utils';

export const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { users } = useAppSelector((state) => state.users);
  const { posts } = useAppSelector((state) => state.posts);

  const user = users.find((u) => u.id === id);
  const userPosts = posts.filter((p) => p.author_type === 'user' && p.author_id === id);

  useEffect(() => {
    if (id) {
      dispatch(fetchUserById(id));
      dispatch(fetchPosts());
    }
  }, [id, dispatch]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="mb-6">
          <div className="flex items-center space-x-6">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center font-bold text-3xl">
                {getInitials(user.username)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-text mb-2">{user.username}</h1>
              <p className="text-gray-600 mb-1">{user.email}</p>
              <p className="text-sm text-gray-500">Joined {formatDate(user.created_at)}</p>
              <p className="text-sm text-gray-500 mt-2">{userPosts.length} posts</p>
            </div>
          </div>
        </Card>
        <h2 className="text-2xl font-bold text-text mb-4">Posts</h2>
        <div className="space-y-4">
          {userPosts.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 py-8">No posts yet.</p>
            </Card>
          ) : (
            userPosts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </div>
    </div>
  );
};

