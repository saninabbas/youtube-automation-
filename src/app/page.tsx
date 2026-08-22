import Link from 'next/link';

export default function MinimalLandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#090d16', color: '#f8fafc', fontFamily: 'sans-serif' }}>
      {/* Minimal Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '20px 32px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

          <Link href="/" style={{ fontSize: '20px', fontWeight: '800', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38bdf8' }} />
            Rankora <span style={{ color: '#38bdf8' }}>AI</span>
          </Link>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Link href="/admin" style={{ fontSize: '13px', color: '#fbbf24', textDecoration: 'none', fontWeight: 600 }}>
              Admin Console
            </Link>
            <Link href="/content" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none', fontWeight: 600 }}>
              Dashboard
            </Link>
            <Link href="/content/new" style={{ fontSize: '13px', background: '#38bdf8', color: '#090d16', padding: '8px 18px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700' }}>
              Create Video ➔
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '20px', fontSize: '12px', fontWeight: '600', marginBottom: '24px' }}>
          ✦ AI Video Automation SaaS
        </div>

        <h1 style={{ fontSize: '44px', fontWeight: '800', lineHeight: '1.2', letterSpacing: '-1px', marginBottom: '20px' }}>
          Automate Your YouTube Channels with AI
        </h1>

        <p style={{ fontSize: '16px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '32px' }}>
          Generate scripts, neural voiceover, video clips, subtitles & thumbnails — and publish direct to YouTube on 100% auto-pilot.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>

          <Link href="/content/new" style={{ padding: '14px 28px', background: '#38bdf8', color: '#090d16', borderRadius: '10px', fontWeight: '800', textDecoration: 'none', fontSize: '15px' }}>
            Create Your First Video 🚀
          </Link>
          <Link href="/content" style={{ padding: '14px 28px', background: '#1e293b', color: '#fff', borderRadius: '10px', fontWeight: '600', textDecoration: 'none', fontSize: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
            Open Dashboard
          </Link>
        </div>
      </main>

      {/* 3 Simple Steps */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>How It Works in 3 Simple Steps</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '24px', borderRadius: '14px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>1️⃣</div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Select Channel</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
              Pick your niche (Health, Tech, Finance) and target duration (1m, 3m, 5m, 8m, 10m).
            </p>
          </div>

          <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '24px', borderRadius: '14px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>2️⃣</div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Enter Topic</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
              Type any topic. AI generates script, voice, clips, captions & graphic thumbnail automatically.
            </p>
          </div>

          <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '24px', borderRadius: '14px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>3️⃣</div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Auto Publish</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
              Videos are automatically uploaded & scheduled to your YouTube channel on your timetable.
            </p>
          </div>
        </div>
      </section>

      {/* Clean Pricing */}
      <section style={{ maxWidth: '700px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Simple Pricing</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '24px', borderRadius: '14px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Starter</h3>
            <div style={{ fontSize: '32px', fontWeight: '800', margin: '12px 0', color: '#fff' }}>$29 <span style={{ fontSize: '12px', color: '#94a3b8' }}>/mo</span></div>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>10 Videos / month • 1 Channel</p>
            <Link href="/content/new" style={{ display: 'block', padding: '10px', background: '#1e293b', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
              Choose Starter
            </Link>
          </div>

          <div style={{ background: '#0f172a', border: '2px solid #38bdf8', padding: '24px', borderRadius: '14px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#38bdf8' }}>Pro Automator</h3>
            <div style={{ fontSize: '32px', fontWeight: '800', margin: '12px 0', color: '#fff' }}>$79 <span style={{ fontSize: '12px', color: '#94a3b8' }}>/mo</span></div>
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>50 Videos / month • 5 Channels • Auto Scheduler</p>
            <Link href="/content/new" style={{ display: 'block', padding: '10px', background: '#38bdf8', color: '#090d16', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}>
              Choose Pro
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
        © 2026 Rankora AI Video SaaS. All rights reserved.
      </footer>
    </div>
  );
}
