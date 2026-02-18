// app/(auth)/admin/members/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import BackButton from '@/components/BackButton';

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
  createdAt: string;
}

export default function MembersPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Form state for adding member
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    idNumber: '',
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch all groups on page load
  useEffect(() => {
    fetchGroups();
  }, []);

  // Fetch members when a group is selected
  useEffect(() => {
    if (selectedGroup) {
      fetchMembers(selectedGroup.id);
    }
  }, [selectedGroup]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/groups');
      const result = await response.json();
      
      if (result.success) {
        setGroups(result.data || []);
        // Auto-select first group if available
        if (result.data?.length > 0) {
          setSelectedGroup(result.data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (groupId: string) => {
    try {
      const response = await fetch(`/api/auth/groups/${groupId}/members`);
      const result = await response.json();
      
      if (result.success) {
        setMembers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9+\s]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Enter a valid phone number (10-15 digits)';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Enter a valid email address';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGroup) {
      alert('Please select a group first');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const response = await fetch(`/api/auth/groups/${selectedGroup.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Reset form
        setFormData({
          name: '',
          phone: '',
          email: '',
          idNumber: '',
        });
        setShowAddForm(false);
        
        // Refresh members list
        fetchMembers(selectedGroup.id);
        
        // Show success message
        alert('Member added successfully!');
      } else {
        alert(`Failed to add member: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member');
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    try {
      const response = await fetch(`/api/auth/members/${memberId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        fetchMembers(selectedGroup!.id);
        alert('Member removed successfully');
      } else {
        alert(`Failed to remove member: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete member');
    }
  };

  const handleMarkAsPaid = async (memberId: string) => {
    if (!selectedGroup) return;
    
    try {
      const response = await fetch(`/api/auth/members/${memberId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: selectedGroup.monthlyAmount,
          paymentMethod: 'cash',
          paymentDate: new Date().toISOString()
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        fetchMembers(selectedGroup.id);
        alert('Payment recorded successfully!');
      } else {
        alert(`Failed to record payment: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment');
    }
  };

  const getDaySuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.phone.includes(searchTerm) ||
                         (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || member.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <BackButton />
            <h1 className="text-3xl font-bold text-gray-800">Members Management</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Select a group to view, add, and manage members
          </p>
        </div>

        {groups.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Groups Found</h3>
            <p className="text-gray-500 mb-6">Create a group first before adding members</p>
            <Link
              href="/admin/groups/new"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Group
            </Link>
          </div>
        ) : (
          <>
            {/* Group Selector */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Group to Manage Members
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedGroup?.id === group.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mr-3 ${
                        selectedGroup?.id === group.id
                          ? 'bg-gradient-to-br from-blue-600 to-blue-500'
                          : 'bg-gradient-to-br from-gray-600 to-gray-500'
                      }`}>
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{group.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          R{group.monthlyAmount}/month • Due {group.dueDay}{getDaySuffix(group.dueDay)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {group.totalMembers} members
                        </p>
                      </div>
                      {selectedGroup?.id === group.id && (
                        <svg className="w-5 h-5 text-blue-600 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Group Header */}
            {selectedGroup && (
              <div className="mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">{selectedGroup.name}</h2>
                      <div className="flex items-center space-x-4 text-blue-100">
                        <span> R{selectedGroup.monthlyAmount}/month</span>
                        <span> Due {selectedGroup.dueDay}{getDaySuffix(selectedGroup.dueDay)}</span>
                        <span> {selectedGroup.totalMembers} members</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="px-6 py-3 bg-white text-blue-700 font-medium rounded-xl hover:bg-blue-50 transition shadow-lg flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Member
                    </button>
                  </div>
                  {selectedGroup.description && (
                    <p className="mt-4 text-blue-100 border-t border-blue-400 pt-4">
                      {selectedGroup.description}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Search and Filter Bar */}
            {selectedGroup && members.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search members by name, phone or email..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Add Member Form Modal */}
            {showAddForm && selectedGroup && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl w-full max-w-md">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-gray-800">
                        Add Member to {selectedGroup.name}
                      </h2>
                      <button
                        onClick={() => setShowAddForm(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <form onSubmit={handleAddMember}>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              formErrors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="John Doe"
                          />
                          {formErrors.name && (
                            <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              formErrors.phone ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="082 123 4567"
                          />
                          {formErrors.phone && (
                            <p className="text-red-600 text-sm mt-1">{formErrors.phone}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Used for SMS reminders
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address (Optional)
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              formErrors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="john@example.com"
                          />
                          {formErrors.email && (
                            <p className="text-red-600 text-sm mt-1">{formErrors.email}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ID Number (Optional)
                          </label>
                          <input
                            type="text"
                            name="idNumber"
                            value={formData.idNumber}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="860101 1234 567"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-3 mt-8">
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition"
                        >
                          Add Member
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Members Table */}
            {selectedGroup && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                {members.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No members yet</h3>
                    <p className="text-gray-500 mb-6">
                      Add members to {selectedGroup.name} to start tracking payments
                    </p>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-lg"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add First Member
                    </button>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No matching members</h3>
                    <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria</p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                      className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-lg"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Member
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Contact
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ID Number
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Paid
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Joined
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredMembers.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50 transition">
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                                    {member.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="ml-3">
                                    <p className="font-semibold text-gray-900">{member.name}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm text-gray-900">{member.phone}</p>
                                {member.email && (
                                  <p className="text-xs text-gray-500 mt-1">{member.email}</p>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm text-gray-600">
                                  {member.idNumber || '—'}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(member.paymentStatus)}`}>
                                  {member.paymentStatus.charAt(0).toUpperCase() + member.paymentStatus.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-medium text-gray-900">
                                  R{member.totalPaid.toLocaleString()}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm text-gray-600">
                                  {new Date(member.createdAt).toLocaleDateString()}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleMarkAsPaid(member.id)}
                                    disabled={member.paymentStatus === 'paid'}
                                    className={`p-2 rounded-lg transition ${
                                      member.paymentStatus === 'paid'
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-green-600 hover:bg-green-50'
                                    }`}
                                    title="Mark as Paid"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMember(member.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Remove Member"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          Showing <span className="font-medium text-gray-900">{filteredMembers.length}</span> of{' '}
                          <span className="font-medium text-gray-900">{members.length}</span> members in {selectedGroup.name}
                        </p>
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Member
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}