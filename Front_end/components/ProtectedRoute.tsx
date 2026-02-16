// Updated ProtectedRoute component with working menu toggle
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
  showHeader?: boolean;
  showSidebar?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  redirectTo = '/auth/signin',
  showHeader = true,
  showSidebar = true,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ name?: string; email?: string; role?: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();

        if (!response.ok || !data.authenticated) {
          router.push(redirectTo);
          return;
        }

        if (requireAdmin && data.user?.role !== 'admin') {
          router.push('/dashboard');
          return;
        }

        setUser(data.user);
        setIsAuthorized(true);
      } catch (error) {
        router.push(redirectTo);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [router, requireAdmin, redirectTo]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth/signin');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Securing your session...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we verify your credentials</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50">
      {/* Header - Full Width */}
      {showHeader && (
        <header className="bg-white shadow-sm border-b border-gray-200 w-full">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                {/* Menu Toggle Button - Always visible */}
                <button
                  onClick={toggleSidebar}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition mr-4"
                  aria-label="Toggle menu"
                >
                  <svg 
                    className="h-6 w-6" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    {sidebarOpen ? (
                      // X icon when sidebar is open (for mobile)
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      // Hamburger icon when sidebar is closed
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
                
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Raining Grace Funeral Parlour</h1>
                  <p className="text-xs sm:text-sm text-gray-600"></p>
                </div>
              </div>

              <div className="flex items-center space-x-3 sm:space-x-6">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-gray-700">Welcome, Admin</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold text-sm sm:text-base">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Overlay for Mobile */}
        {showSidebar && sidebarOpen && isMobile && (
          <div
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed lg:relative inset-y-0 left-0 z-50 
            w-64 bg-white shadow-lg 
            transform transition-transform duration-300 ease-in-out
            ${showSidebar ? 'flex' : 'hidden'}
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:invisible'}
          `}
          style={{ 
            top: showHeader ? '73px' : '0', 
            height: showHeader ? 'calc(100vh - 73px)' : '100vh' 
          }}
        >
          <div className="h-full flex flex-col overflow-y-auto p-4 sm:p-6">
            {/* Navigation */}
            <div className="mb-8">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
                MAIN NAVIGATION
              </h2>
              <div className="space-y-1">
                <NavItem 
                  href="/admin/dashboard" 
                  icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  currentPath={pathname}
                  onClick={() => isMobile && setSidebarOpen(false)}
                >
                  Dashboard
                </NavItem>
                
                <NavItem 
                  href="/admin/groups" 
                  icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  currentPath={pathname}
                  onClick={() => isMobile && setSidebarOpen(false)}
                >
                  Groups
                </NavItem>
                
                <NavItem 
                  href="/admin/members" 
                  icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13 0A6 6 0 0121 20"
                  currentPath={pathname}
                  onClick={() => isMobile && setSidebarOpen(false)}
                >
                  Members
                </NavItem>
                
                <NavItem 
                  href="/admin/payments" 
                  icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  currentPath={pathname}
                  onClick={() => isMobile && setSidebarOpen(false)}
                >
                  Payments
                </NavItem>
                
                <NavItem 
                  href="/admin/reminders" 
                  icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  currentPath={pathname}
                  onClick={() => isMobile && setSidebarOpen(false)}
                >
                  Reminders
                </NavItem>
                
                <NavItem 
                  href="/admin/reports" 
                  icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  currentPath={pathname}
                  onClick={() => isMobile && setSidebarOpen(false)}
                >
                  Reports
                </NavItem>
              </div>
            </div>

            {/* Settings Section */}
            <div className="mt-auto">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
                SETTINGS
              </h2>
              <div className="space-y-1">
                <NavItem 
                  href="/admin/settings" 
                  icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  currentPath={pathname}
                  onClick={() => isMobile && setSidebarOpen(false)}
                >
                  Settings
                </NavItem>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main 
          className={`
            flex-1 overflow-auto transition-all duration-300
            ${showSidebar && sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}
          `}
        >
          <div className="w-full h-full p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Updated NavItem component
function NavItem({ 
  href, 
  icon, 
  children,
  currentPath,
  onClick
}: { 
  href: string; 
  icon: string; 
  children: React.ReactNode;
  currentPath: string;
  onClick?: () => void;
}) {
  const router = useRouter();
  const isActive = currentPath === href || currentPath?.startsWith(href + '/');

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(href);
    if (onClick) onClick();
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
        isActive
          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <svg className={`h-5 w-5 mr-3 ${isActive ? 'text-white' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
      </svg>
      <span className="font-medium text-sm flex-1">{children}</span>
    </a>
  );
}