import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-deep shadow-sm border border-transparent',
  secondary: 'bg-surface text-ink border border-line hover:bg-canvas',
  danger: 'bg-danger text-white hover:bg-red-700 border border-transparent',
  ghost: 'bg-transparent text-muted hover:bg-canvas hover:text-ink border border-transparent',
};

const sizeClass: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3 text-base rounded-xl',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading,
  leftIcon,
  rightIcon,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150
      disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
      ${variantClass[variant]} ${sizeClass[size]} ${className}`}
    {...rest}
  >
    {loading ? (
      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    ) : (
      leftIcon
    )}
    {children}
    {!loading && rightIcon}
  </button>
);
