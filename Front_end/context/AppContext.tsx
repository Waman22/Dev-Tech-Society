// contexts/AppContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the group data structure
export interface GroupData {
  id: string;
  name: string;
  monthlyAmount: string;
  dueDay: string;
  description: string;
  reminderDays: number;
  reminderTime: string;
  smsTemplate: string;
  customMessage: string;
  createdAt: string;
}

// Define the context type
interface AppContextType {
  groups: GroupData[];
  addGroup: (groupData: Omit<GroupData, 'id' | 'createdAt'>) => GroupData;
  getGroup: (id: string) => GroupData | undefined;
  updateGroup: (id: string, updates: Partial<GroupData>) => void;
  deleteGroup: (id: string) => void;
  getGroups: () => GroupData[];
}

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Create the provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<GroupData[]>([]);

  // Add a new group
  const addGroup = (groupData: Omit<GroupData, 'id' | 'createdAt'>): GroupData => {
    const newGroup: GroupData = {
      ...groupData,
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setGroups(prev => [...prev, newGroup]);
    console.log('Group added to in-memory storage:', newGroup);
    console.log('Total groups in memory:', groups.length + 1);
    return newGroup;
  };

  // Get a specific group by ID
  const getGroup = (id: string): GroupData | undefined => {
    return groups.find(group => group.id === id);
  };

  // Update a group
  const updateGroup = (id: string, updates: Partial<GroupData>) => {
    setGroups(prev =>
      prev.map(group => 
        group.id === id ? { ...group, ...updates } : group
      )
    );
  };

  // Delete a group
  const deleteGroup = (id: string) => {
    setGroups(prev => prev.filter(group => group.id !== id));
  };

  // Get all groups
  const getGroups = (): GroupData[] => {
    return [...groups]; // Return a copy
  };

  const value: AppContextType = {
    groups,
    addGroup,
    getGroup,
    updateGroup,
    deleteGroup,
    getGroups,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the context
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}