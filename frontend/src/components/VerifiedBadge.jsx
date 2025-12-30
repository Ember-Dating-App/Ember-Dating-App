import { Check } from 'lucide-react';

export default function VerifiedBadge({ className = "w-6 h-6" }) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Blue circle background */}
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        className="w-full h-full"
      >
        {/* Outer badge shape */}
        <path
          d="M12 2L14.5 4.5L17.5 4L19 6.5L21.5 7L22 10L24 12L22 14L21.5 17L19 17.5L17.5 20L14.5 19.5L12 22L9.5 19.5L6.5 20L5 17.5L2.5 17L2 14L0 12L2 10L2.5 7L5 6.5L6.5 4L9.5 4.5L12 2Z"
          fill="#3B82F6"
          className="drop-shadow-md"
        />
      </svg>
      {/* White checkmark */}
      <Check className="absolute w-3/5 h-3/5 text-white stroke-[3]" strokeLinecap="round" strokeLinejoin="round" />
    </div>
  );
}
