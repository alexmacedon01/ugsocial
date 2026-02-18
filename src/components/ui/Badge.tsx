type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/20 text-text-secondary border border-white/20 backdrop-blur-sm',
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 backdrop-blur-sm',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20 backdrop-blur-sm',
  danger: 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/20 backdrop-blur-sm',
  info: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/20 backdrop-blur-sm',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
