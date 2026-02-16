// app/api/auth/groups/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// File path for persistent storage
const STORAGE_FILE = path.join(process.cwd(), 'data', 'groups.json');

// Ensure data directory exists
async function ensureStorage() {
  const dir = path.join(process.cwd(), 'data');
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
}

// Read groups from file
async function readGroups() {
  try {
    await ensureStorage();
    const data = await fs.readFile(STORAGE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet, return empty array
    return { groups: [], lastId: 0 };
  }
}

// Write groups to file
async function writeGroups(data: any) {
  try {
    await ensureStorage();
    await fs.writeFile(STORAGE_FILE, JSON.stringify(data, null, 2));
    console.log('✅ Groups saved to file:', STORAGE_FILE);
  } catch (error) {
    console.error('Error writing groups to file:', error);
    throw error;
  }
}

export async function GET() {
  console.log('GET /api/auth/groups called');
  
  try {
    const data = await readGroups();
    
    return NextResponse.json({
      success: true,
      data: data.groups,
      count: data.groups.length,
      message: 'Groups loaded from persistent storage'
    });
  } catch (error) {
    console.error('Error reading groups:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to read groups',
      data: []
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('POST /api/auth/groups called');
  
  try {
    // Parse the request body
    let body;
    try {
      body = await request.json();
      console.log('Request body:', body);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON in request body'
      }, { status: 400 });
    }
    
    // Basic validation
    if (!body.name) {
      console.log('Missing name');
      return NextResponse.json({
        success: false,
        error: 'Group name is required'
      }, { status: 400 });
    }
    
    if (!body.monthlyAmount && body.monthlyAmount !== 0) {
      console.log('Missing monthlyAmount');
      return NextResponse.json({
        success: false,
        error: 'Monthly amount is required'
      }, { status: 400 });
    }
    
    if (!body.dueDay && body.dueDay !== 0) {
      console.log('Missing dueDay');
      return NextResponse.json({
        success: false,
        error: 'Due day is required'
      }, { status: 400 });
    }
    
    // Read existing groups
    const data = await readGroups();
    
    // Create the group
    const newGroup = {
      id: `group_${Date.now()}`,
      name: body.name.toString(),
      monthlyAmount: parseFloat(body.monthlyAmount),
      dueDay: parseInt(body.dueDay),
      description: body.description || '',
      reminderDays: body.reminderDays || 3,
      reminderTime: body.reminderTime || '10:00',
      smsTemplate: body.smsTemplate || 'default',
      customMessage: body.customMessage || null,
      totalMembers: 0,
      totalCollected: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    console.log('Created group object:', newGroup);
    
    // Add to array
    data.groups.push(newGroup);
    data.lastId += 1;
    
    // Save to file
    await writeGroups(data);
    
    return NextResponse.json({
      success: true,
      id: newGroup.id,
      data: newGroup,
      message: 'Group created successfully! (Saved permanently)'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Unexpected error in POST:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}