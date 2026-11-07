import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
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
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors rounded-[8px] select-none focus:outline-none focus:ring-1 focus:ring-[#20B8A6] disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary:
      'bg-[#20B8A6] hover:bg-[#1DA595] text-white shadow-sm border border-[#20B8A6]/50',
    secondary:
      'bg-[#172235] hover:bg-[#1A263B] text-[#F1F5F9] border border-[#243247]',
    outline:
      'border border-[#243247] hover:border-[#334661] bg-[#121B29] text-[#F1F5F9] hover:bg-[#172235]',
    danger:
      'bg-[#EF4444] hover:bg-red-600 text-white shadow-sm',
    ghost:
      'text-[#A7B4C7] hover:text-[#F1F5F9] hover:bg-[#172235]',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 h-[32px] gap-1.5',
    md: 'text-sm px-4 h-[38px] gap-2',
    lg: 'text-sm px-5 h-[44px] gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
