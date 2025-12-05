import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import type { UserRole } from '@/types/database';

interface NavbarProps {
  role?: UserRole;
}

export default function Navbar({ role }: NavbarProps = {}) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(role || null);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    // If role prop is provided, use it
    if (role) {
      setIsLoggedIn(true);
      setUserRole(role);
      return;
    }

    // Otherwise check localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setIsLoggedIn(true);
      setUserRole(user.role);
      return;
    }

    const panelSession = localStorage.getItem('panelSession');
    if (panelSession) {
      setIsLoggedIn(true);
      setUserRole('panel');
    }
  }, [router.pathname, role]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('panelSession');
    setIsLoggedIn(false);
    setUserRole(null);
    router.push('/');
    setShowMobileMenu(false);
  };

  const getRoleDashboard = () => {
    switch (userRole) {
      case 'master_admin':
        return '/master-admin';
      case 'volunteer':
        return '/volunteer';
      case 'verification_staff':
        return '/verification-staff';
      case 'panel':
        return '/panel-dashboard';
      default:
        return '/';
    }
  };

  return (
    <nav className="bg-primary-600 text-white shadow-lg sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Safe area background for notch/status bar */}
      <div className="absolute inset-x-0 top-0 bg-primary-600" style={{ height: 'env(safe-area-inset-top, 0px)' }} />
      <div className="container mx-auto px-4" style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))', paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))' }}>
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo and Title */}
          <Link href="/" className="flex items-center space-x-2 md:space-x-3 hover:opacity-90 transition">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full p-1 md:p-2 flex items-center justify-center shadow-lg">
              <Image
                src="/christunifavcion.png"
                alt="Christ University"
                width={48}
                height={48}
                className="w-full h-full object-contain"
                unoptimized
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base md:text-xl font-bold leading-tight">Christ University</h1>
              <p className="text-xs text-tertiary-200">AUTH - Office of Admissions</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-base font-bold">AUTH</h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <Link
                  href={getRoleDashboard()}
                  className="px-4 py-2 hover:bg-primary-700 rounded-lg transition flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="capitalize">{userRole} Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 bg-tertiary-600 hover:bg-tertiary-700 rounded-lg transition flex items-center space-x-2 font-semibold shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowLoginDropdown(!showLoginDropdown)}
                  className="px-6 py-2 bg-tertiary-600 hover:bg-tertiary-700 rounded-lg transition font-semibold shadow-md active:scale-95"
                >
                  Login
                </button>

                {/* Login Dropdown */}
                {showLoginDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl py-2 text-gray-800 border border-gray-100">
                    <div className="px-4 py-3 text-xs text-gray-500 font-semibold border-b border-gray-100">
                      Select Your Role
                    </div>
                    <Link
                      href="/login?role=master_admin"
                      className="block px-4 py-3 hover:bg-primary-50 transition flex items-center space-x-3"
                      onClick={() => setShowLoginDropdown(false)}
                    >
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Master Admin</span>
                    </Link>
                    <Link
                      href="/login?role=volunteer"
                      className="block px-4 py-3 hover:bg-primary-50 transition flex items-center space-x-3"
                      onClick={() => setShowLoginDropdown(false)}
                    >
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      <span>Volunteer</span>
                    </Link>
                    <Link
                      href="/login?role=verification_staff"
                      className="block px-4 py-3 hover:bg-primary-50 transition flex items-center space-x-3"
                      onClick={() => setShowLoginDropdown(false)}
                    >
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Verification Staff</span>
                    </Link>
                    <Link
                      href="/panel-login"
                      className="block px-4 py-3 hover:bg-primary-50 transition flex items-center space-x-3 border-t border-gray-100"
                      onClick={() => setShowLoginDropdown(false)}
                    >
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Interview Panel</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 hover:bg-primary-700 rounded-lg transition"
          >
            {showMobileMenu ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden pb-4 space-y-2">
            {isLoggedIn ? (
              <>
                <Link
                  href={getRoleDashboard()}
                  className="block w-full px-4 py-3 hover:bg-primary-700 rounded-lg transition flex items-center space-x-3"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="capitalize">{userRole} Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 bg-tertiary-600 hover:bg-tertiary-700 rounded-lg transition flex items-center space-x-3 font-semibold"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <div className="px-4 py-2 text-xs text-tertiary-200 font-semibold">
                  Select Your Role
                </div>
                <Link
                  href="/login?role=master_admin"
                  className="block w-full px-4 py-3 hover:bg-primary-700 rounded-lg transition flex items-center space-x-3"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Master Admin</span>
                </Link>
                <Link
                  href="/login?role=volunteer"
                  className="block w-full px-4 py-3 hover:bg-primary-700 rounded-lg transition flex items-center space-x-3"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span>Volunteer</span>
                </Link>
                <Link
                  href="/login?role=verification_staff"
                  className="block w-full px-4 py-3 hover:bg-primary-700 rounded-lg transition flex items-center space-x-3"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Verification Staff</span>
                </Link>
                <Link
                  href="/panel-login"
                  className="block w-full px-4 py-3 hover:bg-primary-700 rounded-lg transition flex items-center space-x-3 border-t border-primary-500"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Interview Panel</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
