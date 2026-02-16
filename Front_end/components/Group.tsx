// components/Group.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReminderSettings from './ReminderSettings';
import SuccessModal from './SuccessModal';

interface GroupFormData {
  groupName: string;
  monthlyAmount: string;
  dueDay: string;
  description: string;
  reminderDays: number;
  reminderTime: string;
  smsTemplate: string;
  customMessage: string;
}

const defaultSmsTemplates = [
  {
    id: 'default',
    name: 'Default Template',
    message: 'Hi {name}, please pay R{amount} for {group} by {dueDate}.'
  },
  {
    id: 'friendly',
    name: 'Friendly Reminder',
    message: 'Hi {name}, a friendly reminder that your R{amount} payment for {group} is due on {dueDate}.'
  },
  {
    id: 'urgent',
    name: 'Urgent Reminder',
    message: 'URGENT: Hi {name}, please make your R{amount} payment for {group} immediately. Due: {dueDate}'
  },
  {
    id: 'custom',
    name: 'Custom Message',
    message: ''
  }
];

export default function Group() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<GroupFormData>({
    groupName: '',
    monthlyAmount: '',
    dueDay: '25',
    description: '',
    reminderDays: 3,
    reminderTime: '10:00',
    smsTemplate: 'default',
    customMessage: ''
  });

  const [errors, setErrors] = useState<Partial<GroupFormData>>({});

  const validateStep1 = () => {
    const newErrors: Partial<GroupFormData> = {};
    
    if (!formData.groupName.trim()) {
      newErrors.groupName = 'Group name is required';
    }
    
    if (!formData.monthlyAmount || parseFloat(formData.monthlyAmount) <= 0) {
      newErrors.monthlyAmount = 'Please enter a valid amount';
    }
    
    if (!formData.dueDay || parseInt(formData.dueDay) < 1 || parseInt(formData.dueDay) > 31) {
      newErrors.dueDay = 'Please select a valid due day (1-31)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'monthlyAmount') {
      // Allow only numbers and decimal point
      const numericValue = value.replace(/[^0-9.]/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field
    if (errors[name as keyof GroupFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const groupData = {
        name: formData.groupName,
        monthlyAmount: parseFloat(formData.monthlyAmount),
        dueDay: parseInt(formData.dueDay),
        description: formData.description,
        reminderDays: formData.reminderDays,
        reminderTime: formData.reminderTime,
        smsTemplate: formData.smsTemplate,
        customMessage: formData.smsTemplate === 'custom' ? formData.customMessage : undefined,
      };

      console.log('Creating group...', groupData);
      
      const response = await fetch('/api/auth/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupData),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('Group created successfully:', result);
        setCreatedGroupId(result.id || result.data?.id);
        
        // Show success message and then redirect to dashboard
        setShowSuccessModal(true);
        
        // Auto-redirect to dashboard after 2 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
          router.push('/admin/dashboard');
          router.refresh(); // Refresh to show updated data
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to create group');
      }
      
    } catch (error) {
      console.error('Error creating group:', error);
      alert(`Failed to create group: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSmsPreview = () => {
    const template = defaultSmsTemplates.find(t => t.id === formData.smsTemplate);
    let message = template?.message || '';
    
    if (formData.smsTemplate === 'custom' && formData.customMessage) {
      message = formData.customMessage;
    }
    
    // Replace placeholders with actual values
    return message
      .replace('{name}', 'John Doe')
      .replace('{amount}', formData.monthlyAmount || '0')
      .replace('{group}', formData.groupName || 'Your Group')
      .replace('{dueDate}', `${formData.dueDay}${getDaySuffix(parseInt(formData.dueDay))}`);
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

  return (
    <>
      {/* Step 1: Group Details */}
      {step === 1 && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Group Details</h2>
            <p className="text-gray-600">Enter the basic information for your new Stokvel group.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Group Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Group Name *
              </label>
              <input
                type="text"
                name="groupName"
                value={formData.groupName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.groupName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Family Stokvel, Savings Circle"
              />
              {errors.groupName && (
                <p className="text-red-600 text-sm">{errors.groupName}</p>
              )}
              <p className="text-sm text-gray-500">
                Choose a name that members will easily recognize
              </p>
            </div>

            {/* Monthly Amount */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Monthly Contribution Amount *
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                  R
                </div>
                <input
                  type="text"
                  name="monthlyAmount"
                  value={formData.monthlyAmount}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                    errors.monthlyAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="500.00"
                />
              </div>
              {errors.monthlyAmount && (
                <p className="text-red-600 text-sm">{errors.monthlyAmount}</p>
              )}
              <p className="text-sm text-gray-500">
                Amount each member contributes monthly
              </p>
            </div>

            {/* Due Day */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Due Day of Month *
              </label>
              <div className="relative">
                <select
                  name="dueDay"
                  value={formData.dueDay}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white ${
                    errors.dueDay ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>
                      {day}{getDaySuffix(day)} of each month
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  ▼
                </div>
              </div>
              {errors.dueDay && (
                <p className="text-red-600 text-sm">{errors.dueDay}</p>
              )}
              <p className="text-sm text-gray-500">
                Day when monthly payment is due
              </p>
            </div>

            {/* Next Payment Preview */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Next Payment Due
              </label>
              <div className="px-4 py-3 border border-gray-300 rounded-xl bg-gray-50">
                <p className="text-lg font-medium text-gray-800">
                  {formData.dueDay}{getDaySuffix(parseInt(formData.dueDay))} of next month
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {formData.monthlyAmount ? `R${formData.monthlyAmount}` : 'Amount not set'}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Group Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Brief description of the group's purpose, rules, or any special instructions..."
              />
              <p className="text-sm text-gray-500">
                This description will be visible to all group members
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-end pt-8 border-t">
            <button
              onClick={handleNextStep}
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition text-lg"
            >
              Continue to Reminder Settings →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Reminder Settings */}
      {step === 2 && (
        <ReminderSettings
          formData={formData}
          errors={errors}
          onChange={handleChange}
          onPrev={handlePrevStep}
          onNext={handleNextStep}
          defaultSmsTemplates={defaultSmsTemplates}
          getSmsPreview={getSmsPreview}
          getDaySuffix={getDaySuffix}
        />
      )}

      {/* Step 3: Review & Create */}
      {step === 3 && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Review & Create</h2>
            <p className="text-gray-600">Review your group settings before creating.</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">Group Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-blue-600">Group Name</p>
                  <p className="font-medium text-blue-900">{formData.groupName || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600">Monthly Amount</p>
                  <p className="font-medium text-blue-900">
                    {formData.monthlyAmount ? `R${formData.monthlyAmount}` : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-600">Due Day</p>
                  <p className="font-medium text-blue-900">
                    {formData.dueDay}{getDaySuffix(parseInt(formData.dueDay))} of each month
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Reminder Settings</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-green-600">Reminder Schedule</p>
                  <p className="font-medium text-green-900">
                    {formData.reminderDays} days before due date at {formData.reminderTime}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-600">SMS Template</p>
                  <p className="font-medium text-green-900">
                    {defaultSmsTemplates.find(t => t.id === formData.smsTemplate)?.name || 'Custom'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SMS Preview */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4">SMS Preview</h3>
            <div className="bg-white border border-yellow-300 rounded-xl p-4">
              <p className="text-gray-800 text-lg">{getSmsPreview()}</p>
              <p className="text-sm text-gray-500 mt-2">
                This is how the reminder SMS will appear to members
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-8 border-t">
            <button
              onClick={handlePrevStep}
              className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition text-lg"
            >
              ← Back to Reminder Settings
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Group...
                </span>
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success Modal - Auto redirect to dashboard */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Group Created Successfully!</h3>
            <p className="text-gray-600 mb-6">
              Your group "{formData.groupName}" has been created. Redirecting to dashboard...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}