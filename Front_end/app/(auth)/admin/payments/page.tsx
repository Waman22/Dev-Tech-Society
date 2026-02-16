// app/(auth)/admin/payments/page.tsx
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
  description: string;
}

interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string;
  idNumber?: string;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  lastPaymentDate?: string;
  totalPaid: number;
  groupId?: string;
  groupName?: string;
}

interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  groupId: string;
  groupName: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: 'paid' | 'pending' | 'overdue';
  paymentMethod?: 'cash' | 'bank_transfer' | 'card' | 'other';
  reference?: string;
  phone?: string;
  email?: string;
}

interface PaymentSummary {
  totalCollected: number;
  expectedThisMonth: number;
  overdueAmount: number;
  paymentRate: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  totalMembers: number;
  membersWithPayments: number;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState<PaymentSummary>({
    totalCollected: 0,
    expectedThisMonth: 0,
    overdueAmount: 0,
    paymentRate: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
    totalMembers: 0,
    membersWithPayments: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch groups
      const groupsResponse = await fetch('/api/auth/groups');
      const groupsResult = await groupsResponse.json();
      
      if (groupsResult.success) {
        const groupsData = groupsResult.data || [];
        setGroups(groupsData);
        
        // Fetch members for each group
        const allMembers: Member[] = [];
        
        for (const group of groupsData) {
          const membersResponse = await fetch(`/api/auth/groups/${group.id}/members`);
          const membersResult = await membersResponse.json();
          
          if (membersResult.success) {
            const groupMembers = (membersResult.data || []).map((member: Member) => ({
              ...member,
              groupId: group.id,
              groupName: group.name
            }));
            allMembers.push(...groupMembers);
          }
        }
        
        setMembers(allMembers);
        
        // Generate payments from members
        const generatedPayments = generatePaymentsFromMembers(allMembers, groupsData);
        setPayments(generatedPayments);
        
        // Calculate summary
        calculateSummary(generatedPayments, allMembers, groupsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePaymentsFromMembers = (members: Member[], groups: Group[]): Payment[] => {
    const payments: Payment[] = [];
    const currentDate = new Date();
    
    members.forEach(member => {
      const group = groups.find(g => g.id === member.groupId);
      if (!group) return;
      
      // Generate payment for current month
      const dueDate = new Date();
      dueDate.setDate(group.dueDay);
      
      // If due date passed, adjust status based on member's payment status
      let status = member.paymentStatus;
      if (dueDate < currentDate && member.paymentStatus === 'pending') {
        status = 'overdue';
      }
      
      payments.push({
        id: `payment_${member.id}_${currentDate.getMonth()}_${currentDate.getFullYear()}`,
        memberId: member.id,
        memberName: member.name,
        groupId: group.id,
        groupName: group.name,
        amount: group.monthlyAmount,
        dueDate: dueDate.toISOString().split('T')[0],
        paidDate: member.lastPaymentDate || null,
        status: status,
        paymentMethod: status === 'paid' ? 'cash' : undefined,
        phone: member.phone,
        email: member.email
      });
      
      // Add previous months' payments based on totalPaid
      if (member.totalPaid > 0) {
        const monthsPaid = Math.floor(member.totalPaid / group.monthlyAmount);
        for (let i = 1; i <= monthsPaid; i++) {
          const pastDate = new Date();
          pastDate.setMonth(pastDate.getMonth() - i);
          pastDate.setDate(group.dueDay);
          
          payments.push({
            id: `payment_${member.id}_${pastDate.getMonth()}_${pastDate.getFullYear()}`,
            memberId: member.id,
            memberName: member.name,
            groupId: group.id,
            groupName: group.name,
            amount: group.monthlyAmount,
            dueDate: pastDate.toISOString().split('T')[0],
            paidDate: pastDate.toISOString().split('T')[0],
            status: 'paid',
            paymentMethod: 'cash',
            phone: member.phone,
            email: member.email
          });
        }
      }
    });
    
    return payments;
  };

  const calculateSummary = (payments: Payment[], members: Member[], groups: Group[]) => {
    const totalCollected = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const expectedThisMonth = groups.reduce((sum, g) => sum + (g.monthlyAmount * g.totalMembers), 0);
    
    const overdueAmount = payments
      .filter(p => p.status === 'overdue')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const paidCount = payments.filter(p => p.status === 'paid').length;
    const pendingCount = payments.filter(p => p.status === 'pending').length;
    const overdueCount = payments.filter(p => p.status === 'overdue').length;
    
    const paymentRate = payments.length > 0 
      ? Math.round((paidCount / payments.length) * 100) 
      : 0;

    const membersWithPayments = new Set(payments.map(p => p.memberId)).size;

    setSummary({
      totalCollected,
      expectedThisMonth,
      overdueAmount,
      paymentRate,
      paidCount,
      pendingCount,
      overdueCount,
      totalMembers: members.length,
      membersWithPayments
    });
  };

  const filteredPayments = payments.filter(payment => {
    // Filter by status
    if (filter !== 'all' && payment.status !== filter) return false;
    
    // Filter by group
    if (selectedGroup !== 'all' && payment.groupId !== selectedGroup) return false;
    
    // Filter by search term
    if (searchTerm) {
      const fullName = payment.memberName.toLowerCase();
      const groupName = payment.groupName.toLowerCase();
      const term = searchTerm.toLowerCase();
      if (!fullName.includes(term) && !groupName.includes(term)) return false;
    }
    
    return true;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      overdue: 'bg-red-100 text-red-800 border-red-200'
    };
    
    const icons = {
      paid: '✓',
      pending: '⏳',
      overdue: '⚠️'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        <span className="mr-1">{icons[status as keyof typeof icons]}</span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleSendReminders = async () => {
    const overdueMembers = members.filter(m => m.paymentStatus === 'overdue');
    
    if (overdueMembers.length === 0) {
      alert('No overdue payments to remind about.');
      return;
    }
    
    const confirmRemind = confirm(`Send reminders to ${overdueMembers.length} member(s) with overdue payments?`);
    
    if (confirmRemind) {
      setLoading(true);
      
      try {
        // In a real app, this would call your API
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Log which members would receive reminders
        console.log('Reminders sent to:', overdueMembers.map(m => ({
          member: m.name,
          group: groups.find(g => g.id === m.groupId)?.name,
          phone: m.phone,
          email: m.email
        })));
        
        alert(`Reminders sent successfully to ${overdueMembers.length} member(s)!`);
      } catch (error) {
        console.error('Error sending reminders:', error);
        alert('Failed to send reminders. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMarkAsPaid = async (paymentId: string) => {
    // Find the payment
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) return;
    
    // Update payment status
    const updatedPayments = payments.map(p => 
      p.id === paymentId 
        ? { 
            ...p, 
            status: 'paid' as const, 
            paidDate: new Date().toISOString().split('T')[0],
            paymentMethod: 'cash' as const
          }
        : p
    );
    
    setPayments(updatedPayments);
    
    // Update member's payment status in local state
    const updatedMembers = members.map(m => 
      m.id === payment.memberId 
        ? { 
            ...m, 
            paymentStatus: 'paid' as const,
            lastPaymentDate: new Date().toISOString().split('T')[0],
            totalPaid: m.totalPaid + payment.amount
          }
        : m
    );
    
    setMembers(updatedMembers);
    calculateSummary(updatedPayments, updatedMembers, groups);
  };

  const getMemberInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 shadow-lg">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Payment Tracking</h1>
                <p className="text-blue-100 text-lg">
                  Monitor payments from {summary.totalMembers} members across {groups.length} groups
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSendReminders}
                  className="px-6 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition shadow-lg flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Send Reminders ({summary.overdueCount})
                </button>
                <Link
                  href="/admin/payments/export"
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-400 transition shadow-lg"
                >
                  Export Report
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Collected */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-green-800 mb-1">Total Collected</p>
                <p className="text-2xl font-bold text-green-900">R{summary.totalCollected.toLocaleString()}</p>
                <p className="text-xs text-green-700 mt-1">From {summary.membersWithPayments} members</p>
              </div>
              <div className="bg-white p-3 rounded-xl">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Expected This Month */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">Expected This Month</p>
                <p className="text-2xl font-bold text-blue-900">R{summary.expectedThisMonth.toLocaleString()}</p>
                <p className="text-xs text-blue-700 mt-1">From {summary.totalMembers} members</p>
              </div>
              <div className="bg-white p-3 rounded-xl">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Overdue Amount */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-red-800 mb-1">Overdue Amount</p>
                <p className="text-2xl font-bold text-red-900">R{summary.overdueAmount.toLocaleString()}</p>
                <p className="text-xs text-red-700 mt-1">{summary.overdueCount} payments overdue</p>
              </div>
              <div className="bg-white p-3 rounded-xl">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Payment Rate */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-purple-800 mb-1">Payment Rate</p>
                <p className="text-2xl font-bold text-purple-900">{summary.paymentRate}%</p>
                <p className="text-xs text-purple-700 mt-1">{summary.paidCount} of {payments.length} payments</p>
              </div>
              <div className="bg-white p-3 rounded-xl">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Member</label>
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Group Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Group</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Groups</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.totalMembers} members)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Stats Filter */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                filter === 'all' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({payments.length})
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                filter === 'paid' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              Paid ({summary.paidCount})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                filter === 'pending' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
              }`}
            >
              Pending ({summary.pendingCount})
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                filter === 'overdue' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              Overdue ({summary.overdueCount})
            </button>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Group
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Paid
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {getMemberInitials(payment.memberName)}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {payment.memberName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.phone && (
                          <p className="text-sm text-gray-600">{payment.phone}</p>
                        )}
                        {payment.email && (
                          <p className="text-xs text-gray-500">{payment.email}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                          {payment.groupName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          R{payment.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {new Date(payment.dueDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.paidDate ? (
                          <span className="text-sm text-gray-600">
                            {new Date(payment.paidDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {payment.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkAsPaid(payment.id)}
                            className="text-green-600 hover:text-green-800 font-medium text-sm mr-3"
                          >
                            Mark Paid
                          </button>
                        )}
                        <Link
                          href={`/admin/members?member=${payment.memberId}`}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          View Member
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="inline-flex p-3 bg-gray-100 rounded-full mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 mb-2">No payments found</p>
                      <p className="text-sm text-gray-400">
                        {members.length === 0 ? 'Add members to groups to see payments' : 'Try adjusting your filters'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium">{filteredPayments.length}</span> of{' '}
                <span className="font-medium">{payments.length}</span> payments
              </p>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  Previous
                </button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                  1
                </button>
                <button className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  2
                </button>
                <button className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  3
                </button>
                <button className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Group Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {groups.map(group => {
            const groupMembers = members.filter(m => m.groupId === group.id);
            const groupPayments = payments.filter(p => p.groupId === group.id);
            const paidInGroup = groupPayments.filter(p => p.status === 'paid').length;
            const groupTotal = groupPayments.reduce((sum, p) => sum + p.amount, 0);
            
            return (
              <div key={group.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                    {group.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">{group.name}</h3>
                    <p className="text-xs text-gray-500">{groupMembers.length} members</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Monthly Contribution:</span>
                    <span className="font-medium text-gray-900">R{group.monthlyAmount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Collected:</span>
                    <span className="font-medium text-green-600">R{groupTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Rate:</span>
                    <span className="font-medium text-blue-600">
                      {groupPayments.length > 0 
                        ? Math.round((paidInGroup / groupPayments.length) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
                
                <Link
                  href={`/admin/payments?group=${group.id}`}
                  className="mt-4 block text-center py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-100 transition"
                >
                  View Group Payments
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </ProtectedRoute>
  );
}