/**
 * Loading Component - Spinner Indicator
 * 
 * A simple loading spinner component used to indicate that content is being
 * fetched or an operation is in progress. The spinner uses a CSS animation
 * for smooth rotation.
 * 
 * Usage:
 * {isLoading ? <Loading /> : <Content />}
 */
import React from 'react';

export const Loading: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
};

