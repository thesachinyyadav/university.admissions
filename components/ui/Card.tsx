import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  footer?: ReactNode;
  headerAction?: ReactNode;
  variant?: 'default' | 'bordered' | 'elevated' | 'gradient';
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export default function Card({
  children,
  title,
  subtitle,
  footer,
  headerAction,
  variant = 'default',
  className = '',
  onClick,
  hoverable = false
}: CardProps) {
  const variantStyles = {
    default: 'card',
    bordered: 'card border-2 border-primary-200',
    elevated: 'card shadow-xl',
    gradient: 'card bg-gradient-to-br from-primary-50 to-white'
  };

  const hoverStyles = hoverable || onClick ? 'cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all' : '';

  return (
    <motion.div
      className={`${variantStyles[variant]} ${hoverStyles} ${className}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100">
          <div className="flex-1">
            {title && (
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-1">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
          {headerAction && (
            <div className="ml-4">{headerAction}</div>
          )}
        </div>
      )}
      
      <div>{children}</div>
      
      {footer && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {footer}
        </div>
      )}
    </motion.div>
  );
}

// Quick Action Card for Dashboards
export function QuickActionCard({
  icon,
  title,
  description,
  onClick,
  badge,
  className = ''
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  onClick?: () => void;
  badge?: string | number;
  className?: string;
}) {
  return (
    <motion.div
      className={`card cursor-pointer hover:shadow-lg transition-all hover:scale-105 relative ${className}`}
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      {badge !== undefined && (
        <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {badge}
        </div>
      )}
      
      <div className="flex flex-col items-center text-center p-3 sm:p-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-3 text-primary-600">
          {icon}
        </div>
        <h4 className="font-bold text-gray-800 mb-1.5 text-sm sm:text-base">{title}</h4>
        {description && (
          <p className="text-xs sm:text-sm text-gray-600 leading-snug">{description}</p>
        )}
      </div>
    </motion.div>
  );
}

// Stats Card for Analytics
export function StatsCard({
  title,
  value,
  change,
  trend,
  icon,
  className = ''
}: {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down';
  icon: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <h3 className="text-2xl md:text-3xl font-bold text-gray-800">
            {value}
          </h3>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trend === 'up' && (
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              )}
              {trend === 'down' && (
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              )}
              <span className="font-medium">{change}</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
          {icon}
        </div>
      </div>
    </div>
  );
}
