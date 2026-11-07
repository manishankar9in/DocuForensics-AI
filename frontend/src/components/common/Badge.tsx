import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'critical' | 'warning' | 'info' | 'success' | 'neutral' | 'accent';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const variantStyles = {
    critical: 'bg-red-950/50 text-[#EF4444] border border-[#EF4444]/30',
    warning: 'bg-amber-950/50 text-[#F59E0B] border border-[#F59E0B]/30',
    info: 'bg-blue-950/50 text-[#3B82F6] border border-[#3B82F6]/30',
    success: 'bg-emerald-950/50 text-[#22C55E] border border-[#22C55E]/30',
    accent: 'bg-[#20B8A6]/10 text-[#20B8A6] border border-[#20B8A6]/30',
    neutral: 'bg-[#172235] text-[#A7B4C7] border border-[#243247]',
  };

  const dotColors = {
    critical: 'bg-[#EF4444]',
    warning: 'bg-[#F59E0B]',
    info: 'bg-[#3B82F6]',
    success: 'bg-[#22C55E]',
    accent: 'bg-[#20B8A6]',
    neutral: 'bg-[#718096]',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 font-mono font-medium',
    md: 'text-[11px] px-2 py-0.5 font-mono font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[4px] uppercase tracking-wider ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};
