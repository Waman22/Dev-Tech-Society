// app/(auth)/admin/reminders/send/page.tsx
'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Group {
  id: string;
  name: string;
}

interface Member {
  id: string;
  name: string;
  phone: string;
  paymentStatus: string;
}

export default function SendReminderPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');

  const fetchGroups = async () => {
    const response = await fetch('/api/auth/groups');
    const data = await response.json();
    if (data.success) setGroups(data.data);
  };

  const fetchMembers = async (groupId: string) => {
    const response = await fetch(`/api/auth/groups/${groupId}/members`);
    const data = await response.json();
    if (data.success) setMembers(data.data);
  };

  const handleSendReminders = async () => {
    const response = await fetch('/api/auth/reminders/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberIds: selectedMembers,
        message: customMessage || undefined
      })
    });
    
    if (response.ok) {
      alert('Reminders sent successfully!');
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Send Manual Reminders</h1>
        
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          {/* Group Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Group</label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-xl"
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                fetchMembers(e.target.value);
              }}
            >
              <option value="">Choose a group...</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>

          {/* Member Selection */}
          {selectedGroup && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Members (unpaid only)
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-xl p-4">
                {members.filter(m => m.paymentStatus === 'pending').map(member => (
                  <label key={member.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      className="mr-3"
                      checked={selectedMembers.includes(member.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMembers([...selectedMembers, member.id]);
                        } else {
                          setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                        }
                      }}
                    />
                    <span>{member.name} ({member.phone})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Custom Message */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Message (optional)
            </label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-xl"
              rows={4}
              placeholder="Leave blank to use group's default template..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendReminders}
            disabled={selectedMembers.length === 0}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            Send Reminders to {selectedMembers.length} Member(s)
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}