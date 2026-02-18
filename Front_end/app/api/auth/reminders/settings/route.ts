// app/api/auth/reminders/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'reminder-settings.json');

// Helper to read settings
async function readSettings() {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {
      globalSettings: {
        defaultReminderDays: 3,
        defaultReminderTime: '10:00',
        maxRetries: 3,
        retryInterval: 3600, // seconds
        enableAutoReminders: true
      },
      groupSettings: {}
    };
  }
}

// Helper to write settings
async function writeSettings(data: any) {
  try {
    const dir = path.join(process.cwd(), 'data');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing settings:', error);
  }
}

// GET /api/auth/reminders/settings - Fetch reminder settings
export async function GET(request: NextRequest) {
  console.log('⚙️ GET /api/auth/reminders/settings called');
  
  try {
    const settings = await readSettings();
    
    // Check if group-specific settings requested
    const url = new URL(request.url);
    const groupId = url.searchParams.get('groupId');
    
    if (groupId) {
      return NextResponse.json({
        success: true,
        data: settings.groupSettings[groupId] || settings.globalSettings
      });
    }
    
    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch settings'
    }, { status: 500 });
  }
}

// POST /api/auth/reminders/settings - Update reminder settings
export async function POST(request: NextRequest) {
  console.log('⚙️ POST /api/auth/reminders/settings called');
  
  try {
    const body = await request.json();
    const { groupId, settings } = body;
    
    const currentSettings = await readSettings();
    
    if (groupId) {
      // Update group-specific settings
      if (!currentSettings.groupSettings) {
        currentSettings.groupSettings = {};
      }
      currentSettings.groupSettings[groupId] = {
        ...currentSettings.groupSettings[groupId],
        ...settings
      };
    } else {
      // Update global settings
      currentSettings.globalSettings = {
        ...currentSettings.globalSettings,
        ...settings
      };
    }
    
    await writeSettings(currentSettings);
    
    return NextResponse.json({
      success: true,
      data: currentSettings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update settings'
    }, { status: 500 });
  }
}

// PUT /api/auth/reminders/settings - Bulk update
export async function PUT(request: NextRequest) {
  return POST(request);
}