'use client';

interface ReminderSettingsProps {
  formData: any;
  errors: any;
  onChange: (e: any) => void;
  onPrev: () => void;
  onNext: () => void;
  defaultSmsTemplates: any[];
  getSmsPreview: () => string;
  getDaySuffix: (day: number) => string;
}

export default function ReminderSettings({
  formData,
  errors,
  onChange,
  onPrev,
  onNext,
  defaultSmsTemplates,
  getSmsPreview,
  getDaySuffix,
}: ReminderSettingsProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Reminder Settings</h2>
        <p className="text-gray-600">Configure automated payment reminders for members.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Reminder Days */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Days Before Due Date to Send Reminder *
          </label>
          <div className="flex space-x-2">
            {[1, 2, 3, 5, 7].map(days => (
              <button
                key={days}
                type="button"
                onClick={() => onChange({ target: { name: 'reminderDays', value: days } })}
                className={`flex-1 py-3 text-center border rounded-xl font-medium transition ${
                  formData.reminderDays === days
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                }`}
              >
                {days} {days === 1 ? 'Day' : 'Days'}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            When to send reminder SMS before payment due date
          </p>
        </div>

        {/* Reminder Time */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Time of Day to Send *
          </label>
          <div className="relative">
            <select
              name="reminderTime"
              value={formData.reminderTime}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            >
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i.toString().padStart(2, '0');
                return [`${hour}:00`, `${hour}:30`];
              }).flat().map(time => (
                <option key={time} value={time}>
                  {parseInt(time.split(':')[0]) >= 12 
                    ? `${parseInt(time.split(':')[0]) === 12 ? 12 : parseInt(time.split(':')[0]) - 12}:${time.split(':')[1]} PM`
                    : `${time} AM`}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              ▼
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Time when SMS reminders will be sent
          </p>
        </div>

        {/* SMS Template */}
        <div className="md:col-span-2 space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            SMS Template *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {defaultSmsTemplates.map(template => (
              <button
                key={template.id}
                type="button"
                onClick={() => onChange({ target: { name: 'smsTemplate', value: template.id } })}
                className={`p-4 border rounded-xl text-left transition ${
                  formData.smsTemplate === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center mb-2">
                  <div className={`w-4 h-4 rounded-full border mr-2 ${
                    formData.smsTemplate === template.id
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-400'
                  }`}></div>
                  <span className="font-medium">{template.name}</span>
                </div>
                <p className="text-sm text-gray-600">
                  {template.id === 'custom' ? 'Write your own message' : template.message.substring(0, 60)}...
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Message (if custom template selected) */}
        {formData.smsTemplate === 'custom' && (
          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Custom SMS Message *
            </label>
            <textarea
              name="customMessage"
              value={formData.customMessage}
              onChange={onChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Write your custom reminder message here..."
            />
            <div className="text-sm text-gray-500 space-y-1">
              <p>Available placeholders:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <code className="px-2 py-1 bg-gray-100 rounded text-sm">{'{name}'}</code>
                <code className="px-2 py-1 bg-gray-100 rounded text-sm">{'{amount}'}</code>
                <code className="px-2 py-1 bg-gray-100 rounded text-sm">{'{group}'}</code>
                <code className="px-2 py-1 bg-gray-100 rounded text-sm">{'{dueDate}'}</code>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SMS Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">SMS Preview</h3>
        <div className="bg-white border border-gray-300 rounded-xl p-4">
          <div className="flex items-start mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">To: +27 82 123 4567</p>
              <p className="text-gray-800 text-lg mt-2">{getSmsPreview()}</p>
              <p className="text-xs text-gray-400 mt-3">SMS • Now</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 border-t pt-4">
            Preview shows how the message will appear to a member named "John Doe"
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-8 border-t">
        <button
          onClick={onPrev}
          className="px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition text-lg"
        >
          ← Back to Group Details
        </button>
        <button
          onClick={onNext}
          className="px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition text-lg"
        >
          Review & Create →
        </button>
      </div>
    </div>
  );
}