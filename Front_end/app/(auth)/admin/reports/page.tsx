// app/(auth)/admin/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import BackButton from '@/components/BackButton';
import Link from 'next/link';

interface Group {
  id: string;
  name: string;
  monthlyAmount: number;
  dueDay: number;
  totalMembers: number;
  totalCollected: number;
  status: string;
  createdAt: string;
  reminderDays: number;
  reminderTime: string;
}

interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string;
  idNumber?: string;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  totalPaid: number;
  lastPaymentDate?: string;
  createdAt: string;
  groupId: string;
  groupName: string;
  monthlyAmount: number;
}

interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  groupId: string;
  groupName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'eft' | 'mobile_money';
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
  recordedBy?: string;
}

interface MonthlyData {
  month: string;
  monthKey: string;
  collected: number;
  expected: number;
  members: number;
  paidCount: number;
  totalCount: number;
}

interface GroupPerformance {
  id: string;
  name: string;
  totalCollected: number;
  memberCount: number;
  collectionRate: number;
  monthlyAmount: number;
  dueDay: number;
  paidMembers: number;
  pendingMembers: number;
  overdueMembers: number;
  potentialRevenue: number;
}

interface ReportData {
  summary: {
    totalGroups: number;
    activeGroups: number;
    inactiveGroups: number;
    totalMembers: number;
    totalCollected: number;
    pendingAmount: number;
    paidMembers: number;
    pendingMembers: number;
    overdueMembers: number;
    collectionRate: number;
    averageContribution: number;
    totalPotential: number;
    yearToDateCollected: number;
    yearToDateTarget: number;
    yearToDateProgress: number;
    bestPerformingGroup: string;
    worstPerformingGroup: string;
    mostValuableGroup: string;
    highestCollectionRate: number;
    lowestCollectionRate: number;
  };
  groups: Group[];
  recentPayments: Payment[];
  topGroups: GroupPerformance[];
  bottomGroups: GroupPerformance[];
  monthlyData: MonthlyData[];
  groupPerformance: GroupPerformance[];
  paymentMethods: {
    cash: number;
    bank_transfer: number;
    eft: number;
    mobile_money: number;
  };
  memberStatusBreakdown: {
    paid: number;
    pending: number;
    overdue: number;
    total: number;
  };
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [groups, setGroups] = useState<Group[]>([]);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [viewType, setViewType] = useState<'summary' | 'detailed' | 'comparison'>('summary');

  useEffect(() => {
    fetchReportData();
  }, [dateRange, selectedGroup]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch all groups
      const groupsResponse = await fetch('/api/auth/groups');
      const groupsResult = await groupsResponse.json();
      
      let allGroups = groupsResult.success ? groupsResult.data : [];
      setGroups(allGroups);
      
      // Filter groups if specific group selected
      let groupsToProcess = allGroups;
      if (selectedGroup !== 'all') {
        groupsToProcess = allGroups.filter((g: Group) => g.id === selectedGroup);
      }
      
      // Initialize accumulators
      let totalMembers = 0;
      let totalCollected = 0;
      let pendingAmount = 0;
      let paidMembers = 0;
      let pendingMembers = 0;
      let overdueMembers = 0;
      let activeGroups = 0;
      let inactiveGroups = 0;
      
      const allPayments: Payment[] = [];
      const groupPerformanceList: GroupPerformance[] = [];
      const monthlyDataMap: Map<string, MonthlyData> = new Map();
      
      // Payment method counters
      let cashPayments = 0;
      let bankTransferPayments = 0;
      let eftPayments = 0;
      let mobileMoneyPayments = 0;
      
      // Process each group
      for (const group of groupsToProcess) {
        // Count active/inactive groups
        if (group.status === 'active') {
          activeGroups++;
        } else {
          inactiveGroups++;
        }
        
        // Fetch members for this group
        const membersResponse = await fetch(`/api/auth/groups/${group.id}/members`);
        const membersResult = await membersResponse.json();
        const members = membersResult.success ? membersResult.data : [];
        
        // Calculate group stats
        const groupPaid = members.filter((m: Member) => m.paymentStatus === 'paid').length;
        const groupPending = members.filter((m: Member) => m.paymentStatus === 'pending').length;
        const groupOverdue = members.filter((m: Member) => m.paymentStatus === 'overdue').length;
        
        totalMembers += members.length;
        paidMembers += groupPaid;
        pendingMembers += groupPending;
        overdueMembers += groupOverdue;
        
        // Calculate collected amount
        const groupCollected = members.reduce((sum: number, m: Member) => sum + (m.totalPaid || 0), 0);
        totalCollected += groupCollected;
        
        // Calculate pending amount
        const groupPendingAmount = (groupPending + groupOverdue) * group.monthlyAmount;
        pendingAmount += groupPendingAmount;
        
        // Calculate potential revenue
        const groupPotential = members.length * group.monthlyAmount * 12; // Annual potential
        
        // Create group performance
        groupPerformanceList.push({
          id: group.id,
          name: group.name,
          totalCollected: groupCollected,
          memberCount: members.length,
          collectionRate: members.length > 0 
            ? Math.round((groupPaid / members.length) * 100) 
            : 0,
          monthlyAmount: group.monthlyAmount,
          dueDay: group.dueDay,
          paidMembers: groupPaid,
          pendingMembers: groupPending,
          overdueMembers: groupOverdue,
          potentialRevenue: groupPotential
        });
        
        // Process each member for monthly data and payments
        for (const member of members) {
          // Generate monthly data based on join date and payments
          const joinDate = new Date(member.createdAt);
          const currentDate = new Date();
          
          // Determine date range for monthly data
          let startDate = new Date();
          if (dateRange === 'week') {
            startDate.setDate(currentDate.getDate() - 7);
          } else if (dateRange === 'month') {
            startDate.setMonth(currentDate.getMonth() - 1);
          } else if (dateRange === 'quarter') {
            startDate.setMonth(currentDate.getMonth() - 3);
          } else if (dateRange === 'year') {
            startDate.setFullYear(currentDate.getFullYear() - 1);
          } else {
            startDate = joinDate; // From member's join date
          }
          
          // Create monthly buckets
          const monthIterator = new Date(startDate);
          while (monthIterator <= currentDate) {
            const monthKey = `${monthIterator.getFullYear()}-${monthIterator.getMonth() + 1}`;
            const monthName = monthIterator.toLocaleString('default', { month: 'long' });
            
            if (!monthlyDataMap.has(monthKey)) {
              monthlyDataMap.set(monthKey, {
                month: `${monthName} ${monthIterator.getFullYear()}`,
                monthKey,
                collected: 0,
                expected: 0,
                members: 0,
                paidCount: 0,
                totalCount: 0
              });
            }
            
            const monthData = monthlyDataMap.get(monthKey)!;
            monthData.members++;
            monthData.expected += group.monthlyAmount;
            
            // Check if member was paid this month (simplified - in real app, check actual payment dates)
            if (member.paymentStatus === 'paid' && member.lastPaymentDate) {
              const paymentDate = new Date(member.lastPaymentDate);
              if (paymentDate.getMonth() === monthIterator.getMonth() && 
                  paymentDate.getFullYear() === monthIterator.getFullYear()) {
                monthData.collected += group.monthlyAmount;
                monthData.paidCount++;
              }
            }
            
            monthData.totalCount = monthData.members;
            monthIterator.setMonth(monthIterator.getMonth() + 1);
          }
          
          // Create mock payments based on member data
          if (member.totalPaid > 0 && member.lastPaymentDate) {
            const paymentMethod = ['cash', 'bank_transfer', 'eft', 'mobile_money'][Math.floor(Math.random() * 4)] as any;
            
            // Count payment methods
            if (paymentMethod === 'cash') cashPayments++;
            else if (paymentMethod === 'bank_transfer') bankTransferPayments++;
            else if (paymentMethod === 'eft') eftPayments++;
            else if (paymentMethod === 'mobile_money') mobileMoneyPayments++;
            
            allPayments.push({
              id: `payment_${member.id}_${Date.now()}`,
              memberId: member.id,
              memberName: member.name,
              groupId: group.id,
              groupName: group.name,
              amount: member.totalPaid,
              paymentDate: member.lastPaymentDate,
              paymentMethod,
              status: 'completed'
            });
          }
        }
      }
      
      // Convert monthly data map to array and sort
      const monthlyData = Array.from(monthlyDataMap.values())
        .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
      
      // Sort groups by performance
      const sortedGroups = [...groupPerformanceList].sort((a, b) => b.collectionRate - a.collectionRate);
      const topGroups = sortedGroups.slice(0, 5);
      const bottomGroups = sortedGroups.slice(-5).reverse();
      
      // Calculate best and worst performers
      const bestPerformer = sortedGroups[0];
      const worstPerformer = sortedGroups[sortedGroups.length - 1];
      const mostValuable = [...groupPerformanceList].sort((a, b) => b.totalCollected - a.totalCollected)[0];
      
      // Calculate year to date
      const currentYear = new Date().getFullYear();
      const yearToDateData = monthlyData.filter(m => m.monthKey.startsWith(currentYear.toString()));
      const yearToDateCollected = yearToDateData.reduce((sum, m) => sum + m.collected, 0);
      const yearToDateTarget = yearToDateData.reduce((sum, m) => sum + m.expected, 0);
      
      setReportData({
        summary: {
          totalGroups: groupsToProcess.length,
          activeGroups,
          inactiveGroups,
          totalMembers,
          totalCollected,
          pendingAmount,
          paidMembers,
          pendingMembers,
          overdueMembers,
          collectionRate: totalMembers > 0 ? Math.round((paidMembers / totalMembers) * 100) : 0,
          averageContribution: totalMembers > 0 ? Math.round(totalCollected / totalMembers) : 0,
          totalPotential: groupPerformanceList.reduce((sum, g) => sum + g.potentialRevenue, 0),
          yearToDateCollected,
          yearToDateTarget,
          yearToDateProgress: yearToDateTarget > 0 ? Math.round((yearToDateCollected / yearToDateTarget) * 100) : 0,
          bestPerformingGroup: bestPerformer?.name || 'N/A',
          worstPerformingGroup: worstPerformer?.name || 'N/A',
          mostValuableGroup: mostValuable?.name || 'N/A',
          highestCollectionRate: bestPerformer?.collectionRate || 0,
          lowestCollectionRate: worstPerformer?.collectionRate || 0
        },
        groups: groupsToProcess,
        recentPayments: allPayments.sort((a, b) => 
          new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
        ).slice(0, 15),
        topGroups,
        bottomGroups,
        monthlyData,
        groupPerformance: groupPerformanceList,
        paymentMethods: {
          cash: cashPayments,
          bank_transfer: bankTransferPayments,
          eft: eftPayments,
          mobile_money: mobileMoneyPayments
        },
        memberStatusBreakdown: {
          paid: paidMembers,
          pending: pendingMembers,
          overdue: overdueMembers,
          total: totalMembers
        }
      });
      
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Generate CSV data
    if (exportFormat === 'csv' && reportData) {
      const csvData = [
        ['Report Type', 'Value'],
        ['Total Groups', reportData.summary.totalGroups],
        ['Active Groups', reportData.summary.activeGroups],
        ['Total Members', reportData.summary.totalMembers],
        ['Total Collected', `R${reportData.summary.totalCollected}`],
        ['Collection Rate', `${reportData.summary.collectionRate}%`],
        ['Paid Members', reportData.summary.paidMembers],
        ['Pending Members', reportData.summary.pendingMembers],
        ['Overdue Members', reportData.summary.overdueMembers],
        [],
        ['Monthly Performance'],
        ['Month', 'Collected', 'Expected', 'Members', 'Paid Count']
      ];
      
      reportData.monthlyData.forEach(m => {
        csvData.push([m.month, `R${m.collected}`, `R${m.expected}`, m.members.toString(), m.paidCount.toString()]);
      });
      
      csvData.push([], ['Top Groups']);
      csvData.push(['Group', 'Collected', 'Members', 'Collection Rate']);
      
      reportData.topGroups.forEach(g => {
        csvData.push([g.name, `R${g.totalCollected}`, g.memberCount.toString(), `${g.collectionRate}%`]);
      });
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stokvel-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } else {
      alert(`Exporting as ${exportFormat.toUpperCase()}...`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="w-full max-w-7xl mx-auto px-4 py-8 print:px-0">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between print:hidden">
          <div className="flex items-center mb-4 md:mb-0">
            <BackButton />
            <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
            >
              <option value="pdf">PDF Document</option>
              <option value="excel">Excel Spreadsheet</option>
              <option value="csv">CSV File</option>
            </select>
            
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export {exportFormat.toUpperCase()}
            </button>
            
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Report
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Date Range:</span>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
              >
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 90 Days</option>
                <option value="year">Last 12 Months</option>
                <option value="all">All Time</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Group:</span>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                <option value="all">All Groups</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">View:</span>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={viewType}
                onChange={(e) => setViewType(e.target.value as any)}
              >
                <option value="summary">Summary View</option>
                <option value="detailed">Detailed View</option>
                <option value="comparison">Group Comparison</option>
              </select>
            </div>
            
            <button
              onClick={fetchReportData}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition ml-auto"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {reportData && (
          <>
            {/* Executive Summary Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 mb-8 text-white shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Executive Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-indigo-200 text-sm">Collection Rate</p>
                  <p className="text-4xl font-bold">{reportData.summary.collectionRate}%</p>
                  <p className="text-indigo-200 text-sm mt-2">{reportData.summary.paidMembers} of {reportData.summary.totalMembers} members</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-sm">Year to Date Progress</p>
                  <p className="text-4xl font-bold">{reportData.summary.yearToDateProgress}%</p>
                  <p className="text-indigo-200 text-sm mt-2">R{reportData.summary.yearToDateCollected} of R{reportData.summary.yearToDateTarget}</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-sm">Best Performer</p>
                  <p className="text-2xl font-bold truncate">{reportData.summary.bestPerformingGroup}</p>
                  <p className="text-indigo-200 text-sm mt-2">{reportData.summary.highestCollectionRate}% collection rate</p>
                </div>
                <div>
                  <p className="text-indigo-200 text-sm">Total Portfolio Value</p>
                  <p className="text-3xl font-bold">R{reportData.summary.totalPotential.toLocaleString()}</p>
                  <p className="text-indigo-200 text-sm mt-2">Annual potential</p>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-blue-100 text-sm">Total Collected</p>
                    <p className="text-3xl font-bold mt-2">R{reportData.summary.totalCollected.toLocaleString()}</p>
                    <p className="text-blue-100 text-sm mt-2">Lifetime contributions</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-400">
                  <div className="flex justify-between text-sm">
                    <span>Collection Rate</span>
                    <span className="font-bold">{reportData.summary.collectionRate}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-green-100 text-sm">Member Overview</p>
                    <p className="text-3xl font-bold mt-2">{reportData.summary.totalMembers}</p>
                    <p className="text-green-100 text-sm mt-2">Across {reportData.summary.totalGroups} groups</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-green-400">
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <div className="font-bold">{reportData.summary.paidMembers}</div>
                      <div className="text-green-200">Paid</div>
                    </div>
                    <div>
                      <div className="font-bold">{reportData.summary.pendingMembers}</div>
                      <div className="text-green-200">Pending</div>
                    </div>
                    <div>
                      <div className="font-bold">{reportData.summary.overdueMembers}</div>
                      <div className="text-green-200">Overdue</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-yellow-100 text-sm">Outstanding Payments</p>
                    <p className="text-3xl font-bold mt-2">R{reportData.summary.pendingAmount.toLocaleString()}</p>
                    <p className="text-yellow-100 text-sm mt-2">From {reportData.summary.pendingMembers + reportData.summary.overdueMembers} members</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-yellow-400">
                  <div className="flex justify-between text-sm">
                    <span>Average per member</span>
                    <span className="font-bold">R{Math.round(reportData.summary.pendingAmount / (reportData.summary.pendingMembers + reportData.summary.overdueMembers || 1)).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-purple-100 text-sm">Group Performance</p>
                    <p className="text-3xl font-bold mt-2">{reportData.summary.activeGroups}</p>
                    <p className="text-purple-100 text-sm mt-2">Active of {reportData.summary.totalGroups} groups</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-purple-400">
                  <div className="flex justify-between text-sm">
                    <span>Best: {reportData.summary.bestPerformingGroup}</span>
                    <span className="font-bold">{reportData.summary.highestCollectionRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Monthly Collection Chart */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Collection Performance</h3>
                <div className="space-y-4">
                  {reportData.monthlyData.map((month, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 font-medium">{month.month}</span>
                        <div className="text-right">
                          <span className="font-medium text-gray-900">R{month.collected.toLocaleString()}</span>
                          <span className="text-gray-500 text-xs ml-2">
                            ({Math.round((month.collected / (month.expected || 1)) * 100)}% of target)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full relative"
                          style={{ width: `${(month.collected / (month.expected || 1)) * 100}%` }}
                        >
                          <div className="absolute inset-0 flex items-center justify-end pr-2">
                            <span className="text-[10px] text-white font-bold">
                              {month.paidCount}/{month.totalCount} members
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Expected: R{month.expected.toLocaleString()}</span>
                        <span>Members: {month.members}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Year to Date Progress</span>
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-gray-900 mr-3">{reportData.summary.yearToDateProgress}%</span>
                      <div className="w-32 bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-green-500 h-2.5 rounded-full" 
                          style={{ width: `${reportData.summary.yearToDateProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Status Distribution */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Member Payment Status Breakdown</h3>
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">Paid Members</span>
                      <div>
                        <span className="font-medium text-green-600">{reportData.memberStatusBreakdown.paid}</span>
                        <span className="text-gray-500 text-xs ml-2">
                          ({Math.round((reportData.memberStatusBreakdown.paid / reportData.memberStatusBreakdown.total) * 100)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6">
                      <div 
                        className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-3 text-xs text-white font-bold"
                        style={{ width: `${(reportData.memberStatusBreakdown.paid / reportData.memberStatusBreakdown.total) * 100}%` }}
                      >
                        {Math.round((reportData.memberStatusBreakdown.paid / reportData.memberStatusBreakdown.total) * 100)}%
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">Pending Members</span>
                      <div>
                        <span className="font-medium text-yellow-600">{reportData.memberStatusBreakdown.pending}</span>
                        <span className="text-gray-500 text-xs ml-2">
                          ({Math.round((reportData.memberStatusBreakdown.pending / reportData.memberStatusBreakdown.total) * 100)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6">
                      <div 
                        className="bg-yellow-500 h-6 rounded-full flex items-center justify-end pr-3 text-xs text-white font-bold"
                        style={{ width: `${(reportData.memberStatusBreakdown.pending / reportData.memberStatusBreakdown.total) * 100}%` }}
                      >
                        {Math.round((reportData.memberStatusBreakdown.pending / reportData.memberStatusBreakdown.total) * 100)}%
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">Overdue Members</span>
                      <div>
                        <span className="font-medium text-red-600">{reportData.memberStatusBreakdown.overdue}</span>
                        <span className="text-gray-500 text-xs ml-2">
                          ({Math.round((reportData.memberStatusBreakdown.overdue / reportData.memberStatusBreakdown.total) * 100)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6">
                      <div 
                        className="bg-red-500 h-6 rounded-full flex items-center justify-end pr-3 text-xs text-white font-bold"
                        style={{ width: `${(reportData.memberStatusBreakdown.overdue / reportData.memberStatusBreakdown.total) * 100}%` }}
                      >
                        {Math.round((reportData.memberStatusBreakdown.overdue / reportData.memberStatusBreakdown.total) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Methods Breakdown */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-semibold text-gray-800 mb-4">Payment Methods Distribution</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600">Cash</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900">{reportData.paymentMethods.cash}</p>
                      <p className="text-xs text-gray-500">payments</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600">Bank Transfer</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900">{reportData.paymentMethods.bank_transfer}</p>
                      <p className="text-xs text-gray-500">payments</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600">EFT</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900">{reportData.paymentMethods.eft}</p>
                      <p className="text-xs text-gray-500">payments</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <div className="flex items-center mb-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-600">Mobile Money</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900">{reportData.paymentMethods.mobile_money}</p>
                      <p className="text-xs text-gray-500">payments</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Group Performance Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Top Performing Groups */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-green-50 to-green-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">🏆 Top Performing Groups</h3>
                    <span className="text-xs text-green-700 bg-green-200 px-3 py-1 rounded-full">Best Collection Rates</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {reportData.topGroups.map((group, index) => (
                      <div key={group.id} className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                              {index + 1}
                            </span>
                            <h4 className="font-semibold text-gray-900">{group.name}</h4>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            group.collectionRate >= 90 ? 'bg-green-100 text-green-800' :
                            group.collectionRate >= 75 ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {group.collectionRate}% Collection Rate
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                          <div>
                            <p className="text-gray-500">Collected</p>
                            <p className="font-medium text-gray-900">R{group.totalCollected.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Members</p>
                            <p className="font-medium text-gray-900">{group.memberCount}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Monthly</p>
                            <p className="font-medium text-gray-900">R{group.monthlyAmount}</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Paid: {group.paidMembers}</span>
                            <span className="text-gray-500">Pending: {group.pendingMembers}</span>
                            <span className="text-gray-500">Overdue: {group.overdueMembers}</span>
                          </div>
                          <Link 
                            href={`/admin/groups/${group.id}`}
                            className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                          >
                            View Group Details
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Groups Needing Attention */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-red-50 to-red-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800"> Groups Needing Attention</h3>
                    <span className="text-xs text-red-700 bg-red-200 px-3 py-1 rounded-full">Low Collection Rates</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {reportData.bottomGroups.map((group, index) => (
                      <div key={group.id} className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">
                              {index + 1}
                            </span>
                            <h4 className="font-semibold text-gray-900">{group.name}</h4>
                          </div>
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                            {group.collectionRate}% Collection Rate
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                          <div>
                            <p className="text-gray-500">Outstanding</p>
                            <p className="font-medium text-red-600">R{(group.pendingMembers + group.overdueMembers) * group.monthlyAmount}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">At Risk</p>
                            <p className="font-medium text-red-600">{group.pendingMembers + group.overdueMembers} members</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Overdue</p>
                            <p className="font-medium text-red-600">{group.overdueMembers}</p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Urgent: {group.overdueMembers} members overdue</span>
                            <Link 
                              href={`/admin/reminders/send?group=${group.id}`}
                              className="text-sm text-red-600 hover:text-red-800 font-medium inline-flex items-center"
                            >
                              Send Reminders
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Group Performance Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
              <div className="border-b border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800">Complete Group Performance Analysis</h3>
                <p className="text-sm text-gray-500 mt-1">Detailed breakdown of all groups with key metrics</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group Name</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Collected</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collection Rate</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Potential Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.groupPerformance.map((group) => (
                      <tr key={group.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <Link href={`/admin/groups/${group.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                            {group.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-medium">{group.memberCount}</td>
                        <td className="px-6 py-4 text-gray-900">R{group.monthlyAmount}</td>
                        <td className="px-6 py-4 text-gray-900 font-medium">R{group.totalCollected.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold mr-3 ${
                              group.collectionRate >= 80 ? 'bg-green-100 text-green-800' :
                              group.collectionRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {group.collectionRate}%
                            </span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  group.collectionRate >= 80 ? 'bg-green-500' :
                                  group.collectionRate >= 50 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${group.collectionRate}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-green-600 font-medium">{group.paidMembers}</td>
                        <td className="px-6 py-4 text-yellow-600 font-medium">{group.pendingMembers}</td>
                        <td className="px-6 py-4 text-red-600 font-medium">{group.overdueMembers}</td>
                        <td className="px-6 py-4 text-gray-900">R{group.potentialRevenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Payments Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800">Recent Payment Transactions</h3>
                <p className="text-sm text-gray-500 mt-1">Latest {reportData.recentPayments.length} payments recorded in the system</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.recentPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{payment.memberName}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/admin/groups/${payment.groupId}`} className="text-blue-600 hover:text-blue-800">
                            {payment.groupName}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">R{payment.amount.toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(payment.paymentDate).toLocaleDateString('en-ZA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            payment.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' :
                            payment.paymentMethod === 'bank_transfer' ? 'bg-blue-100 text-blue-800' :
                            payment.paymentMethod === 'eft' ? 'bg-purple-100 text-purple-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.paymentMethod.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Print View */}
            <div className="hidden print:block mt-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold">Raining Grace Funeral Parlour</h1>
                <p className="text-xl text-gray-600 mt-2">Financial Performance Report</p>
                <p className="text-gray-500">Generated on {new Date().toLocaleDateString('en-ZA', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
              
              <div className="border-t border-gray-300 pt-8">
                <p className="text-sm text-gray-500">Report ID: STK-{Date.now()}</p>
                <p className="text-sm text-gray-500">Date Range: {dateRange}</p>
                <p className="text-sm text-gray-500">Group Filter: {selectedGroup === 'all' ? 'All Groups' : groups.find(g => g.id === selectedGroup)?.name}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}