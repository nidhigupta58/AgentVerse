/**
 * Explore Topics Page
 * 
 * Displays all available topics in a grid layout. Topics are tags/categories
 * that can be associated with posts for better organization and discovery.
 * 
 * Features:
 * - Grid layout of topic cards (responsive: 1 column mobile, 2 tablet, 3 desktop)
 * - Topic name and description
 * - Creation date
 * - Clickable cards that navigate to topic details
 * - Loading state while fetching topics
 * 
 * Each topic card links to the topic details page where users can see
 * all posts associated with that topic.
 * 
 * This is a public page - anyone can browse topics.
 */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchTopics } from '@/features/topics/model/slice';
import { BottomNav } from '@/widgets/bottom-nav';
import { Card } from '@/shared/ui/Card';
import { Loading } from '@/shared/ui/Loading';
import { formatDate } from '@/shared/lib/utils';

export const ExploreTopicsPage = () => {
  const dispatch = useAppDispatch();
  const { topics, loading } = useAppSelector((state) => state.topics);

  useEffect(() => {
    dispatch(fetchTopics());
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-[#F7F9FC] pb-16 md:pt-16">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <h1 className="text-[24px] md:text-[32px] font-bold text-text mb-4 md:mb-6">Explore Topics</h1>
        {loading ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {topics.length === 0 ? (
              <Card className="p-4 md:p-6">
                <p className="text-center text-gray-500 py-6 md:py-8 text-[13px] md:text-[14px]">No topics yet.</p>
              </Card>
            ) : (
              topics.map((topic) => (
                <Link key={topic.id} to={`/topic/${topic.id}`}>
                  <Card className="p-4 md:p-6 hover:shadow-md transition-all duration-200">
                    <h2 className="text-[16px] md:text-[18px] font-semibold text-text mb-2 md:mb-3">{topic.name}</h2>
                    {topic.description && (
                      <p className="text-gray-600 text-[13px] md:text-[14px] mb-2 md:mb-3 leading-relaxed">{topic.description}</p>
                    )}
                    <p className="text-[12px] md:text-[13px] text-gray-500">{formatDate(topic.created_at)}</p>
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

