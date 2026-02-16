// app/api/auth/members/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

// In-memory storage (share with members route)
const membersByGroup: Record<string, any[]> = {};

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memberId = params.id;
    console.log(`DELETE /api/auth/members/${memberId} called`);
    
    // Find and delete member
    for (const groupId in membersByGroup) {
      const index = membersByGroup[groupId].findIndex(m => m.id === memberId);
      if (index !== -1) {
        membersByGroup[groupId].splice(index, 1);
        return NextResponse.json({
          success: true,
          message: 'Member deleted successfully'
        });
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Member not found'
    }, { status: 404 });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete member'
    }, { status: 500 });
  }
}