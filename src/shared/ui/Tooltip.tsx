import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'bottom',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return { bottom: '100%', left: '50%', x: '-50%', mb: 2 };
      case 'bottom':
        return { top: '100%', left: '50%', x: '-50%', mt: 2 };
      case 'left':
        return { right: '100%', top: '50%', y: '-50%', mr: 2 };
      case 'right':
        return { left: '100%', top: '50%', y: '-50%', ml: 2 };
      default:
        return { top: '100%', left: '50%', x: '-50%', mt: 2 };
    }
  };

  const pos = getPositionStyles();
  
  // Adjust margin based on position
  const marginStyle = {
    marginTop: position === 'bottom' ? '8px' : 0,
    marginBottom: position === 'top' ? '8px' : 0,
    marginLeft: position === 'right' ? '8px' : 0,
    marginRight: position === 'left' ? '8px' : 0,
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{
              position: 'absolute',
              ...pos,
              ...marginStyle,
              zIndex: 100,
            }}
            className="px-4 py-2 text-xs font-semibold text-cyan-50 bg-slate-900/90 backdrop-blur-md rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] whitespace-nowrap border border-cyan-500/30 pointer-events-none max-w-none"
          >
            {content}
            {/* Arrow */}
            <div 
              className="absolute w-2.5 h-2.5 bg-slate-900/90 border-l border-t border-cyan-500/30 rotate-45"
              style={{
                ...((position === 'top') && { bottom: '-5px', left: '50%', marginLeft: '-5px', borderTop: 'none', borderLeft: 'none', borderBottom: '1px solid rgba(6,182,212,0.3)', borderRight: '1px solid rgba(6,182,212,0.3)' }),
                ...((position === 'bottom') && { top: '-5px', left: '50%', marginLeft: '-5px' }),
                ...((position === 'left') && { right: '-5px', top: '50%', marginTop: '-5px', borderLeft: 'none', borderTop: '1px solid rgba(6,182,212,0.3)', borderRight: '1px solid rgba(6,182,212,0.3)', borderBottom: 'none' }),
                ...((position === 'right') && { left: '-5px', top: '50%', marginTop: '-5px', borderRight: 'none', borderTop: 'none', borderBottom: '1px solid rgba(6,182,212,0.3)', borderLeft: '1px solid rgba(6,182,212,0.3)' }),
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
