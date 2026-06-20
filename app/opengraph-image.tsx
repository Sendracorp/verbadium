import { ImageResponse } from 'next/og';

export const alt = 'Verbadium — Learn Catalan online (A1 exam course)';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Branded social-share card (used for link previews on every page by default).
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '90px', fontFamily: 'sans-serif',
          background: 'linear-gradient(135deg, #F3FAF9 0%, #BFE9D8 55%, #CBCEF8 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{
            width: 92, height: 92, borderRadius: 24, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 50, fontWeight: 800, color: '#2A2438',
            background: 'linear-gradient(135deg, #E0D5F2, #C7DCEE)',
          }}>Vb</div>
          <div style={{ fontSize: 46, fontWeight: 800, color: '#1F2A30' }}>Verbadium</div>
        </div>
        <div style={{ fontSize: 82, fontWeight: 800, color: '#1F2A30', marginTop: 44, lineHeight: 1.04 }}>
          Learn Catalan online
        </div>
        <div style={{ fontSize: 34, color: '#1F2A30', opacity: 0.78, marginTop: 22 }}>
          Interactive A1 exam course · native audio · IPA · 100+ exercises · mock exam
        </div>
      </div>
    ),
    { ...size },
  );
}
