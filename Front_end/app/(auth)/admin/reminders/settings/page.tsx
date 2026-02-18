// app/(auth)/admin/reminders/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Group {
  id: string;
  name: string;
  reminderDays: number;
  reminderTime: string;
  smsTemplate: string;
}

export default function ReminderSettingsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const fetchGroups = async () => {
    const response = await fetch('/api/auth/groups');
    const data = await response.json();
    if (data.success) setGroups(data.data);
  };

  const updateReminderSettings = async () => {
    if (!selectedGroup) return;
    
    await fetch(`/api/auth/groups/${selectedGroup.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reminderDays: selectedGroup.reminderDays,
        reminderTime: selectedGroup.reminderTime,
        smsTemplate: selectedGroup.smsTemplate
      })
    });
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Reminder Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Group List */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Groups</h2>
            <div className="space-y-2">
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className={`w-full text-left p-3 rounded-lg ${
                    selectedGroup?.id === group.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                >
                  {group.name}
                </button>
              ))}
            </div>
          </div>

          {/* Settings Form */}
          {selectedGroup && (
            <div className="md:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-6">{selectedGroup.name} - Reminder Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days Before Due Date
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    value={selectedGroup.reminderDays}
                    onChange={(e) => setSelectedGroup({
                      ...selectedGroup,
                      reminderDays: parseInt(e.target.value)
                    })}
                  >
                    <option value="1">1 day before</option>
                    <option value="2">2 days before</option>
                    <option value="3">3 days before</option>
                    <option value="5">5 days before</option>
                    <option value="7">7 days before</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time of Day
                  </label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    value={selectedGroup.reminderTime}
                    onChange={(e) => setSelectedGroup({
                      ...selectedGroup,
                      reminderTime: e.target.value
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMS Template
                  </label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    rows={4}
                    value={selectedGroup.smsTemplate}
                    onChange={(e) => setSelectedGroup({
                      ...selectedGroup,
                      smsTemplate: e.target.value
                    })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use {'{name}'}, {'{amount}'}, {'{group}'}, {'{dueDate}'} as placeholders
                  </p>
                </div>

                <button
                  onClick={updateReminderSettings}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}