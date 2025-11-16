import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/shared/lib/hooks';
import { fetchTopics } from '@/features/topics/model/slice';
import { Navbar } from '@/widgets/navbar';
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-text mb-6">Explore Topics</h1>
        {loading ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.length === 0 ? (
              <Card>
                <p className="text-center text-gray-500 py-8">No topics yet.</p>
              </Card>
            ) : (
              topics.map((topic) => (
                <Link key={topic.id} to={`/topic/${topic.id}`}>
                  <Card>
                    <h2 className="text-xl font-semibold text-text mb-2">{topic.name}</h2>
                    {topic.description && (
                      <p className="text-gray-600 text-sm mb-2">{topic.description}</p>
                    )}
                    <p className="text-xs text-gray-500">{formatDate(topic.created_at)}</p>
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

