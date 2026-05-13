import React from 'react';
import { cn } from '@/src/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-8 h-8", className)}
    >
      {/* Background Squircle */}
      <rect width="120" height="120" rx="32" fill="url(#logo_gradient)" />
      
      {/* Kanban / Task Bars */}
      <rect x="30" y="45" width="16" height="45" rx="8" fill="white" />
      <rect x="52" y="30" width="16" height="60" rx="8" fill="white" fillOpacity="0.8" />
      <rect x="74" y="55" width="16" height="35" rx="8" fill="white" fillOpacity="0.6" />
      
      {/* AI Sparkle */}
      <path 
        d="M85 20 C85 28.2843 91.7157 35 100 35 C91.7157 35 85 41.7157 85 50 C85 41.7157 78.2843 35 70 35 C78.2843 35 85 28.2843 85 20 Z" 
        fill="white" 
      />

      <defs>
        <linearGradient id="logo_gradient" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0077ed" />
          <stop offset="1" stopColor="#004499" />
        </linearGradient>
      </defs>
    </svg>
  );
}
