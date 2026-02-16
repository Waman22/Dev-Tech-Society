// src/app/api/groups/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { groupsStorage } from '@/lib/storage/groupsStorage';

export async function GET(request: NextRequest) {
  try {
    const stats = await groupsStorage.getGroupsStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching group stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}