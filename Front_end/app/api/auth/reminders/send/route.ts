// app/api/auth/reminders/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const MEMBERS_FILE = path.join(process.cwd(), 'data', 'members.json');
const GROUPS_FILE = path.join(process.cwd(), 'data', 'groups.json');
const REMINDERS_FILE = path.join(process.cwd(), 'data', 'reminders.json');

// Helper to read data
async function readMembers() {
  try {
    const data = await fs.readFile(MEMBERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function readGroups() {
  try {
    const data = await fs.readFile(GROUPS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { groups: [] };
  }
}

async function readReminders() {
  try {
    const data = await fs.readFile(REMINDERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { logs: [] };
  }
}

async function writeReminders(data: any) {
  try {
    const dir = path.join(process.cwd(), 'data');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(REMINDERS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing reminders:', error);
  }
}

// POST /api/auth/reminders/send - Send manual reminders
export async function POST(request: NextRequest) {
  console.log('📤 POST /api/auth/reminders/send called');
  
  try {
    const body = await request.json();
    const { memberIds, message, groupId } = body;
    
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No members selected'
      }, { status: 400 });
    }
    
    // Read data
    const membersData = await readMembers();
    const groupsData = await readGroups();
    const remindersData = await readReminders();
    
    if (!remindersData.logs) {
      remindersData.logs = [];
    }
    
    const results = [];
    const errors = [];
    
    // Process each member
    for (const memberId of memberIds) {
      try {
        // Find member and their group
        let foundMember = null;
        let foundGroupId = null;
        let foundGroup = null;
        
        for (const gId in membersData) {
          const member = membersData[gId].find((m: any) => m.id === memberId);
          if (member) {
            foundMember = member;
            foundGroupId = gId;
            foundGroup = groupsData.groups.find((g: any) => g.id === gId);
            break;
          }
        }
        
        if (!foundMember || !foundGroup) {
          errors.push({ memberId, error: 'Member or group not found' });
          continue;
        }
        
        // Create message (use custom or generate from template)
        let finalMessage = message;
        if (!finalMessage) {
          finalMessage = foundGroup.smsTemplate || 
            `Hi {name}, this is a reminder for your R{amount} payment for {group}.`;
        }
        
        // Replace placeholders
        finalMessage = finalMessage
          .replace('{name}', foundMember.name)
          .replace('{amount}', foundGroup.monthlyAmount.toString())
          .replace('{group}', foundGroup.name)
          .replace('{dueDate}', `${foundGroup.dueDay}th`);
        
        // Simulate sending SMS (in real app, integrate with SMS provider)
        const success = Math.random() > 0.1; // 90% success rate for demo
        
        // Log the reminder
        const reminderLog = {
          id: `reminder_${Date.now()}_${memberId}`,
          memberId: foundMember.id,
          memberName: foundMember.name,
          memberPhone: foundMember.phone,
          groupId: foundGroupId,
          groupName: foundGroup.name,
          message: finalMessage,
          type: 'manual',
          status: success ? 'sent' : 'failed',
          sentAt: new Date().toISOString()
        };
        
        remindersData.logs.push(reminderLog);
        
        if (success) {
          results.push({ memberId: foundMember.id, status: 'sent' });
        } else {
          errors.push({ memberId: foundMember.id, error: 'SMS failed to send' });
        }
        
      } catch (memberError) {
        console.error('Error processing member:', memberError);
        errors.push({ memberId, error: 'Processing error' });
      }
    }
    
    // Save reminder logs
    await writeReminders(remindersData);
    
    return NextResponse.json({
      success: true,
      data: {
        sent: results.length,
        failed: errors.length,
        total: memberIds.length,
        results,
        errors
      },
      message: `Sent ${results.length} reminder(s), ${errors.length} failed`
    });
    
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send reminders'
    }, { status: 500 });
  }
}