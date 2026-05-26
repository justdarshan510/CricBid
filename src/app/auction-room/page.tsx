'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuctionRoomPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/lobby');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-fade-in">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]"></div>
      <p className="mt-4 text-slate-400">Redirecting to multiplayer lobby...</p>
    </div>
  );
}
