// app/(auth)/admin/groups/new/page.tsx
import ProtectedRoute from '@/components/ProtectedRoute';
import Group from '@/components/Group';
import BackButton from '@/components/BackButton';

export const metadata = {
  title: 'Setup New Group - Stokvel Management',
  description: 'Create a new Stokvel group with payment tracking and automated reminders',
};

export default function SetupNewGroupPage() {
  return (
    <ProtectedRoute requireAdmin>
      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <BackButton />
            <h1 className="text-3xl font-bold text-gray-800">Create New Stokvel Group</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Set up a new group to start collecting contributions and managing members
          </p>
        </div>

        {/* Progress Steps */}
        <ProgressSteps />

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <Group />
        </div>

        {/* Help Section */}
        <HelpSection />
      </div>
    </ProtectedRoute>
  );
}

function ProgressSteps() {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-3xl">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
            1
          </div>
          <div className="ml-3">
            <span className="font-semibold text-gray-800">Group Details</span>
            <p className="text-xs text-gray-500 mt-0.5">Basic information</p>
          </div>
        </div>
        <div className="flex-1 h-1 bg-gradient-to-r from-blue-600 to-gray-200 mx-4"></div>
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 text-gray-600 flex items-center justify-center font-bold">
            2
          </div>
          <div className="ml-3">
            <span className="font-medium text-gray-600">Reminder Settings</span>
            <p className="text-xs text-gray-500 mt-0.5">SMS configuration</p>
          </div>
        </div>
        <div className="flex-1 h-1 bg-gray-200 mx-4"></div>
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 text-gray-600 flex items-center justify-center font-bold">
            3
          </div>
          <div className="ml-3">
            <span className="font-medium text-gray-600">Review & Create</span>
            <p className="text-xs text-gray-500 mt-0.5">Confirm settings</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpSection() {
  return (
    <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
      <div className="flex items-start">
        <div className="bg-white p-3 rounded-xl shadow-sm mr-5">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h1m1 0v4m0-11v4m0 4h.01M12 8h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Tips for creating a successful group</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start">
              <span className="text-blue-600 font-bold mr-2">•</span>
              <span className="text-gray-700"><span className="font-medium">Group Name:</span> Choose a name members will easily recognize and trust</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 font-bold mr-2">•</span>
              <span className="text-gray-700"><span className="font-medium">Monthly Amount:</span> Set an affordable amount that ensures regular contributions</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 font-bold mr-2">•</span>
              <span className="text-gray-700"><span className="font-medium">Due Date:</span> Pick a day when members typically have funds available</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 font-bold mr-2">•</span>
              <span className="text-gray-700"><span className="font-medium">Reminders:</span> Send SMS 2-3 days before due date for best results</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 font-bold mr-2">•</span>
              <span className="text-gray-700"><span className="font-medium">Description:</span> Add clear purpose and rules to help members understand the group</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-600 font-bold mr-2">•</span>
              <span className="text-gray-700"><span className="font-medium">Flexible:</span> All settings can be changed later as your group grows</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}