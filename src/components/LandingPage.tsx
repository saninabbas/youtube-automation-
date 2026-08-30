'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [activeStudioTab, setActiveStudioTab] = useState<'script' | 'preview' | 'publish'>('preview');
  const [isPlaying, setIsPlaying] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const faqs = [
    {
      q: 'How does the 30-day YouTube auto-publishing work?',
      a: 'You connect your YouTube channel once using official Google OAuth 2.0. In your Content Calendar, you schedule release dates across the month. AutoVideo generates, renders in 1080p, and automatically uploads each video to your channel with custom thumbnails and tags right on schedule.',
    },
    {
      q: 'Do I need my own video editing software or external API keys?',
      a: 'No external software is required. AutoVideo includes a native 1080p FFmpeg compositor, neural voiceovers, dynamic subtitle burning, and stock B-roll matching out of the box. You can optionally configure your own Gemini or ElevenLabs keys in Settings if desired.',
    },
    {
      q: 'What resolution and video format are generated?',
      a: 'All videos are rendered in broadcast-quality 1080p Full HD (1920x1080) at a constant 30 fps (CFR) using H.264 video and 48kHz AAC stereo audio formatted with FastStart for instant YouTube playback.',
    },
    {
      q: 'Can I customize the script and scenes with AI Copilot?',
      a: 'Yes. The Video Studio lets you edit any sentence, replace B-roll clips, or use the built-in AI Copilot to rewrite scene hooks, change tone, or adjust pacing with a single click.',
    },
    {
      q: 'What happens if a YouTube upload fails due to network or quota issues?',
      a: 'The background scheduler features automatic error logging and lease recovery. You can also click [Retry] in the Content Calendar or Studio at any time to re-trigger upload without re-rendering the video.',
    },
    {
      q: 'How do credits work and can I top up anytime?',
      a: 'Every new account receives 500 free credits. Generating a complete 1080p video costs ~60 credits. Paid subscription plans include monthly credit allotments, and you can purchase instant credit top-up packs directly from your billing dashboard.',
    },
  ];

  return (
    <div style={{ background: '#08090d', color: '#f8fafc', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      {/* ───────────────────────────────────────────────────────────
          1. CLEAN RESTRAINED NAVBAR
      ─────────────────────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(8, 9, 13, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0 28px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
              AutoVideo<span style={{ color: '#94a3b8' }}>.ai</span>
            </span>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }} className="hidden-mobile">
            <a href="#workflow" style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, transition: 'color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
              Workflow
            </a>
            <a href="#capabilities" style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, transition: 'color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
              Capabilities
            </a>
            <a href="#use-cases" style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, transition: 'color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
              Use Cases
            </a>
            <a href="#pricing" style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, transition: 'color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
              Pricing
            </a>
            <a href="#faq" style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, transition: 'color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
              FAQ
            </a>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/login" style={{ fontSize: '13px', fontWeight: 500, color: '#cbd5e1', padding: '6px 12px' }} className="hidden-mobile">
            Sign In
          </Link>
          <Link
            href="/signup"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#fff',
              background: '#4f46e5',
              padding: '8px 16px',
              borderRadius: '6px',
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#4338ca'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#4f46e5'}
          >
            Start Creating Free
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px 10px', display: 'none' }}
            id="mobileMenuToggle"
            aria-label="Toggle navigation menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="landing-mobile-drawer">
            <a href="#workflow" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
              Workflow
            </a>
            <a href="#capabilities" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
              Capabilities
            </a>
            <a href="#use-cases" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
              Use Cases
            </a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
              Pricing
            </a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
              FAQ
            </a>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                Sign In
              </Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                Start Creating Free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ───────────────────────────────────────────────────────────
          2. EDITORIAL HERO SECTION
      ─────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: '1180px', margin: '0 auto', padding: '80px 24px 48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '9999px', marginBottom: '24px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            AI Video Automation
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.4rem)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.035em', lineHeight: 1.12, maxWidth: '880px', margin: '0 auto 20px' }}>
          Turn an idea into a<br />finished YouTube video.
        </h1>

        <p style={{ fontSize: 'clamp(1rem, 1.8vw, 1.15rem)', color: '#94a3b8', maxWidth: '640px', lineHeight: 1.6, margin: '0 auto 32px' }}>
          Create the script, generate scenes, add narration, render in 1080p, and schedule directly to YouTube — from one workflow.
        </p>

        {/* CTA Group */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '28px' }}>
          <Link
            href="/signup"
            style={{
              padding: '13px 26px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#fff',
              background: '#4f46e5',
              borderRadius: '6px',
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#4338ca'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#4f46e5'}
          >
            Start Creating Free
          </Link>
          <a
            href="#workflow"
            style={{
              padding: '13px 22px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#cbd5e1',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            See How It Works ➔
          </a>
        </div>

        {/* Quiet Trust Proof */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', fontSize: '12px', color: '#64748b' }}>
          <span>500 Free AI Credits</span>
          <span>•</span>
          <span>1080p 30fps CFR Output</span>
          <span>•</span>
          <span>Official YouTube Data API v3</span>
        </div>

        {/* ───────────────────────────────────────────────────────────
            3. REAL PRODUCT WORKSPACE VISUALIZATION (Centerpiece)
        ─────────────────────────────────────────────────────────── */}
        <div
          style={{
            width: '100%',
            maxWidth: '1120px',
            marginTop: '44px',
            background: '#0d0f17',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.7)',
            textAlign: 'left',
          }}
        >
          {/* Top Workspace Chrome */}
          <div style={{ padding: '12px 18px', background: '#121520', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginLeft: '6px', fontFamily: 'var(--font-mono)' }}>
                projects / how-neuromorphic-ai-works.mp4
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                ● 1080p Rendered
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Duration: 01:24</span>
            </div>
          </div>

          {/* 3-Pane Realistic Studio Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', minHeight: '380px' }} className="studio-responsive-grid">
            {/* Left Pane: Scene Breakdown */}
            <div style={{ padding: '14px', background: '#0f121a', borderRight: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                Scene Sequence
              </div>

              {[
                { id: 1, title: '01. The Efficiency Wall', time: '00:00 - 00:20', active: true },
                { id: 2, title: '02. Synaptic Architecture', time: '00:20 - 00:44' },
                { id: 3, title: '03. Real-World Benchmarks', time: '00:44 - 01:05' },
                { id: 4, title: '04. Summary & Outro', time: '01:05 - 01:24' },
              ].map((s) => (
                <div
                  key={s.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: s.active ? '#1c2233' : 'transparent',
                    border: `1px solid ${s.active ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{s.title}</div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>{s.time}</div>
                </div>
              ))}
            </div>

            {/* Center Pane: 1080p Theater Video Player */}
            <div style={{ padding: '20px', background: '#08090d', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16 / 9',
                  background: '#11141f',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', color: '#cbd5e1', background: 'rgba(0,0,0,0.75)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                  1920 × 1080 • 30fps CFR
                </div>

                {/* Subtitle Caption Preview */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '20px',
                    right: '20px',
                    textAlign: 'center',
                    padding: '8px 12px',
                    background: 'rgba(0, 0, 0, 0.8)',
                    borderRadius: '4px',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#facc15' }}>
                    "Traditional silicon chips waste 90% of their power moving memory..."
                  </span>
                </div>
              </div>

              {/* Scrubber Bar */}
              <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>00:18</span>
                <div style={{ flex: 1, height: '4px', background: '#1c2233', borderRadius: '2px', position: 'relative' }}>
                  <div style={{ width: '22%', height: '100%', background: '#6366f1', borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>01:24</span>
              </div>
            </div>

            {/* Right Pane: Automation Inspector */}
            <div style={{ padding: '14px', background: '#0f121a', borderLeft: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Publishing Inspector
              </div>

              <div style={{ padding: '10px', background: '#141824', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Voice Synthesizer</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginTop: '2px' }}>Adam (Neural 48kHz)</div>
              </div>

              <div style={{ padding: '10px', background: '#141824', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Target Channel</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginTop: '2px' }}>Tech Pulse Daily</div>
                <div style={{ fontSize: '10px', color: '#10b981', marginTop: '4px' }}>✓ Google OAuth 2.0 Active</div>
              </div>

              <div style={{ padding: '10px', background: '#141824', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Release Schedule</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginTop: '2px' }}>Aug 31 at 8:00 PM UTC</div>
                <div style={{ fontSize: '10px', color: '#6366f1', marginTop: '4px' }}>Status: Scheduled on YouTube</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          4. PRODUCT STORYTELLING (How AutoVideo Works)
      ─────────────────────────────────────────────────────────── */}
      <section id="workflow" style={{ maxWidth: '1180px', margin: '0 auto', padding: '96px 24px' }}>
        <div style={{ maxWidth: '640px', marginBottom: '56px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Workflow
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
            From a single prompt to a published video on your channel.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px' }}>
          {[
            {
              step: '01',
              title: 'Start with a topic',
              desc: 'Enter a topic prompt or select from channel archetypes. AutoVideo outlines the hook, key arguments, and outro beats.',
            },
            {
              step: '02',
              title: 'AI builds the story',
              desc: 'The engine creates a multi-scene storyboard, generates neural voice narration, and matches relevant 1080p B-roll clips.',
            },
            {
              step: '03',
              title: 'Render in 1080p FFmpeg',
              desc: 'Native server-side compositing stitches B-roll, synchronizes audio, burns dynamic subtitles, and outputs a 30fps CFR MP4.',
            },
            {
              step: '04',
              title: 'Publish on schedule',
              desc: 'Connect your YouTube channel once. AutoVideo uploads, adds tags, sets custom thumbnails, and publishes on your calendar.',
            },
          ].map((s) => (
            <div key={s.step} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#6366f1', fontFamily: 'var(--font-mono)' }}>
                {s.step}
              </span>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{s.title}</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          5. CORE PRODUCT CAPABILITIES (Editorial Split Sections)
      ─────────────────────────────────────────────────────────── */}
      <section id="capabilities" style={{ maxWidth: '1180px', margin: '0 auto', padding: '48px 24px 96px', display: 'flex', flexDirection: 'column', gap: '96px' }}>
        {/* Capability 1: Create */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '48px', alignItems: 'center' }} className="studio-responsive-grid">
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              01 • CREATE
            </div>
            <h3 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '16px' }}>
              Write retention-focused scripts without starting from scratch.
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '20px' }}>
              AutoVideo structures scripts designed specifically for viewer retention. Every script is divided into distinct scenes with pacing notes, visual suggestions, and natural-sounding voiceover lines.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10b981' }}>✓</span> 40+ neural voices with natural cadence
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10b981' }}>✓</span> Built-in Copilot for 1-click hook optimization
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10b981' }}>✓</span> Multi-scene decomposition with timestamps
              </div>
            </div>
          </div>

          {/* Script UI Simulation */}
          <div style={{ background: '#0f121a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              Script Editor • Scene 1 Hook (00:00 - 00:18)
            </div>
            <p style={{ fontSize: '13px', color: '#f8fafc', lineHeight: 1.6, background: '#141824', padding: '14px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              "What if the silicon chips powering modern computing are hitting a fundamental physical limit? In 2026, neuromorphic architecture is rewriting how machines think."
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <span style={{ fontSize: '11px', padding: '3px 8px', background: '#1c2233', color: '#94a3b8', borderRadius: '4px' }}>Voice: Adam (Neural)</span>
              <span style={{ fontSize: '11px', padding: '3px 8px', background: '#1c2233', color: '#94a3b8', borderRadius: '4px' }}>Pacing: 142 wpm</span>
            </div>
          </div>
        </div>

        {/* Capability 2: Edit & Render */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '48px', alignItems: 'center' }} className="studio-responsive-grid">
          {/* FFmpeg Video UI Simulation */}
          <div style={{ background: '#0f121a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>1080p FFmpeg Engine</span>
              <span style={{ fontSize: '11px', color: '#10b981', fontFamily: 'var(--font-mono)' }}>1920x1080 • CFR 30fps</span>
            </div>
            <div style={{ padding: '16px', background: '#08090d', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>Video Composition Pipeline</div>
              <div style={{ fontSize: '12px', color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                [Video B-Roll 1080p] + [Voiceover AAC] + [Dynamic Subtitles SRT] $\to$ Output.mp4
              </div>
              <div style={{ marginTop: '12px', fontSize: '11px', color: '#10b981' }}>
                ✓ Frame-accurate subtitle timestamps burned
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              02 • EDIT & COMPOSE
            </div>
            <h3 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '16px' }}>
              Broadcast-quality 1080p rendering. No video editing software needed.
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '20px' }}>
              Our native server-side FFmpeg pipeline composites B-roll footage, mixes voice tracks with background music, and burns high-visibility captions at 30 frames per second.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10b981' }}>✓</span> 1080p Full HD H.264 FastStart MP4
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10b981' }}>✓</span> Word-level dynamic subtitle synchronization
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10b981' }}>✓</span> High-CTR custom thumbnail generator
              </div>
            </div>
          </div>
        </div>

        {/* Capability 3: Publish */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '48px', alignItems: 'center' }} className="studio-responsive-grid">
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              03 • PUBLISH
            </div>
            <h3 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '16px' }}>
              30-day autonomous scheduling directly to your YouTube channel.
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6, marginBottom: '20px' }}>
              Connect your YouTube channel once using official Google OAuth 2.0. AutoVideo uploads videos, attaches custom metadata, and schedules publication according to your release calendar.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10b981' }}>✓</span> Official YouTube Data API v3 integration
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10b981' }}>✓</span> Private, Unlisted, Public, and Scheduled releases
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#10b981' }}>✓</span> Background scheduler with automatic lease recovery
              </div>
            </div>
          </div>

          {/* Calendar Release Matrix Simulation */}
          <div style={{ background: '#0f121a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>Release Calendar</span>
              <span style={{ fontSize: '11px', color: '#6366f1' }}>30-Day Autopilot</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '10px 12px', background: '#141824', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#fff' }}>Mon: Quantum Computing Explained</span>
                <span style={{ fontSize: '10px', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>Published</span>
              </div>
              <div style={{ padding: '10px 12px', background: '#141824', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#fff' }}>Wed: Neuromorphic AI Breakthroughs</span>
                <span style={{ fontSize: '10px', color: '#6366f1', background: 'rgba(99, 102, 241, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>Scheduled (8 PM)</span>
              </div>
              <div style={{ padding: '10px 12px', background: '#141824', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#fff' }}>Fri: Top 5 AI Robotics Startups</span>
                <span style={{ fontSize: '10px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>Queued for Render</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          6. REAL-WORLD USE CASES
      ─────────────────────────────────────────────────────────── */}
      <section id="use-cases" style={{ maxWidth: '1180px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <div style={{ maxWidth: '640px', marginBottom: '48px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Use Cases
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
            Built for modern video publishers.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {[
            {
              title: 'Faceless YouTube Channels',
              desc: 'Publish consistent tech, finance, documentary, and educational videos on daily autopilot without camera equipment.',
              badge: 'Channel Automation',
            },
            {
              title: 'Short-Form Content Producers',
              desc: 'Produce high-retention Shorts and Reels with burned subtitles and fast-paced B-roll cuts.',
              badge: 'Viral Formats',
            },
            {
              title: 'Media & Marketing Agencies',
              desc: 'Manage multiple client channels, isolate brand assets, and automate release calendars from one unified dashboard.',
              badge: 'Multi-Tenant Studio',
            },
          ].map((u) => (
            <div
              key={u.title}
              style={{
                padding: '28px',
                background: '#0d0f17',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {u.badge}
              </span>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }}>{u.title}</h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>{u.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          7. PRICING PACKAGES
      ─────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ maxWidth: '1180px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em' }}>
            Transparent Pricing
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: '8px auto 24px', maxWidth: '500px' }}>
            Every plan includes 1080p video rendering, neural voiceovers, and YouTube auto-publishing.
          </p>

          {/* Toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', background: '#121520', padding: '4px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className="btn btn-sm"
              style={{ borderRadius: '4px', background: billingCycle === 'monthly' ? '#1c2233' : 'transparent', color: billingCycle === 'monthly' ? '#fff' : '#94a3b8' }}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className="btn btn-sm"
              style={{ borderRadius: '4px', background: billingCycle === 'annual' ? '#1c2233' : 'transparent', color: billingCycle === 'annual' ? '#fff' : '#94a3b8' }}
            >
              Annual <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 600 }}>(Save 20%)</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {[
            { name: 'Starter', price: billingCycle === 'annual' ? '$15' : '$19', vids: '~8 Full Videos/mo', credits: '500 Credits/mo', desc: 'For creators launching their first channel.' },
            { name: 'Pro Creator', price: billingCycle === 'annual' ? '$39' : '$49', vids: '~24 Full Videos/mo', credits: '1,500 Credits/mo', desc: 'For channels posting consistent daily content.', popular: true },
            { name: 'Scale', price: billingCycle === 'annual' ? '$79' : '$99', vids: '~60 Full Videos/mo', credits: '4,000 Credits/mo', desc: 'For multi-channel operators and publishers.' },
            { name: 'Agency', price: billingCycle === 'annual' ? '$159' : '$199', vids: '~160 Full Videos/mo', credits: '10,000 Credits/mo', desc: 'For digital marketing agencies managing brands.' },
          ].map((p) => (
            <div
              key={p.name}
              style={{
                padding: '24px',
                borderRadius: '8px',
                background: p.popular ? '#121522' : '#0d0f17',
                border: `1px solid ${p.popular ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{p.name}</h3>
                  {p.popular && (
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#6366f1', background: 'rgba(99, 102, 241, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                      POPULAR
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', margin: '12px 0 2px', letterSpacing: '-0.02em' }}>
                  {p.price}<span style={{ fontSize: '13px', color: '#64748b', fontWeight: 400 }}>/mo</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1', marginBottom: '8px' }}>{p.vids}</div>
                <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>{p.desc}</p>
                <div style={{ fontSize: '11px', color: '#64748b', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '12px' }}>
                  Includes: {p.credits} • 1080p Export • YouTube Publishing
                </div>
              </div>

              <Link
                href="/signup"
                style={{
                  marginTop: '20px',
                  padding: '10px 0',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#fff',
                  background: p.popular ? '#4f46e5' : 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  textDecoration: 'none',
                }}
              >
                Get Started ➔
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          8. CLEAN FAQ
      ─────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px 96px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em' }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {faqs.map((f, i) => (
            <div key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%',
                  padding: '18px 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>{f.q}</span>
                <span style={{ fontSize: '16px', color: '#6366f1', marginLeft: '12px' }}>
                  {openFaq === i ? '−' : '+'}
                </span>
              </button>
              {openFaq === i && (
                <div style={{ paddingBottom: '18px', fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          9. CONFIDENT CLOSING STATEMENT
      ─────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: '1180px', margin: '0 auto', padding: '24px 24px 80px' }}>
        <div
          style={{
            padding: '48px 32px',
            background: '#0d0f17',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em' }}>
            Ready to automate your next video?
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '520px', lineHeight: 1.6 }}>
            Start creating with AutoVideo. 500 free credits included, no credit card required.
          </p>
          <Link
            href="/signup"
            style={{
              marginTop: '8px',
              padding: '13px 28px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#fff',
              background: '#4f46e5',
              borderRadius: '6px',
              textDecoration: 'none',
            }}
          >
            Start Creating Free ➔
          </Link>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          10. MINIMAL FOOTER
      ─────────────────────────────────────────────────────────── */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '36px 28px',
          maxWidth: '1180px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          fontSize: '12px',
          color: '#64748b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, color: '#cbd5e1' }}>AutoVideo.ai</span>
          <span>© 2026 AutoVideo SaaS. All rights reserved.</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <Link href="/login" style={{ color: '#94a3b8' }}>Sign In</Link>
          <Link href="/signup" style={{ color: '#94a3b8' }}>Register</Link>
        </div>
      </footer>
    </div>
  );
}
