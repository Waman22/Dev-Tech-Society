// app/(auth)/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';

interface Group {
  id: string;
  name: string;
  monthlyAmount: number;
  dueDay: number;
  totalMembers: number;
  totalCollected: number;
  status: string;
}

interface DashboardStats {
  totalGroups: number;
  activeGroups: number;
  totalMembers: number;
  totalCollected: number;
  pendingPayments: number;
  overduePayments: number;
  recentActivity: Activity[];
  upcomingPayments: Payment[];
  groups: Group[];
}

interface Activity {
  id: string;
  type: 'group' | 'member' | 'payment' | 'reminder';
  title: string;
  description: string;
  time: string;
  timestamp: string;
}

interface Payment {
  id: string;
  memberName: string;
  groupName: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'overdue' | 'paid';
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalGroups: 0,
    activeGroups: 0,
    totalMembers: 0,
    totalCollected: 0,
    pendingPayments: 0,
    overduePayments: 0,
    recentActivity: [],
    upcomingPayments: [],
    groups: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch groups
      const groupsResponse = await fetch('/api/auth/groups');
      const groupsResult = await groupsResponse.json();
      
      if (groupsResult.success) {
        const groups = groupsResult.data || [];
        
        // Calculate stats
        const totalGroups = groups.length;
        const activeGroups = groups.filter((g: Group) => g.status === 'active').length;
        const totalMembers = groups.reduce((sum: number, g: Group) => sum + g.totalMembers, 0);
        const totalCollected = groups.reduce((sum: number, g: Group) => sum + g.totalCollected, 0);
        
        // Generate recent activity from groups
        const recentActivity = groups.slice(0, 4).map((group: Group) => ({
          id: group.id,
          type: 'group' as const,
          title: 'New group created',
          description: `${group.name} - R${group.monthlyAmount}/month`,
          time: new Date(group.createdAt).toLocaleDateString(),
          timestamp: group.createdAt
        }));

        setStats({
          totalGroups,
          activeGroups,
          totalMembers,
          totalCollected,
          pendingPayments: 0, // Will be updated when members are added
          overduePayments: 0,
          recentActivity,
          upcomingPayments: [],
          groups
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="w-full h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="w-full">
        {/* Welcome Banner */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 shadow-lg">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to Raining Grace Funeral Parlour</h1>
            <p className="text-blue-100 text-lg">
              You have {stats.activeGroups} active group{stats.activeGroups !== 1 ? 's' : ''} with {stats.totalMembers} member{stats.totalMembers !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Groups */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">Total Groups</h3>
                <p className="text-3xl font-bold text-blue-900">{stats.totalGroups}</p>
                <p className="text-xs text-blue-700 mt-1">{stats.activeGroups} active</p>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-sm">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <Link 
              href="/admin/groups" 
              className="text-sm text-blue-700 hover:text-blue-900 font-medium flex items-center"
            >
              View all groups
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Total Members */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-medium text-green-800 mb-1">Total Members</h3>
                <p className="text-3xl font-bold text-green-900">{stats.totalMembers}</p>
                <p className="text-xs text-green-700 mt-1">Across all groups</p>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-sm">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <Link 
              href="/admin/members" 
              className="text-sm text-green-700 hover:text-green-900 font-medium flex items-center"
            >
              Manage members
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Total Collected */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-medium text-yellow-800 mb-1">Total Collected</h3>
                <p className="text-3xl font-bold text-yellow-900">R{stats.totalCollected.toLocaleString()}</p>
                <p className="text-xs text-yellow-700 mt-1">Lifetime contributions</p>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-sm">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <Link 
              href="/admin/payments" 
              className="text-sm text-yellow-700 hover:text-yellow-900 font-medium flex items-center"
            >
              View payments
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Active Groups */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-medium text-purple-800 mb-1">Active Groups</h3>
                <p className="text-3xl font-bold text-purple-900">{stats.activeGroups}</p>
                <p className="text-xs text-purple-700 mt-1">of {stats.totalGroups} total</p>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-sm">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-5m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <Link 
              href="/admin/groups/new" 
              className="text-sm text-purple-700 hover:text-purple-900 font-medium flex items-center"
            >
              Create new group
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Recent Activity & Groups */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Activity */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="border-b border-gray-200 p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800">Recent Activity</h3>
                  <Link href="/admin/groups" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View All →
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {stats.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center p-4 hover:bg-gray-50 rounded-xl transition">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <span className="text-blue-600 text-xl">👥</span>
                        </div>
                        <div className="ml-4 flex-1">
                          <h4 className="text-base font-medium text-gray-800">{activity.title}</h4>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                        </div>
                        <span className="text-sm text-gray-500">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex p-3 bg-gray-100 rounded-full mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            </div>

            {/* Your Groups */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <div className="border-b border-gray-200 p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800">Your Groups</h3>
                  <Link href="/admin/groups" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    Manage Groups →
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {stats.groups.length > 0 ? (
                  <div className="space-y-4">
                    {stats.groups.slice(0, 3).map((group) => (
                      <div key={group.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
                            {group.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900">{group.name}</p>
                            <p className="text-sm text-gray-500">Due {group.dueDay}th • R{group.monthlyAmount}/month</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{group.totalMembers} members</p>
                          <p className="text-xs text-gray-500">R{group.totalCollected} collected</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex p-3 bg-gray-100 rounded-full mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 mb-3">No groups created yet</p>
                    <Link
                      href="/admin/groups/new"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Your First Group
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Stats */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/admin/groups/new"
                  className="w-full flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition group"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm mr-4">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 group-hover:text-blue-700">Create New Group</p>
                    <p className="text-xs text-gray-500">Start a new savings circle</p>
                  </div>
                </Link>

                <Link
                  href="/admin/groups"
                  className="w-full flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-xl transition group"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm mr-4">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 group-hover:text-green-700">Manage Groups</p>
                    <p className="text-xs text-gray-500">{stats.totalGroups} group{stats.totalGroups !== 1 ? 's' : ''} available</p>
                  </div>
                </Link>

                {/* Add Members - Links to members page */}
      <Link
        href="/admin/members"
        className="w-full flex items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-xl transition group"
      >
        <div className="p-2 bg-white rounded-lg shadow-sm mr-4">
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <div className="flex-1 text-left">
          <p className="font-medium text-gray-900 group-hover:text-yellow-700">Add Members</p>
          <p className="text-xs text-gray-500">Add members to your groups</p>
        </div>
      </Link>

      {/* Track Payments - Links to payments page */}
      <Link
        href="/admin/payments"
        className="w-full flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition group"
      >
        <div className="p-2 bg-white rounded-lg shadow-sm mr-4">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 text-left">
          <p className="font-medium text-gray-900 group-hover:text-purple-700">Track Payments</p>
          <p className="text-xs text-gray-500">Monitor member contributions</p>
        </div>
      </Link>

{/* Send Reminders - Links to reminders page */}
      <Link
        href="/admin/reminders"
        className="w-full flex items-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition group"
      >
        <div className="p-2 bg-white rounded-lg shadow-sm mr-4">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="flex-1 text-left">
          <p className="font-medium text-gray-900 group-hover:text-indigo-700">Send Reminders</p>
          <p className="text-xs text-gray-500">Notify members about payments</p>
        </div>
      </Link>


                <Link
                  href="/admin/reports"
                  className="w-full flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition group"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm mr-4">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 group-hover:text-purple-700">Generate Report</p>
                    <p className="text-xs text-gray-500">Monthly collection summary</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">Total Groups</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {stats.totalGroups}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">Active Groups</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    {stats.activeGroups}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">Total Members</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                    {stats.totalMembers}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">Collection Rate</span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                    0%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}