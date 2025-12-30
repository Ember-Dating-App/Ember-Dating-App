import { Check, BadgeCheck } from 'lucide-react';

export default function VerifiedBadge({ className = 'w-5 h-5', size = 'md' }) {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
    xl: 'w-8 h-8'
  };

  const iconSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4'
  };

  return (
    <div 
      className={`${className || sizeClasses[size]} relative flex items-center justify-center flex-shrink-0`}
      title="Verified Profile"
    >
      {/* Outer glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 blur-sm opacity-40" />
      
      {/* Main badge */}
      <div className="relative w-full h-full rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30 ring-2 ring-white/20">
        <Check 
          className={iconSizes[size] || 'w-3 h-3'} 
          strokeWidth={3.5} 
          className="text-white drop-shadow-sm"
        />
      </div>
    </div>
  );
}
