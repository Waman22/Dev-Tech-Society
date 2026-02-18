// app/api/auth/groups/[id]/members/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const MEMBERS_FILE = path.join(process.cwd(), 'data', 'members.json');
const GROUPS_FILE = path.join(process.cwd(), 'data', 'groups.json');

async function readMembers() {
  try {
    const data = await fs.readFile(MEMBERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

async function writeMembers(data: any) {
  try {
    const dir = path.join(process.cwd(), 'data');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(MEMBERS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing members:', error);
  }
}

async function readGroups() {
  try {
    const data = await fs.readFile(GROUPS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { groups: [], lastId: 0 };
  }
}

async function writeGroups(data: any) {
  try {
    await fs.writeFile(GROUPS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing groups:', error);
  }
}

// GET members for a specific group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // AWAIT the params first!
    const { id } = await params;
    console.log(`📋 GET /api/auth/groups/${id}/members called`);
    
    const membersData = await readMembers();
    const groupMembers = membersData[id] || [];
    
    return NextResponse.json({
      success: true,
      data: groupMembers,
      count: groupMembers.length
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch members'
    }, { status: 500 });
  }
}

// POST a new member to a group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // AWAIT the params first!
    const { id } = await params;
    console.log(`📝 POST /api/auth/groups/${id}/members called`);
    
    const body = await request.json();
    console.log('Request body:', body);
    
    // Validate required fields
    if (!body.name || !body.phone) {
      return NextResponse.json({
        success: false,
        error: 'Name and phone number are required'
      }, { status: 400 });
    }
    
    // Read existing members
    const membersData = await readMembers();
    
    // Initialize group members array if it doesn't exist
    if (!membersData[id]) {
      membersData[id] = [];
    }
    
    // Create new member
    const newMember = {
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: body.name,
      phone: body.phone,
      email: body.email || '',
      idNumber: body.idNumber || '',
      paymentStatus: 'pending',
      totalPaid: 0,
      lastPaymentDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to group
    membersData[id].push(newMember);
    
    // Save members data
    await writeMembers(membersData);
    console.log('✅ Member saved');
    
    // Update group member count
    try {
      const groupsData = await readGroups();
      const groupIndex = groupsData.groups.findIndex((g: any) => g.id === id);
      
      if (groupIndex !== -1) {
        groupsData.groups[groupIndex].totalMembers = membersData[id].length;
        await writeGroups(groupsData);
        console.log('✅ Group member count updated');
      }
    } catch (groupError) {
      console.error('Error updating group count:', groupError);
    }
    
    return NextResponse.json({
      success: true,
      data: newMember,
      message: 'Member added successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add member',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE all members of a group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // AWAIT the params first!
    const { id } = await params;
    console.log(`🗑️ DELETE /api/auth/groups/${id}/members called`);
    
    const membersData = await readMembers();
    
    if (membersData[id]) {
      delete membersData[id];
      await writeMembers(membersData);
      console.log('✅ All members of group deleted');
      
      // Update group member count
      const groupsData = await readGroups();
      const groupIndex = groupsData.groups.findIndex((g: any) => g.id === id);
      if (groupIndex !== -1) {
        groupsData.groups[groupIndex].totalMembers = 0;
        await writeGroups(groupsData);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'All members deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting members:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete members'
    }, { status: 500 });
  }
}