import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'default';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = ''
}: BadgeProps) {
  const variantStyles = {
    success: 'bg-green-100 text-green-800 border-green-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  const dotColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
    default: 'bg-gray-500'
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span className={`w-2 h-2 rounded-full ${dotColors[variant]} mr-1.5`} />
      )}
      {children}
    </span>
  );
}

// Status-specific badges
export function StatusBadge({ status }: { status: 'approved' | 'pending' | 'rejected' | 'revoked' }) {
  const statusConfig = {
    approved: { variant: 'success' as const, label: 'Approved', dot: true },
    pending: { variant: 'warning' as const, label: 'Pending', dot: true },
    rejected: { variant: 'error' as const, label: 'Rejected', dot: true },
    revoked: { variant: 'error' as const, label: 'Revoked', dot: true }
  };

  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant} dot={config.dot}>
      {config.label}
    </Badge>
  );
}

// Category badges for visitors
export function CategoryBadge({ category }: { category: 'student' | 'speaker' | 'vip' }) {
  const categoryConfig = {
    student: { label: 'Student', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    speaker: { label: 'Speaker', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    vip: { label: 'VIP', color: 'bg-purple-100 text-purple-800 border-purple-200' }
  };

  const config = categoryConfig[category];
  
  return (
    <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full border ${config.color}`}>
      {config.label}
    </span>
  );
}
