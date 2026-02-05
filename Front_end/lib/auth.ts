export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
}

// Mock database - replace with real database
const users: User[] = [
  {
    id: '1',
    email: 'admin@stokvel.com',
    name: 'Admin User',
    role: 'admin',
  },
  {
    id: '2',
    email: 'user@example.com',
    name: 'Regular User',
    role: 'member',
  },
];

// Simple password verification (in production, use hashed passwords)
const passwords: Record<string, string> = {
  'admin@stokvel.com': 'admin123',
  'user@example.com': 'user123',
};

export async function authenticate(email: string, password: string): Promise<User | null> {
  const user = users.find(u => u.email === email);
  if (!user) return null;
  
  if (passwords[email] === password) {
    return user;
  }
  
  return null;
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}

export function getUserByEmail(email: string): User | undefined {
  return users.find(u => u.email === email);
}