import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import AudioManager from '@/components/admin/AudioManager';
import { getServerSupabase, getSessionUser } from '@/lib/supabase/server';
import { getCourseContent } from '@/lib/content';
import { nativeKey } from '@/lib/native-audio-key';
import nativeAudio from '@/lib/native-audio.json';
import ttsAudio from '@/lib/tts-audio.json';
import { listAudioOverrides } from '@/lib/audio-overrides';

export const metadata: Metadata = { title: 'Audio' };
export const dynamic = 'force-dynamic';

const SLUG = 'catalan-a1';

export default async function AdminAudioPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/admin/audio');
  const supabase = await getServerSupabase();
  const { data: profile } = await supabase!.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
  if (!profile?.is_admin) notFound();

  const course = getCourseContent(SLUG);
  if (!course) notFound();

  const overrides = await listAudioOverrides(SLUG);
  const overrideKeys = new Set(overrides.map(o => o.text_key));
  const nat = nativeAudio.entries as Record<string, string[]>;
  const tts = ttsAudio.entries as Record<string, string[]>;

  const seen = new Set<string>();
  const texts = course.glossary.flatMap(g => {
    const key = nativeKey(g.ca);
    if (!key || seen.has(key)) return [];
    seen.add(key);
    const source = overrideKeys.has(key) ? 'override' : key in nat ? 'native' : key in tts ? 'tts' : 'none';
    return [{ key, label: g.ca, en: g.en, source }];
  });

  return (
    <>
      <SiteHeader />
      <main className="site-main">
        <div className="card">
          <h1>Audio recordings</h1>
          <p className="note">
            Record or upload audio for any course word/phrase. Uploads replace the built-in
            audio (native recording or generated TTS) at runtime — they always win. Files are
            stored in Supabase Storage and served over the CDN.
          </p>
          <AudioManager courseSlug={SLUG} texts={texts} overrides={overrides} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
