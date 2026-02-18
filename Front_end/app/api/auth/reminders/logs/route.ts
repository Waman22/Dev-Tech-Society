// app/api/auth/reminders/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const REMINDERS_FILE = path.join(process.cwd(), 'data', 'reminders.json');

// Helper to read reminders
async function readReminders() {
  try {
    const data = await fs.readFile(REMINDERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { logs: [] };
  }
}

// Helper to write reminders
async function writeReminders(data: any) {
  try {
    const dir = path.join(process.cwd(), 'data');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(REMINDERS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing reminders:', error);
  }
}

// GET /api/auth/reminders/logs - Fetch all reminder logs
export async function GET(request: NextRequest) {
  console.log('📋 GET /api/auth/reminders/logs called');
  
  try {
    const data = await readReminders();
    
    // Get query parameters for filtering
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const type = url.searchParams.get('type');
    const days = url.searchParams.get('days');
    
    let logs = data.logs || [];
    
    // Apply filters
    if (status && status !== 'all') {
      logs = logs.filter((log: any) => log.status === status);
    }
    
    if (type && type !== 'all') {
      logs = logs.filter((log: any) => log.type === type);
    }
    
    if (days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - parseInt(days));
      logs = logs.filter((log: any) => new Date(log.sentAt) >= cutoff);
    }
    
    // Sort by date (newest first)
    logs.sort((a: any, b: any) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    
    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length,
      total: data.logs?.length || 0
    });
  } catch (error) {
    console.error('Error fetching reminder logs:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch reminder logs',
      data: []
    }, { status: 500 });
  }
}

// POST /api/auth/reminders/logs - Create a new reminder log
export async function POST(request: NextRequest) {
  console.log('📝 POST /api/auth/reminders/logs called');
  
  try {
    const body = await request.json();
    const data = await readReminders();
    
    if (!data.logs) {
      data.logs = [];
    }
    
    const newLog = {
      id: `reminder_${Date.now()}`,
      ...body,
      sentAt: body.sentAt || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    data.logs.push(newLog);
    await writeReminders(data);
    
    return NextResponse.json({
      success: true,
      data: newLog,
      message: 'Reminder log created'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating reminder log:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create reminder log'
    }, { status: 500 });
  }
}