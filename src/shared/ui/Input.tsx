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
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  type,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isPasswordField = type === 'password';
  const inputType = isPasswordField && showPassword ? 'text' : type;

  return (
    <div className="w-full">
      {label && (
        <label className={`block text-sm font-semibold mb-2 transition-colors duration-200 ${isFocused ? 'text-purple-600' : 'text-gray-700'}`}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={inputType}
          className={`w-full px-4 py-3 border-2 rounded-xl bg-white/80 backdrop-blur-sm
            transition-all duration-300 ease-out
            focus:outline-none focus:scale-[1.02] focus:bg-white
            ${error 
              ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
              : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100'
            } 
            ${isPasswordField ? 'pr-12' : ''} 
            ${className}
            placeholder:text-gray-400`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 
              focus:outline-none transition-all duration-200 hover:scale-110 active:scale-95"
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

