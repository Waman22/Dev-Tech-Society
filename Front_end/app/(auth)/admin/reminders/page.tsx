// app/(auth)/admin/reminders/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RemindersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin/reminders/logs');
  }, [router]);

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
    </div>
  );
}