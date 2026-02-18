// app/(auth)/admin/reminders/logs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

interface ReminderLog {
  id: string;
  memberName: string;
  groupName: string;
  phone: string;
  message: string;
  sentAt: string;
  status: 'sent' | 'failed';
}

export default function ReminderLogsPage() {
  const [logs, setLogs] = useState<ReminderLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminderLogs();
  }, []);

  const fetchReminderLogs = async () => {
    try {
      const response = await fetch('/api/auth/reminders/logs');
      const data = await response.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Reminder History</h1>
        
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Sent At</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4">{log.memberName} ({log.phone})</td>
                  <td className="px-6 py-4">{log.groupName}</td>
                  <td className="px-6 py-4 max-w-md truncate">{log.message}</td>
                  <td className="px-6 py-4">{new Date(log.sentAt).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      log.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedRoute>
  );
}