import { forwardRef, InputHTMLAttributes, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showCharCount?: boolean;
  maxLength?: number;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      showCharCount = false,
      maxLength,
      className = '',
      type = 'text',
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = useState(0);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (showCharCount) {
        setCharCount(e.target.value.length);
      }
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label className="label flex items-center justify-between">
            <span>{label}</span>
            {showCharCount && maxLength && (
              <span className="text-xs text-gray-500">
                {charCount}/{maxLength}
              </span>
            )}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none flex items-center justify-center w-5 h-5">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            type={type}
            value={value}
            onChange={handleChange}
            maxLength={maxLength}
            className={`input-field ${error ? 'error' : ''} ${
              leftIcon ? 'pl-11' : ''
            } ${rightIcon ? 'pr-11' : ''} ${className}`}
            autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'off'}
            autoCapitalize={type === 'email' || type === 'password' ? 'none' : 'sentences'}
            autoCorrect={type === 'email' || type === 'password' ? 'off' : 'on'}
            spellCheck={type === 'email' || type === 'password' ? false : true}
            inputMode={type === 'email' ? 'email' : type === 'tel' ? 'tel' : type === 'number' ? 'numeric' : 'text'}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
          
          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
        </div>
        
        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
        
        {!error && helperText && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
