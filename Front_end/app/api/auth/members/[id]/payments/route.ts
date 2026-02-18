// app/api/auth/members/[id]/payments/route.ts
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

// POST a payment for a member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // AWAIT the params first!
    const { id } = await params;
    console.log(`💰 POST /api/auth/members/${id}/payments called`);
    
    const body = await request.json();
    console.log('Payment data:', body);
    
    // Validate
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Valid amount is required'
      }, { status: 400 });
    }
    
    // Find the member
    const membersData = await readMembers();
    let foundMember = null;
    let foundGroupId = null;
    
    for (const groupId in membersData) {
      const memberIndex = membersData[groupId].findIndex((m: any) => m.id === id);
      if (memberIndex !== -1) {
        foundMember = membersData[groupId][memberIndex];
        foundGroupId = groupId;
        
        // Update member payment status
        const previousTotal = foundMember.totalPaid || 0;
        foundMember.totalPaid = previousTotal + body.amount;
        foundMember.paymentStatus = 'paid';
        foundMember.lastPaymentDate = new Date().toISOString();
        foundMember.updatedAt = new Date().toISOString();
        
        // Add payment to history
        if (!foundMember.paymentHistory) {
          foundMember.paymentHistory = [];
        }
        
        foundMember.paymentHistory.push({
          id: `payment_${Date.now()}`,
          amount: body.amount,
          method: body.paymentMethod || 'cash',
          date: body.paymentDate || new Date().toISOString(),
          recordedAt: new Date().toISOString()
        });
        
        break;
      }
    }
    
    if (!foundMember) {
      return NextResponse.json({
        success: false,
        error: 'Member not found'
      }, { status: 404 });
    }
    
    // Save members data
    await writeMembers(membersData);
    
    // Update group total collected
    if (foundGroupId) {
      const groupsData = await readGroups();
      const groupIndex = groupsData.groups.findIndex((g: any) => g.id === foundGroupId);
      
      if (groupIndex !== -1) {
        groupsData.groups[groupIndex].totalCollected = 
          (groupsData.groups[groupIndex].totalCollected || 0) + body.amount;
        await writeGroups(groupsData);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: foundMember,
      message: 'Payment recorded successfully'
    });
    
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to record payment'
    }, { status: 500 });
  }
}

// GET payment history for a member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // AWAIT the params first!
    const { id } = await params;
    console.log(`📋 GET /api/auth/members/${id}/payments called`);
    
    const membersData = await readMembers();
    
    for (const groupId in membersData) {
      const member = membersData[groupId].find((m: any) => m.id === id);
      if (member) {
        return NextResponse.json({
          success: true,
          data: member.paymentHistory || []
        });
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Member not found'
    }, { status: 404 });
    
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch payment history'
    }, { status: 500 });
  }
}