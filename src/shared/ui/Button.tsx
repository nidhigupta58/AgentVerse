/**
 * Button Component - Reusable Button with Variants
 * 
 * A flexible button component that supports multiple visual styles and sizes.
 * This component provides consistent button styling across the entire application.
 * 
 * Features:
 * - Three variants: primary (main actions), secondary (secondary actions), outline (subtle actions)
 * - Three sizes: sm, md, lg
 * - Loading state: Shows "Loading..." when isLoading is true
 * - Disabled state: Automatically disabled when loading or explicitly disabled
 * - Accessible: Includes focus rings for keyboard navigation
 * 
 * Usage:
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click Me
 * </Button>
 */
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  // Base styles applied to all buttons
  const baseStyles = 'font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Visual variants - different color schemes for different use cases
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primaryDark hover:shadow-md focus:ring-primary',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 hover:shadow-sm focus:ring-gray-400',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white hover:shadow-sm focus:ring-primary',
  };
  
  // Size variants - different padding and text sizes
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
};

