'use client';
import { useRouter } from 'next/navigation';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { getDict, type Locale } from '@/lib/i18n';

export default function SignOutButton({ className = 'btn', lang = 'en' }: { className?: string; lang?: Locale }) {
  const router = useRouter();
  return (
    <button
      type="button" className={className} data-test="signout"
      onClick={async () => {
        await getBrowserSupabase()?.auth.signOut();
        router.push('/');
        router.refresh();
      }}
    >{getDict(lang).acct.logout}</button>
  );
}
