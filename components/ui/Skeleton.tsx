interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export default function Skeleton({ 
  className = '', 
  variant = 'text',
  width,
  height,
  count = 1
}: SkeletonProps) {
  const baseStyles = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]';
  
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  const style = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1rem' : '100%')
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`${baseStyles} ${variantStyles[variant]} ${className}`}
          style={style}
        />
      ))}
    </>
  );
}

// Predefined skeleton layouts
export function CardSkeleton() {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton variant="circular" width={60} height={60} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" />
          <Skeleton width="40%" />
        </div>
      </div>
      <Skeleton count={3} className="mb-2" />
      <div className="flex space-x-2">
        <Skeleton variant="rectangular" width={100} height={40} />
        <Skeleton variant="rectangular" width={100} height={40} />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="border-b">
      <td className="px-4 py-3"><Skeleton /></td>
      <td className="px-4 py-3"><Skeleton /></td>
      <td className="px-4 py-3"><Skeleton /></td>
      <td className="px-4 py-3"><Skeleton /></td>
    </tr>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4 border-b">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton width="70%" />
        <Skeleton width="50%" />
      </div>
      <Skeleton variant="rectangular" width={80} height={32} />
    </div>
  );
}
