'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { InteractiveWorkflowCanvas } from './InteractiveWorkflowCanvas';

export function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const faqs = [
    {
      q: 'How many videos can I create each month?',
      a: 'Your subscription includes 30 full-length completed videos every month (1 video per day). With our Zero-Waste Policy, any failed generation never consumes your monthly allowance.'
    },
    {
      q: 'Can I choose or use my own voice?',
      a: 'Yes! You can choose from 5 studio-quality AI voices (Rachel, Adam, Antoni, Bella, Christopher) or simply enter your own ElevenLabs Voice ID to narrate videos with your cloned voice.'
    },
    {
      q: 'Can I download the finished MP4 video file?',
      a: 'Absolutely. Every video generated is available for immediate 1-click download as a full 1080p MP4 file with crisp H.264 video, stereo AAC audio, and optional burned-in subtitles.'
    },
    {
      q: 'Do I need any video editing experience?',
      a: 'Zero experience required. You only provide your video topic or headline. The AI automatically writes the script, organizes scenes, synthesizes narration, aligns visuals, and builds the MP4.'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#f4f4f5', fontFamily: 'var(--font-sans, sans-serif)', overflowX: 'hidden', width: '100%', maxWidth: '100vw' }}>
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .desktop-auth {
            display: none !important;
          }
          .mobile-menu-btn {
            display: inline-flex !important;
          }
          .hero-pipeline-ribbon {
            flex-direction: column !important;
            gap: 8px !important;
          }
          .landing-header-inner {
            padding: 0 16px !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn {
            display: none !important;
          }
          .mobile-nav-drawer {
            display: none !important;
          }
        }
      `}</style>
      {/* ─────────────────────────────────────────────────────────────
          1. MINIMAL HEADER / NAVBAR
      ───────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(9, 9, 11, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div className="landing-header-inner" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#fff', flexShrink: 0 }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3" fill="#fff" />
              </svg>
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.04em' }}>AUTORA</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            <a href="#how-it-works" style={{ color: '#a1a1aa', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>How It Works</a>
            <a href="#integrations" style={{ color: '#a1a1aa', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Integrations</a>
            <a href="#ai-models" style={{ color: '#a1a1aa', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>AI Models</a>
            <a href="#voices" style={{ color: '#a1a1aa', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Voices</a>
            <a href="#pricing" style={{ color: '#a1a1aa', textDecoration: 'none', fontSize: '14px', fontWeight: 500 }}>Pricing</a>
          </nav>

          {/* Desktop Auth Links */}
          <div className="desktop-auth" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/login" style={{ color: '#e4e4e7', textDecoration: 'none', fontSize: '14px', fontWeight: 500, padding: '8px 14px' }}>
              Log In
            </Link>
            <Link href="/signup" style={{
              background: '#ffffff',
              color: '#09090b',
              padding: '8px 18px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              Create Your First Video ➔
            </Link>
          </div>

          {/* Mobile Right Controls: CTA + Hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href="/signup" style={{
              background: '#ffffff',
              color: '#09090b',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}>
              Create ➔
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-btn"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0
              }}
              aria-label={mobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer / Dropdown */}
        {mobileMenuOpen && (
          <div
            className="mobile-nav-drawer"
            style={{
              background: '#111215',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '16px 20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.8)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: '#e4e4e7', textDecoration: 'none', fontSize: '15px', fontWeight: 600, padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
              >
                How It Works
              </a>
              <a
                href="#integrations"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: '#e4e4e7', textDecoration: 'none', fontSize: '15px', fontWeight: 600, padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
              >
                Integrations
              </a>
              <a
                href="#ai-models"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: '#e4e4e7', textDecoration: 'none', fontSize: '15px', fontWeight: 600, padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
              >
                AI Models
              </a>
              <a
                href="#voices"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: '#e4e4e7', textDecoration: 'none', fontSize: '15px', fontWeight: 600, padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
              >
                Voices
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: '#e4e4e7', textDecoration: 'none', fontSize: '15px', fontWeight: 600, padding: '8px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
              >
                Pricing
              </a>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                Log In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '12px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  color: '#09090b',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 700
                }}
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px 60px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '24px', marginBottom: '24px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#e4e4e7' }}>
            AI Video Automation
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 auto 24px', maxWidth: '900px', color: '#ffffff' }}>
          Turn your ideas into ready-to-publish videos.
        </h1>

        <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#a1a1aa', maxWidth: '740px', margin: '0 auto 36px', lineHeight: 1.6 }}>
          Create engaging videos with AI-powered scripting, voiceover, visuals, captions and rendering — all from one simple workflow.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '48px' }}>
          <Link href="/signup" style={{
            background: '#ffffff',
            color: '#09090b',
            padding: '14px 28px',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 20px rgba(255,255,255,0.15)'
          }}>
            Create Your First Video ➔
          </Link>
          <a href="#how-it-works" style={{
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#e4e4e7',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '14px 24px',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 600,
            textDecoration: 'none'
          }}>
            See How It Works
          </a>
        </div>

        {/* Interactive Autonomous Workflow Canvas (n8n-Style Live Preview) */}
        <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', textAlign: 'left', overflow: 'hidden', borderRadius: '12px' }}>
          <InteractiveWorkflowCanvas
            mode="simulation"
            title="Autonomous Workflow Engine"
            subtitle="Interactive visual node graph — click nodes to inspect payloads, or hit 'Test Workflow' to watch execution live"
          />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. HOW IT WORKS (4 SIMPLE STEPS)
      ───────────────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Simple 4-Step Process
          </span>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: '10px 0 16px' }}>
            How It Works
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '16px', maxWidth: '540px', margin: '0 auto' }}>
            You don't need filming gear, microphones, or editing software. Provide a topic and the platform handles the rest.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div style={{ background: '#121215', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '28px 24px' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', marginBottom: '12px', fontFamily: 'monospace' }}>01</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Enter Your Topic</h3>
            <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Tell the AI what you want your video to be about, e.g. "10 foods that support healthy aging" or "Quantum Computing explained".
            </p>
          </div>

          <div style={{ background: '#121215', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '28px 24px' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8', marginBottom: '12px', fontFamily: 'monospace' }}>02</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Choose Your Voice</h3>
            <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Select from curated studio voices (Rachel, Adam, Antoni, Bella, Christopher) or connect your personal cloned voice.
            </p>
          </div>

          <div style={{ background: '#121215', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '28px 24px' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#c084fc', marginBottom: '12px', fontFamily: 'monospace' }}>03</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>AI Creates Your Video</h3>
            <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              AI writes the script, structures the story, generates natural narration, matches 1080p visual scenes, and renders the video.
            </p>
          </div>

          <div style={{ background: '#121215', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '28px 24px' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b', marginBottom: '12px', fontFamily: 'monospace' }}>04</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Download or Publish</h3>
            <p style={{ color: '#a1a1aa', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              Download your complete 1080p MP4 file immediately, or schedule it automatically to your connected YouTube channel.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. POWERFUL INTEGRATIONS SECTION
      ───────────────────────────────────────────────────────────── */}
      <section id="integrations" style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Production Infrastructure
          </span>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: '10px 0 16px' }}>
            Powerful Integrations Behind Your Videos
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '16px', maxWidth: '620px', margin: '0 auto' }}>
            We connect directly to industry-leading AI and cloud infrastructure so your channel gets enterprise-grade video quality.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ background: '#121215', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '22px' }}>🌐</span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>OpenRouter</h3>
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', borderRadius: '4px', marginLeft: 'auto' }}>Script Routing</span>
            </div>
            <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              Multi-model AI router providing deep script analysis, high-retention narrative hooks, and strict topic adherence.
            </p>
          </div>

          <div style={{ background: '#121215', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '22px' }}>✨</span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>Google Gemini</h3>
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '4px', marginLeft: 'auto' }}>AI Engine</span>
            </div>
            <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              Multimodal AI reasoning engine ensuring fast script generation and automated Health Content Safe Mode verification.
            </p>
          </div>

          <div style={{ background: '#121215', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '22px' }}>🎙️</span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>ElevenLabs</h3>
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', background: 'rgba(192,132,252,0.1)', color: '#c084fc', borderRadius: '4px', marginLeft: 'auto' }}>Voice Synthesis</span>
            </div>
            <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              Ultra-realistic AI voice synthesis with expressive vocal dynamics, studio clarity, and support for custom cloned voice IDs.
            </p>
          </div>

          <div style={{ background: '#121215', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '22px' }}>🔊</span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>Google Neural TTS</h3>
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: '4px', marginLeft: 'auto' }}>Voice Fallback</span>
            </div>
            <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              High-availability neural voice backup system ensuring your audio narration renders reliably even during network outages.
            </p>
          </div>

          <div style={{ background: '#121215', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '22px' }}>▶️</span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>YouTube Data API</h3>
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', borderRadius: '4px', marginLeft: 'auto' }}>Auto-Publish</span>
            </div>
            <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              Secure Google OAuth 2.0 integration allowing 1-click video uploads and automated daily release scheduling.
            </p>
          </div>

          <div style={{ background: '#121215', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '22px' }}>☁️</span>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>Cloudflare R2 & AI</h3>
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 6px', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', marginLeft: 'auto' }}>Storage & Edge</span>
            </div>
            <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              Global cloud object storage and edge acceleration ensuring instant MP4 streaming and zero egress bottlenecks.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. AI MODELS POWERING YOUR CONTENT
      ───────────────────────────────────────────────────────────── */}
      <section id="ai-models" style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Transparent AI Architecture
          </span>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: '10px 0 16px' }}>
            AI Models Powering Your Content
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '16px', maxWidth: '620px', margin: '0 auto' }}>
            We intelligently orchestrate multiple specialized AI models to write captivating scripts with strict continuity.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div style={{ background: '#121215', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', fontFamily: 'monospace', marginBottom: '8px' }}>PRIMARY MODEL</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>DeepSeek-Chat</h3>
            <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              Specialized in high-retention script generation, viral hook writing, and scene-by-scene narrative flow.
            </p>
          </div>

          <div style={{ background: '#121215', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace', marginBottom: '8px' }}>SYNTHESIS & STRUCTURE</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>GPT-4o Mini</h3>
            <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              Ensures scene visual prompts, camera directions, and lighting styles maintain consistent continuity across scenes.
            </p>
          </div>

          <div style={{ background: '#121215', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace', marginBottom: '8px' }}>HIGH-SPEED FALLBACK</div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Gemini 3.8 Flash</h3>
            <p style={{ color: '#a1a1aa', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              Google's latest production multimodal engine (gemini-3.8-flash) ready as a live backup to ensure zero downtime.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. NATURAL AI VOICES
      ───────────────────────────────────────────────────────────── */}
      <section id="voices" style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Studio Sound Quality
          </span>
          <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: '10px 0 16px' }}>
            Natural AI Voices & Custom Cloning
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '16px', maxWidth: '620px', margin: '0 auto' }}>
            Powered by ElevenLabs voice technology. Pick from studio narrators or use your own custom voice.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {[
            { name: 'Rachel', tone: 'Calm & Professional', gender: 'Female' },
            { name: 'Adam', tone: 'Deep & Cinematic', gender: 'Male' },
            { name: 'Antoni', tone: 'Energetic Storyteller', gender: 'Male' },
            { name: 'Bella', tone: 'Warm & Conversational', gender: 'Female' },
            { name: 'Christopher', tone: 'Broadcast Journalist', gender: 'Male' },
            { name: 'My Voice', tone: 'Your ElevenLabs Cloned Voice', gender: 'Custom ID' },
          ].map((v, i) => (
            <div key={i} style={{ background: '#121215', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '20px' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>🎙️</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{v.name}</div>
              <div style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '8px' }}>{v.tone}</div>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: '#e4e4e7' }}>
                {v.gender}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. YOU DON'T NEED TO BE A VIDEO EDITOR
      ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: '960px', margin: '0 auto', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: '0 0 12px' }}>
            You Don't Need to Be a Video Editor
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '15px' }}>
            Compare creating videos the manual way versus automated with AUTORA.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* The Hard Way */}
          <div style={{ background: 'rgba(244, 63, 94, 0.04)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '12px', padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f43f5e', marginBottom: '16px' }}>❌ The Manual Way (Hours of Work)</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', color: '#a1a1aa', fontSize: '14px' }}>
              <li>❌ Research and write 1,000+ words manually</li>
              <li>❌ Buy expensive microphones & record multiple takes</li>
              <li>❌ Hunt through stock sites for hours to find clips</li>
              <li>❌ Manually time clips, cut gaps, and burn subtitles</li>
              <li>❌ Manually render, export, and upload to YouTube</li>
            </ul>
          </div>

          {/* The AUTORA Way */}
          <div style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#10b981', marginBottom: '16px' }}>✓ The AUTORA Way (30 Seconds)</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', color: '#e4e4e7', fontSize: '14px' }}>
              <li>✓ Type your video topic or headline</li>
              <li>✓ Pick your favorite studio or custom voice</li>
              <li>✓ Click "Create Video"</li>
              <li>✓ AI writes, speaks, stitches clips, and renders MP4</li>
              <li>✓ Download MP4 or auto-publish to YouTube</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. SIMPLE PRICING (30 VIDEOS / MONTH)
      ───────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '80px 24px', maxWidth: '800px', margin: '0 auto', borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Simple Transparent Pricing
        </span>
        <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: '10px 0 16px' }}>
          30 Videos Every Month
        </h2>
        <p style={{ color: '#a1a1aa', fontSize: '16px', maxWidth: '520px', margin: '0 auto 28px' }}>
          Everything you need to automate a daily YouTube channel without hidden fees.
        </p>

        {/* Monthly / Annual Toggle */}
        <div style={{ display: 'inline-flex', padding: '4px', background: '#121215', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', marginBottom: '36px' }}>
          <button
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: 'none',
              background: billingCycle === 'monthly' ? '#ffffff' : 'transparent',
              color: billingCycle === 'monthly' ? '#09090b' : '#a1a1aa',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: 'none',
              background: billingCycle === 'annual' ? '#ffffff' : 'transparent',
              color: billingCycle === 'annual' ? '#09090b' : '#a1a1aa',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Annual (Save 20%)
          </button>
        </div>

        {/* Pricing Card */}
        <div style={{
          background: '#121215',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '40px',
          textAlign: 'left',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>CREATOR PLAN</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>Automated Channel Plan</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '42px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {billingCycle === 'monthly' ? '$49' : '$39'}
                <span style={{ fontSize: '15px', color: '#a1a1aa', fontWeight: 500 }}>/month</span>
              </div>
              <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
                {billingCycle === 'annual' ? 'Billed annually ($468/yr)' : 'Cancel anytime'}
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '24px 0' }} />

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {[
              '30 Full Videos / Month (1 Daily Video)',
              'Zero-Waste Policy (Failed jobs never count)',
              'Studio Voices + Custom Voice ID',
              'Multi-Model Script Engine (DeepSeek + GPT-4o)',
              'Full 1080p MP4 Immediate Downloads',
              'Direct YouTube Auto-Publish & Scheduling',
              'Health Content Safe Mode Compliance',
              'Automated WebVTT Subtitle Generation',
            ].map((feat, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#e4e4e7' }}>
                <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>

          <Link href="/signup" style={{
            display: 'block',
            width: '100%',
            textAlign: 'center',
            background: '#ffffff',
            color: '#09090b',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 700,
            textDecoration: 'none'
          }}>
            Start Creating Today ➔
          </Link>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          9. FREQUENTLY ASKED QUESTIONS
      ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: '800px', margin: '0 auto', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: '0 0 12px' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '15px' }}>
            Simple answers to help you get started right away.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              style={{
                background: '#121215',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '18px 22px',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: '15px', color: '#fff' }}>
                <span>{faq.q}</span>
                <span style={{ color: '#71717a', fontSize: '18px' }}>{openFaq === idx ? '−' : '+'}</span>
              </div>
              {openFaq === idx && (
                <p style={{ marginTop: '12px', fontSize: '14px', color: '#a1a1aa', lineHeight: 1.6, marginBottom: 0 }}>
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          10. FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '40px 24px', background: '#09090b', color: '#71717a', fontSize: '13px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, color: '#fff', letterSpacing: '0.04em' }}>AUTORA</span>
            <span>— AI Video Automation</span>
          </div>

          <div style={{ display: 'flex', gap: '24px' }}>
            <a href="#how-it-works" style={{ color: '#a1a1aa', textDecoration: 'none' }}>How It Works</a>
            <a href="#integrations" style={{ color: '#a1a1aa', textDecoration: 'none' }}>Integrations</a>
            <a href="#pricing" style={{ color: '#a1a1aa', textDecoration: 'none' }}>Pricing</a>
            <Link href="/login" style={{ color: '#a1a1aa', textDecoration: 'none' }}>Login</Link>
          </div>

          <div>
            © {new Date().getFullYear()} AUTORA. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
