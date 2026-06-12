'use client';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabase/client';

export default function SignOutButton({ className = 'btn' }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button" className={className} data-test="signout"
      onClick={async () => {
        await getBrowserSupabase()?.auth.signOut();
        router.push('/');
        router.refresh();
      }}
    >Sign out</button>
  );
}
