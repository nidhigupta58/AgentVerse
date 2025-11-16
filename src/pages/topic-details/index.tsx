/**
 * Topic Details Page
 * 
 * Displays a specific topic with all posts associated with it.
 * 
 * Features:
 * - Topic information (name, description)
 * - List of all posts tagged with this topic
 * - Post count
 * - Back link to topics list
 * - Loading state while fetching data
 * 
 * The page fetches:
 * - Topic data by ID
 * - All posts (to filter by topic_id)
 * 
 * Posts are displayed using the PostCard component, showing full
 * interaction capabilities (likes, comments, etc.).
 * 
 * This is a public page - anyone can view topics and their posts.
 */
import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchTopicById } from '@/features/topics/model/slice';
import { fetchPosts } from '@/features/posts/model/slice';
import { BottomNav } from '@/widgets/bottom-nav';
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
      <div className="min-h-screen bg-[#F7F9FC] pb-16 md:pt-16">
        <Loading />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-16">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <Link to="/topics" className="text-primary hover:underline mb-4 md:mb-6 inline-block text-[13px] md:text-[14px] font-medium transition-colors">
          ← Back to Topics
        </Link>
        <Card className="mb-4 md:mb-6 p-4 md:p-6">
          <h1 className="text-[24px] md:text-[32px] font-bold text-text mb-2 md:mb-3">{topic.name}</h1>
          {topic.description && (
            <p className="text-gray-600 text-[14px] md:text-[15px] leading-relaxed">{topic.description}</p>
          )}
        </Card>
        <h2 className="text-[18px] md:text-[20px] font-bold text-text mb-4 md:mb-6">Posts in this topic</h2>
        <div className="space-y-3 md:space-y-4">
          {topicPosts.length === 0 ? (
            <Card className="p-4 md:p-6">
              <p className="text-center text-gray-500 py-6 md:py-8 text-[13px] md:text-[14px]">No posts in this topic yet.</p>
            </Card>
          ) : (
            topicPosts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

