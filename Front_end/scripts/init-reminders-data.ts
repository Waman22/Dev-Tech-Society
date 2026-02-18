// scripts/init-reminders-data.ts
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const remindersFile = path.join(dataDir, 'reminders.json');
const settingsFile = path.join(dataDir, 'reminder-settings.json');

console.log('📁 Initializing reminders data...');

// Create data directory
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ Created data directory');
}

// Create reminders.json with sample data
if (!fs.existsSync(remindersFile)) {
  const sampleReminders = {
    logs: [
      {
        id: 'reminder_1',
        memberId: 'member_1',
        memberName: 'John Khosa',
        memberPhone: '0821234567',
        groupId: 'group_1',
        groupName: 'Family Funeral Cover',
        message: 'Hi John, your funeral premium of R150 for Family Funeral Cover is due on 25th.',
        type: 'scheduled',
        status: 'sent',
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'reminder_2',
        memberId: 'member_2',
        memberName: 'Mary Dlamini',
        memberPhone: '0832345678',
        groupId: 'group_1',
        groupName: 'Family Funeral Cover',
        message: 'Hi Mary, your funeral premium of R150 for Family Funeral Cover is due on 25th.',
        type: 'scheduled',
        status: 'sent',
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'reminder_3',
        memberId: 'member_3',
        memberName: 'Thabo Nkosi',
        memberPhone: '0843456789',
        groupId: 'group_2',
        groupName: 'Premium Funeral Plan',
        message: 'URGENT: Your funeral premium of R250 is 5 days overdue. Please pay immediately.',
        type: 'overdue',
        status: 'sent',
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  };
  
  fs.writeFileSync(remindersFile, JSON.stringify(sampleReminders, null, 2));
  console.log('✅ Created reminders.json with sample data');
}

// Create reminder-settings.json
if (!fs.existsSync(settingsFile)) {
  const sampleSettings = {
    globalSettings: {
      defaultReminderDays: 3,
      defaultReminderTime: '10:00',
      maxRetries: 3,
      retryInterval: 3600,
      enableAutoReminders: true
    },
    groupSettings: {}
  };
  
  fs.writeFileSync(settingsFile, JSON.stringify(sampleSettings, null, 2));
  console.log('✅ Created reminder-settings.json');
}

console.log(' Reminders data initialization complete!');