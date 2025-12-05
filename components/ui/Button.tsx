import { forwardRef, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

// Exclude React event handlers that conflict with Framer Motion
interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 
  'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-4 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';
    
    const variantStyles = {
      primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-300 shadow-md hover:shadow-lg',
      secondary: 'bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 focus:ring-gray-200',
      tertiary: 'bg-tertiary-600 hover:bg-tertiary-700 text-white focus:ring-tertiary-300 shadow-md hover:shadow-lg',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-300 shadow-md hover:shadow-lg',
      outline: 'bg-transparent hover:bg-primary-50 text-primary-600 border-2 border-primary-600 focus:ring-primary-300',
      ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-200'
    };
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-6 py-3.5 text-lg'
    };
    
    const widthStyle = fullWidth ? 'w-full' : '';
    
    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`;
    
    return (
      <motion.button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || isLoading}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
