'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ name?: string; email?: string; role?: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
          <div className="px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-800">Stokvel Management</h1>
                  <p className="text-sm text-gray-600">Admin Dashboard</p>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-gray-700">Welcome, Admin</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Full Height */}
        {showSidebar && (
          <>
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              ></div>
            )}

            {/* Sidebar */}
            <div
              className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
              style={{ top: showHeader ? '76px' : '0', height: showHeader ? 'calc(100vh - 76px)' : '100vh' }}
            >
              <div className="h-full flex flex-col overflow-y-auto p-6">
                {/* Navigation */}
                <div className="mb-8">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">MAIN NAVIGATION</h2>
                  <div className="space-y-2">
                    <NavItem href="/admin/dashboard" icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" isActive>
                      Dashboard
                    </NavItem>
                    
                    <NavItem href="/admin/groups" icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4">
                      Groups
                    </NavItem>
                    
                    <NavItem href="/admin/members" icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13 0A6 6 0 0121 20">
                      Members
                      <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                        45
                      </span>
                    </NavItem>
                    
                    <NavItem href="/admin/payments" icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z">
                      Payments
                      <span className="ml-auto bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-1 rounded-full">
                        12
                      </span>
                    </NavItem>
                    
                    <NavItem href="/admin/reminders" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z">
                      Reminders
                    </NavItem>
                    
                    <NavItem href="/admin/reports" icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z">
                      Reports
                    </NavItem>
                  </div>
                </div>

                <div>
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">SETTINGS</h2>
                  <div className="space-y-2">
                    <NavItem href="/admin/settings" icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z">
                      Settings
                    </NavItem>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Main Content - Full Width & Height */}
        <main className={`flex-1 overflow-auto ${showSidebar ? 'lg:ml-64' : ''}`}>
          <div className="w-full h-full">
            {/* Stats Section - Full Width */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-8 shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-medium text-blue-800 mb-2">Total Members</h3>
                      <p className="text-4xl font-bold text-blue-900">45</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                      <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center text-lg">
                    <span className="text-green-600 font-bold">+12%</span>
                    <span className="text-gray-600 ml-3">from last month</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-2xl p-8 shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-medium text-yellow-800 mb-2">Pending Payments</h3>
                      <p className="text-4xl font-bold text-yellow-900">R12,451</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                      <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-red-100 text-red-800 text-lg font-bold px-4 py-2 rounded-full">3 overdue</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-8 shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-medium text-green-800 mb-2">Total Collected</h3>
                      <p className="text-4xl font-bold text-green-900">R45,200</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                      <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center text-lg">
                    <span className="text-green-600 font-bold">+18%</span>
                    <span className="text-gray-600 ml-3">growth this month</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-8 shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-medium text-purple-800 mb-2">Active Groups</h3>
                      <p className="text-4xl font-bold text-purple-900">3</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                      <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-green-100 text-green-800 text-lg font-bold px-4 py-2 rounded-full">All active</span>
                  </div>
                </div>
              </div>

              {/* Welcome Banner - Full Width */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-10 shadow-lg">
                  <h1 className="text-4xl font-bold text-white mb-4">Welcome to Stokvel Management</h1>
                  <p className="text-blue-100 text-xl">Manage your savings groups, members, and payments in one place.</p>
                </div>
              </div>

              {/* Main Content Area - Full Width */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
                <div className="p-8">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Reusable Components
function NavItem({ 
  href, 
  icon, 
  children,
  isActive = false
}: { 
  href: string; 
  icon: string; 
  children: React.ReactNode;
  isActive?: boolean;
}) {
  const router = useRouter();
  const active = isActive || router.pathname === href;

  return (
    <a
      href={href}
      className={`flex items-center px-5 py-4 rounded-xl transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <svg className={`h-6 w-6 mr-4 ${active ? 'text-white' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
      </svg>
      <span className="font-medium text-lg">{children}</span>
    </a>
  );
}