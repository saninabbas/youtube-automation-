import Link from 'next/link';

export default function SaaSLandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#090d16', color: '#f8fafc', fontFamily: 'sans-serif' }}>
      {/* Header Bar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.08)', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #38bdf8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', color: '#fff' }}>
            R
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Rankora <span style={{ color: '#38bdf8' }}>AI</span>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', fontSize: '14px', color: '#94a3b8' }}>
          <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Features</a>
          <a href="#workflow" style={{ color: 'inherit', textDecoration: 'none' }}>Visual Workflow</a>
          <a href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</a>
          <Link href="/channels" style={{ color: 'inherit', textDecoration: 'none' }}>Channels</Link>
          <Link href="/admin" style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: 600 }}>Super Admin</Link>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/content" className="btn btn-secondary" style={{ textDecoration: 'none', fontSize: '13px' }}>
            Dashboard
          </Link>
          <Link href="/content/new" className="btn btn-primary" style={{ textDecoration: 'none', fontSize: '13px' }}>
            Launch App ➔
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: '80px 20px 60px', textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '20px', fontSize: '12px', color: '#38bdf8', fontWeight: '600', marginBottom: '24px' }}>
          ✦ Autonomous AI Video SaaS 2.0
        </div>

        <h1 style={{ fontSize: '48px', fontWeight: '800', lineHeight: '1.15', letterSpacing: '-1.5px', marginBottom: '20px', background: 'linear-gradient(180deg, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Turn Any Topic Into Publish-Ready YouTube & Short Videos on Auto-Pilot
        </h1>

        <p style={{ fontSize: '18px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '36px', maxWidth: '750px', margin: '0 auto 36px' }}>
          Fully integrated AI video pipeline: Gemini Script Writing, 24kHz Neural Voiceover, 8-Sec Visual Clips, Styled Subtitles, 1280x720 Graphic Thumbnails, and Scheduled Release to YouTube.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center' }}>
          <Link href="/content/new" style={{ padding: '14px 28px', background: 'linear-gradient(135deg, #38bdf8, #3b82f6)', color: '#fff', borderRadius: '10px', fontWeight: '700', textDecoration: 'none', fontSize: '15px', boxShadow: '0 4px 20px rgba(56, 189, 248, 0.3)' }}>
            Start Video Generation 🚀
          </Link>
          <Link href="/content" style={{ padding: '14px 28px', background: '#1e293b', color: '#f8fafc', borderRadius: '10px', fontWeight: '600', textDecoration: 'none', fontSize: '15px', border: '1px solid rgba(255,255,255,0.1)' }}>
            View Dashboard Demo
          </Link>
        </div>
      </section>

      {/* n8n-Style Interactive Workflow Preview */}
      <section id="workflow" style={{ padding: '60px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Visual Node Pipeline Architecture (n8n Mode)</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Every video project executes through an interactive, transparent 8-stage node pipeline</p>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', textAlign: 'center' }}>
          {[
            { icon: '🎯', label: 'Topic Input' },
            { icon: '🧠', label: 'AI Script (Gemini)' },
            { icon: '🎙️', label: 'Neural Voice' },
            { icon: '🎬', label: '8s Visual Clips' },
            { icon: '📝', label: 'SRT Subtitles' },
            { icon: '🎞️', label: 'FFmpeg Render' },
            { icon: '🖼️', label: '1280x720 Thumb' },
            { icon: '🚀', label: 'YouTube Upload' },
          ].map((item, idx) => (
            <div key={idx} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '16px 8px' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{item.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#e2e8f0' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Platform Capabilities Grid */}
      <section id="features" style={{ padding: '60px 20px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Everything Needed for Multi-Channel Video SaaS</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Built for high-volume content creators, digital marketers, and video agencies</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '24px' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🧠</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>AI Script Engine</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6' }}>
              Generates deep narrative structures (1m, 3m, 5m, 8m, 10m) calibrated to exact natural spoken rate with zero fluff.
            </p>
          </div>

          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '24px' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🎙️</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Neural Voice Synthesis</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6' }}>
              Crystal clear 24kHz EdgeTTS audio with multi-language support, custom voice speed rates, and automatic fallback.
            </p>
          </div>

          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '24px' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🎬</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Dynamic Visual Motion</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6' }}>
              Sequenced 8-second visual motion clips with camera movement vectors, lighting, and environmental continuity.
            </p>
          </div>

          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '24px' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>📝</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Styled Mobile Subtitles</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6' }}>
              Auto-aligned SRT & VTT subtitles styled in high-contrast yellow glow bold fonts for maximum audience engagement.
            </p>
          </div>

          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '24px' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🖼️</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>1280x720 Graphic Thumbnails</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6' }}>
              Generates custom high-impact PNG thumbnails formatted for YouTube click-through optimization.
            </p>
          </div>

          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '24px' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>🚀</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>YouTube Direct Publishing</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.6' }}>
              Google OAuth 2.0 direct upload, custom thumbnail attachment, timestamped chapters, and release scheduler.
            </p>
          </div>
        </div>
      </section>

      {/* SaaS Pricing Tiers */}
      <section id="pricing" style={{ padding: '60px 20px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Simple, Scalable Pricing</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Choose the automation tier that fits your video production volume</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Starter Automator</h3>
            <div style={{ fontSize: '36px', fontWeight: '800', color: '#fff', marginBottom: '16px' }}>$29 <span style={{ fontSize: '14px', color: '#94a3b8' }}>/mo</span></div>
            <ul style={{ textAlign: 'left', color: '#94a3b8', fontSize: '13px', lineHeight: '2', paddingLeft: '16px', marginBottom: '24px' }}>
              <li>10 Videos / month</li>
              <li>1 YouTube Channel</li>
              <li>1080p FFmpeg Compositor</li>
              <li>1280x720 Graphic Thumbnails</li>
              <li>Standard 5-min Preset</li>
            </ul>
            <Link href="/content/new" style={{ display: 'block', padding: '10px 0', background: '#1e293b', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>
              Get Started
            </Link>
          </div>

          <div style={{ background: '#0f172a', border: '2px solid #38bdf8', borderRadius: '16px', padding: '32px', textAlign: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#38bdf8', color: '#090d16', padding: '2px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>MOST POPULAR</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Pro Automator</h3>
            <div style={{ fontSize: '36px', fontWeight: '800', color: '#fff', marginBottom: '16px' }}>$79 <span style={{ fontSize: '14px', color: '#94a3b8' }}>/mo</span></div>
            <ul style={{ textAlign: 'left', color: '#94a3b8', fontSize: '13px', lineHeight: '2', paddingLeft: '16px', marginBottom: '24px' }}>
              <li>50 Videos / month</li>
              <li>5 YouTube Channels</li>
              <li>Auto-Publishing Scheduler</li>
              <li>8-Min Long-Form Calibration</li>
              <li>Priority Render Queue</li>
            </ul>
            <Link href="/content/new" style={{ display: 'block', padding: '10px 0', background: 'linear-gradient(135deg, #38bdf8, #3b82f6)', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '14px' }}>
              Start Pro Trial
            </Link>
          </div>

          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Agency Swarm</h3>
            <div style={{ fontSize: '36px', fontWeight: '800', color: '#fff', marginBottom: '16px' }}>$199 <span style={{ fontSize: '14px', color: '#94a3b8' }}>/mo</span></div>
            <ul style={{ textAlign: 'left', color: '#94a3b8', fontSize: '13px', lineHeight: '2', paddingLeft: '16px', marginBottom: '24px' }}>
              <li>Unlimited Videos</li>
              <li>Unlimited Channels</li>
              <li>External Real AI Video Keys</li>
              <li>Dedicated Queue Worker</li>
              <li>Super Admin Oversight Access</li>
            </ul>
            <Link href="/content/new" style={{ display: 'block', padding: '10px 0', background: '#1e293b', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
        <p>© 2026 Rankora AI Video Automation SaaS. All rights reserved.</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px' }}>
          <Link href="/content" style={{ color: '#94a3b8', textDecoration: 'none' }}>Dashboard</Link>
          <Link href="/channels" style={{ color: '#94a3b8', textDecoration: 'none' }}>Channels</Link>
          <Link href="/calendar" style={{ color: '#94a3b8', textDecoration: 'none' }}>Calendar</Link>
          <Link href="/settings/publishing" style={{ color: '#94a3b8', textDecoration: 'none' }}>Settings</Link>
          <Link href="/admin" style={{ color: '#fbbf24', textDecoration: 'none' }}>Super Admin</Link>
        </div>
      </footer>
    </div>
  );
}
