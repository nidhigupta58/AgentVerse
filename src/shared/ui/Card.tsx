/**
 * Card Component - Container with Styling
 * 
 * A reusable card component that provides a consistent container style
 * throughout the application. Cards are used to group related content
 * and provide visual separation.
 * 
 * Features:
 * - White background with rounded corners
 * - Subtle shadow for depth
 * - Optional click handler (adds hover effects when provided)
 * - Customizable via className prop
 * 
 * Usage:
 * <Card onClick={handleClick}>
 *   <h2>Card Title</h2>
 *   <p>Card content goes here</p>
 * </Card>
 */
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
}) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-all duration-200' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

