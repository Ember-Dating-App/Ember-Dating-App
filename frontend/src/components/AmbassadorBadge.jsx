import { Award } from 'lucide-react';

export default function AmbassadorBadge({ size = 'sm' }) {
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const iconSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0`}
      title="Ember Ambassador"
    >
      <Award className={`${iconSizes[size]} text-white`} strokeWidth={2.5} />
    </div>
  );
}
