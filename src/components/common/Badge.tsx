import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'purple' | 'cyan' | 'amber' | 'emerald' | 'rose' | 'zinc';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'purple',
  size = 'md',
  className = ''
}) => {
  const variantStyles = {
    purple: 'bg-spark-500/10 text-spark-300 border-spark-500/20',
    cyan: 'bg-accent-cyan/10 text-cyan-300 border-accent-cyan/20',
    amber: 'bg-accent-amber/10 text-amber-300 border-accent-amber/20',
    emerald: 'bg-accent-emerald/10 text-emerald-300 border-accent-emerald/20',
    rose: 'bg-accent-rose/10 text-rose-300 border-accent-rose/20',
    zinc: 'bg-zinc-800 text-zinc-300 border-zinc-700'
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1'
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
};
