/**
 * Input Component - Text Input Field with Label and Error
 * 
 * A reusable input component that provides consistent styling and behavior
 * for text inputs throughout the application.
 * 
 * Features:
 * - Optional label above the input
 * - Error message display below the input
 * - Focus ring for accessibility
 * - Red border when error is present
 * - Password visibility toggle for password fields
 * - Modern focus effects with glow and scale
 * - Extends all standard HTML input attributes
 * 
 * Usage:
 * <Input
 *   label="Email"
 *   type="email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 *   error={errors.email}
 * />
 */
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: 'default' | 'glass-dark';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  type,
  variant = 'default',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isPasswordField = type === 'password';
  const inputType = isPasswordField && showPassword ? 'text' : type;

  // Variant styles
  const isDark = variant === 'glass-dark';
  
  const labelStyles = isDark 
    ? `text-gray-300 ${isFocused ? 'text-blue-400' : ''}`
    : `text-gray-700 ${isFocused ? 'text-purple-600' : ''}`;

  const inputStyles = isDark
    ? `bg-black/20 border-white/10 text-white placeholder:text-white/30
       focus:bg-black/40 focus:border-blue-500/50 focus:ring-blue-500/20`
    : `bg-white/80 border-gray-200 text-gray-900 placeholder:text-gray-400
       focus:bg-white focus:border-purple-500 focus:ring-purple-100`;

  const iconStyles = isDark
    ? `text-white/40 hover:text-blue-400`
    : `text-gray-400 hover:text-purple-600`;

  return (
    <div className="w-full">
      {label && (
        <label className={`block text-sm font-semibold mb-2 transition-colors duration-200 ${labelStyles}`}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={inputType}
          className={`w-full px-4 py-3 border-2 rounded-xl backdrop-blur-sm
            transition-all duration-300 ease-out
            focus:outline-none focus:scale-[1.02] focus:ring-4
            ${error 
              ? 'border-red-400 focus:border-red-500 focus:ring-red-100' 
              : inputStyles
            } 
            ${isPasswordField ? 'pr-12' : ''} 
            ${className}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 
              focus:outline-none transition-all duration-200 hover:scale-110 active:scale-95 ${iconStyles}`}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium animate-shake">{error}</p>
      )}
    </div>
  );
};

