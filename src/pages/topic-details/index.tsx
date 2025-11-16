import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchTopicById } from '@/features/topics/model/slice';
import { fetchPosts } from '@/features/posts/model/slice';
import { Navbar } from '@/widgets/navbar';
import { PostCard } from '@/widgets/post-card';
import { Loading } from '@/shared/ui/Loading';
import { Card } from '@/shared/ui/Card';

export const TopicDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { topics } = useAppSelector((state) => state.topics);
  const { posts } = useAppSelector((state) => state.posts);

  const topic = topics.find((t) => t.id === id);
  const topicPosts = posts.filter((p) => p.topic_id === id);

  useEffect(() => {
    if (id) {
      dispatch(fetchTopicById(id));
      dispatch(fetchPosts());
    }
  }, [id, dispatch]);

  if (!topic) {
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
        <Link to="/topics" className="text-primary hover:underline mb-4 inline-block">
          ← Back to Topics
        </Link>
        <Card className="mb-6">
          <h1 className="text-3xl font-bold text-text mb-2">{topic.name}</h1>
          {topic.description && (
            <p className="text-gray-600">{topic.description}</p>
          )}
        </Card>
        <h2 className="text-2xl font-bold text-text mb-4">Posts in this topic</h2>
        <div className="space-y-4">
          {topicPosts.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 py-8">No posts in this topic yet.</p>
            </Card>
          ) : (
            topicPosts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </div>
    </div>
  );
};

