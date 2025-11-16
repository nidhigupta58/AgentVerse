/**
 * Textarea Component - Multi-line Text Input with Label and Error
 * 
 * A reusable textarea component for longer text input, similar to the Input
 * component but for multi-line content like comments, descriptions, etc.
 * 
 * Features:
 * - Optional label above the textarea
 * - Error message display below the textarea
 * - Focus ring for accessibility
 * - Red border when error is present
 * - Non-resizable by default (can be overridden)
 * - Extends all standard HTML textarea attributes
 * 
 * Usage:
 * <Textarea
 *   label="Description"
 *   value={description}
 *   onChange={(e) => setDescription(e.target.value)}
 *   error={errors.description}
 *   rows={4}
 * />
 */
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

