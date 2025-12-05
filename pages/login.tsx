import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Button, Input, Card } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { validateRequired } from '@/lib/utils';

export default function Login() {
  const router = useRouter();
  const { role, panel } = router.query;
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    username: (panel as string) || '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    if (role === 'panel') {
      const panelValue = typeof panel === 'string' ? panel.trim() : '';
      const target = panelValue ? `/panel-login?panel=${encodeURIComponent(panelValue)}` : '/panel-login';
      router.replace(target);
    }
  }, [panel, role, router]);

  const getRoleTitle = () => {
    switch (role) {
      case 'master_admin':
        return 'Master Admin';
      case 'volunteer':
        return 'Volunteer';
      case 'verification_staff':
        return 'Verification Staff';
      case 'panel':
        return panel ? `Panel - ${panel}` : 'Interview Panel';
      default:
        return 'Staff';
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'master_admin':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'volunteer':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        );
      case 'floor_coordinator':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'panel':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    const usernameValidation = validateRequired(formData.username, 'Username');
    if (!usernameValidation.isValid) {
      newErrors.username = usernameValidation.error || '';
    }
    
    if (role !== 'panel') {
      const passwordValidation = validateRequired(formData.password, 'Password');
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.error || '';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    if (role === 'panel') {
      const targetPanel = formData.username.trim();
      const panelPath = targetPanel ? `/panel-login?panel=${encodeURIComponent(targetPanel)}` : '/panel-login';
      router.push(panelPath);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          role: role as string,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      
      showToast(`Welcome back, ${data.user.full_name || data.user.username}!`, 'success');

      // Small delay to show the success message
      setTimeout(() => {
        // Redirect to appropriate dashboard
        switch (data.user.role) {
          case 'master_admin':
            router.push('/master-admin');
            break;
          case 'volunteer':
            router.push('/volunteer');
            break;
          case 'floor_coordinator':
            router.push('/floor-coordinator');
            break;
          case 'panel':
            router.push('/panel-dashboard');
            break;
          default:
            router.push('/');
        }
      }, 500);
    } catch (err: any) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (role === 'panel') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center px-4 py-8">
        <p className="text-white text-sm font-medium">Redirecting to panel login…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center px-3 sm:px-4 py-6 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl">
          {/* Logo and Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="mb-4 sm:mb-6 flex justify-center">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-primary-600 tracking-wider">AUTH</h2>
                <div className="h-8 w-px bg-gray-300"></div>
                <div className="text-left">
                  <p className="text-xs text-gray-500 leading-tight">Office of</p>
                  <p className="text-sm font-semibold text-gray-700 leading-tight">Admissions</p>
                </div>
              </div>
            </div>
            
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto bg-primary-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg text-white"
            >
              {getRoleIcon()}
            </motion.div>
            
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
              {getRoleTitle()} Login
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base">
              Enter your credentials to access the system
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <Input
              label="Username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              placeholder="Enter your username"
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              required
            />

            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Enter your password"
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
                required={role !== 'panel'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] sm:top-[42px] p-1 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              leftIcon={
                !isSubmitting ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                ) : undefined
              }
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center space-x-2 mx-auto transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </button>
          </div>

          {/* Powered by Socio */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col items-center">
            <p className="text-[10px] text-gray-400 mb-1">Powered by</p>
            <Image
              src="/socio.png"
              alt="Socio"
              width={70}
              height={26}
              className="object-contain opacity-60 hover:opacity-100 transition-opacity"
              unoptimized
            />
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
