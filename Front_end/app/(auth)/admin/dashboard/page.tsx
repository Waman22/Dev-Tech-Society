import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminDashboard() {
  return (
    <ProtectedRoute requireAdmin>
      <div className="w-full">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Overview</h2>
        
        {/* Two Column Layout - Full Width */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Activity */}
            <div className="border border-gray-200 rounded-2xl">
              <div className="border-b border-gray-200 p-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-semibold text-gray-800">Recent Activity</h3>
                  <button className="text-lg text-blue-600 hover:text-blue-800 font-medium">
                    View All →
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {[
                    { type: 'member', title: 'New member added', description: 'John Doe joined Family Stokvel', time: '2 hours ago' },
                    { type: 'payment', title: 'Payment received', description: 'R500 from Jane Smith', time: '4 hours ago' },
                    { type: 'reminder', title: 'Reminder sent', description: 'To 5 members about payments', time: '1 day ago' },
                    { type: 'group', title: 'New group created', description: 'Savings Circle started', time: '2 days ago' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center p-6 hover:bg-gray-50 rounded-xl transition">
                      <div className={`p-4 rounded-2xl ${
                        activity.type === 'member' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'payment' ? 'bg-green-100 text-green-600' :
                        activity.type === 'reminder' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {activity.type === 'member' && '👤'}
                        {activity.type === 'payment' && '💰'}
                        {activity.type === 'reminder' && '⏰'}
                        {activity.type === 'group' && '👥'}
                      </div>
                      <div className="ml-6 flex-1">
                        <h4 className="text-xl font-medium text-gray-800">{activity.title}</h4>
                        <p className="text-lg text-gray-600">{activity.description}</p>
                      </div>
                      <span className="text-lg text-gray-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment Schedule */}
            <div className="border border-gray-200 rounded-2xl">
              <div className="border-b border-gray-200 p-6">
                <h3 className="text-2xl font-semibold text-gray-800">Upcoming Payments</h3>
              </div>
              <div className="p-6 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 text-lg font-medium text-gray-600">Member</th>
                      <th className="text-left py-4 text-lg font-medium text-gray-600">Group</th>
                      <th className="text-left py-4 text-lg font-medium text-gray-600">Amount</th>
                      <th className="text-left py-4 text-lg font-medium text-gray-600">Due Date</th>
                      <th className="text-left py-4 text-lg font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'John Doe', group: 'Family Stokvel', amount: 'R500', dueDate: 'Tomorrow', status: 'pending' },
                      { name: 'Jane Smith', group: 'Savings Circle', amount: 'R750', dueDate: 'Oct 28', status: 'pending' },
                      { name: 'Mike Johnson', group: 'Investment Group', amount: 'R1000', dueDate: 'Oct 30', status: 'overdue' },
                      { name: 'Sarah Williams', group: 'Family Stokvel', amount: 'R500', dueDate: 'Nov 2', status: 'pending' },
                    ].map((payment, index) => (
                      <tr key={index} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="py-5 text-xl text-gray-800">{payment.name}</td>
                        <td className="py-5 text-xl text-gray-600">{payment.group}</td>
                        <td className="py-5 text-xl font-medium text-gray-800">{payment.amount}</td>
                        <td className="py-5 text-xl text-gray-600">{payment.dueDate}</td>
                        <td className="py-5">
                          <span className={`px-4 py-2 rounded-full text-lg font-medium ${
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="border border-gray-200 rounded-2xl p-6">
              <div className="border-b border-gray-200 pb-6 mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">Quick Actions</h3>
              </div>
              <div className="space-y-4">
                <button className="w-full text-left p-6 bg-blue-50 hover:bg-blue-100 rounded-2xl transition">
                  <span className="block text-xl font-bold text-blue-700">➕ Create New Group</span>
                  <span className="block text-lg text-blue-600 mt-2">Start a new savings group</span>
                </button>
                <button className="w-full text-left p-6 bg-green-50 hover:bg-green-100 rounded-2xl transition">
                  <span className="block text-xl font-bold text-green-700">👥 Add Members</span>
                  <span className="block text-lg text-green-600 mt-2">Invite new members</span>
                </button>
                <button className="w-full text-left p-6 bg-purple-50 hover:bg-purple-100 rounded-2xl transition">
                  <span className="block text-xl font-bold text-purple-700">⏰ Send Reminders</span>
                  <span className="block text-lg text-purple-600 mt-2">Notify about payments</span>
                </button>
                <button className="w-full text-left p-6 bg-yellow-50 hover:bg-yellow-100 rounded-2xl transition">
                  <span className="block text-xl font-bold text-yellow-700">📊 Generate Report</span>
                  <span className="block text-lg text-yellow-600 mt-2">Create monthly report</span>
                </button>
              </div>
            </div>

            {/* System Status */}
            <div className="border border-gray-200 rounded-2xl p-6">
              <div className="border-b border-gray-200 pb-6 mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">System Status</h3>
              </div>
              <div className="space-y-5">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="text-lg text-gray-700">SMS Service</span>
                  <span className="px-4 py-2 bg-green-100 text-green-800 text-lg font-medium rounded-full">Active</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="text-lg text-gray-700">Payment Processing</span>
                  <span className="px-4 py-2 bg-green-100 text-green-800 text-lg font-medium rounded-full">Active</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="text-lg text-gray-700">Database</span>
                  <span className="px-4 py-2 bg-green-100 text-green-800 text-lg font-medium rounded-full">Active</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                  <span className="text-lg text-gray-700">API Connectivity</span>
                  <span className="px-4 py-2 bg-green-100 text-green-800 text-lg font-medium rounded-full">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}