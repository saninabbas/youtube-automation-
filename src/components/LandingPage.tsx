'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedScene, setSelectedScene] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackProgress, setPlaybackProgress] = useState<number>(24);
  const [activeVoice, setActiveVoice] = useState<string>('Adam (Neural 48kHz)');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Topic Simulator state
  const [activeTopicIndex, setActiveTopicIndex] = useState<number>(0);

  // Savings Calculator state
  const [videosPerMonth, setVideosPerMonth] = useState<number>(24);

  const scenes = [
    {
      id: 0,
      title: '01. The Efficiency Wall',
      time: '00:00 - 00:20',
      duration: '20s',
      caption: '"Traditional silicon chips waste 90% of their power moving memory between compute cores..."',
      tag: 'B-Roll: Microchip Macro 1080p',
    },
    {
      id: 1,
      title: '02. Synaptic Architecture',
      time: '00:20 - 00:44',
      duration: '24s',
      caption: '"Neuromorphic chips mimic biological neurons, computing and storing data at the exact same physical location."',
      tag: 'B-Roll: Biological Brain Synapse 3D',
    },
    {
      id: 2,
      title: '03. Real-World Benchmarks',
      time: '00:44 - 01:05',
      duration: '21s',
      caption: '"In real-world LLM workloads, these processors deliver a 100x reduction in latency at 1/50th the energy cost."',
      tag: 'B-Roll: Server Rack Telemetry',
    },
    {
      id: 3,
      title: '04. Summary & YouTube Outro',
      time: '01:05 - 01:24',
      duration: '19s',
      caption: '"Subscribe for our weekly deep dive into the next computing frontier. See you in the next breakdown."',
      tag: 'B-Roll: High-CTR Endscreen & Cards',
    },
  ];

  const simulatedTopics = [
    {
      topic: 'The 2026 Neuromorphic AI Chip Revolution',
      niche: 'AI Tech & Hardware',
      scenes: [
        '01. Hook: Silicon computing hitting the memory wall (00:00 - 00:18)',
        '02. Core: How synaptic architecture mimics biological brain (00:18 - 00:42)',
        '03. Proof: 100x energy efficiency in autonomous robotics (00:42 - 01:05)',
        '04. CTA: Which tech giant will dominate the architecture war? (01:05 - 01:25)',
      ],
      suggestedTitle: 'Why Neuromorphic AI Chips Will Replace GPUs by 2027 (Full Breakdown)',
      estDuration: '01:25 (1080p CFR)',
      credits: '58 Credits',
    },
    {
      topic: 'How Quantitative Hedge Funds Exploit Microstructure',
      niche: 'Finance & Trading Systems',
      scenes: [
        '01. Hook: The 1-nanosecond difference between profit and liquidation (00:00 - 00:16)',
        '02. Core: Limit order book dynamics and latency arbitrage (00:16 - 00:45)',
        '03. Proof: Machine learning predictive fill rates in dark pools (00:45 - 01:10)',
        '04. CTA: Subscribe for institutional finance algorithms decoded (01:10 - 01:30)',
      ],
      suggestedTitle: 'The Secret Algorithms Behind Wall Street Top High-Frequency Desks',
      estDuration: '01:30 (1080p CFR)',
      credits: '62 Credits',
    },
    {
      topic: 'What Actually Happens Inside an Event Horizon',
      niche: 'Deep Science & Astronomy',
      scenes: [
        '01. Hook: Time dilation makes falling matter appear frozen forever (00:00 - 00:22)',
        '02. Core: Spaghettification and gravitational tidal forces (00:22 - 00:50)',
        '03. Proof: Hawking radiation and the quantum information paradox (00:50 - 01:15)',
        '04. CTA: Leave a comment: Does information truly escape? (01:15 - 01:35)',
      ],
      suggestedTitle: 'What You Would Actually See Inside a Supermassive Black Hole',
      estDuration: '01:35 (1080p CFR)',
      credits: '65 Credits',
    },
    {
      topic: '5 Psychological Habits of Elite Engineers',
      niche: 'Productivity & Tech Career',
      scenes: [
        '01. Hook: Top 1% engineers write fewer lines of code, not more (00:00 - 00:18)',
        '02. Core: Deep work scheduling and asynchronous communication protocols (00:18 - 00:44)',
        '03. Proof: The compound leverage of idempotent automation (00:44 - 01:08)',
        '04. CTA: Download our free system architecture cheat sheet below (01:08 - 01:28)',
      ],
      suggestedTitle: 'How 10x Engineers Think: 5 Rules for Extreme Technical Leverage',
      estDuration: '01:28 (1080p CFR)',
      credits: '60 Credits',
    },
  ];

  const faqs = [
    {
      q: 'How does the 30-day YouTube auto-publishing work?',
      a: 'You connect your YouTube channel once using official Google OAuth 2.0. In your Content Calendar, you schedule release dates across the month. AutoVideo generates, renders in 1080p, and automatically uploads each video to your channel with custom thumbnails, tags, and titles right on schedule.',
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

  // Calculate Savings
  const traditionalCost = videosPerMonth * 125 + 180;
  const autoVideoCost = videosPerMonth <= 8 ? 19 : videosPerMonth <= 24 ? 49 : videosPerMonth <= 60 ? 99 : 199;
  const netSavings = traditionalCost - autoVideoCost;
  const hoursSaved = Math.round(videosPerMonth * 4.5);

  return (
    <div style={{ background: '#07080b', color: '#f8fafc', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      {/* ───────────────────────────────────────────────────────────
          1. RESTRAINED EDITORIAL NAVBAR
      ─────────────────────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(7, 8, 11, 0.94)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0 32px',
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
                background: '#4f46e5',
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
            <a href="#simulator" style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, transition: 'color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
              Live Simulator
            </a>
            <a href="#capabilities" style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, transition: 'color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
              Capabilities
            </a>
            <a href="#calculator" style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500, transition: 'color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}>
              ROI Calculator
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

        {mobileMenuOpen && (
          <div className="landing-mobile-drawer">
            <a href="#workflow" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
              Workflow
            </a>
            <a href="#simulator" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
              Live Simulator
            </a>
            <a href="#capabilities" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
              Capabilities
            </a>
            <a href="#calculator" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
              ROI Calculator
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
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 24px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '9999px', marginBottom: '24px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4f46e5' }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            AI Video Automation & YouTube Autopilot
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.4rem)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.035em', lineHeight: 1.12, maxWidth: '900px', margin: '0 auto 20px' }}>
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
              padding: '13px 28px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#fff',
              background: '#4f46e5',
              borderRadius: '6px',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(79, 70, 229, 0.3)',
              transition: 'background 0.15s, transform 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#4338ca'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#4f46e5'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Start Creating Free ➔
          </Link>
          <a
            href="#simulator"
            style={{
              padding: '13px 24px',
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
            ⚡ Test Live Topic Simulator
          </a>
        </div>

        {/* Quiet Trust Proof */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', fontSize: '12px', color: '#64748b' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#10b981' }}>✓</span> 500 Free AI Credits
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#10b981' }}>✓</span> 1080p 30fps CFR Output
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#10b981' }}>✓</span> Official YouTube Data API v3
          </span>
        </div>

        {/* ───────────────────────────────────────────────────────────
            3. INTERACTIVE 3-PANE STUDIO WORKSPACE (Centerpiece)
        ─────────────────────────────────────────────────────────── */}
        <div
          style={{
            width: '100%',
            maxWidth: '1140px',
            marginTop: '44px',
            background: '#0d0f17',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 24px 70px -12px rgba(0, 0, 0, 0.8)',
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
              <span style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)', fontWeight: 600 }}>
                ● 1080p FFmpeg CFR Ready
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Duration: 01:24</span>
            </div>
          </div>

          {/* 3-Pane Realistic Studio Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr 280px', minHeight: '400px' }} className="studio-responsive-grid">
            {/* Left Pane: Interactive Scene Breakdown */}
            <div style={{ padding: '14px', background: '#0f121a', borderRight: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Storyboard ({scenes.length} Scenes)
                </span>
                <span style={{ fontSize: '10px', color: '#4f46e5', fontWeight: 600 }}>Click scene</span>
              </div>

              {scenes.map((s, idx) => (
                <div
                  key={s.id}
                  onClick={() => { setSelectedScene(idx); setPlaybackProgress((idx + 1) * 24); }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: selectedScene === idx ? '#1c2233' : 'transparent',
                    border: `1px solid ${selectedScene === idx ? 'rgba(79, 70, 229, 0.6)' : 'rgba(255, 255, 255, 0.06)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: selectedScene === idx ? '#fff' : '#cbd5e1' }}>
                      {s.title}
                    </div>
                    <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                      {s.duration}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                    {s.time}
                  </div>
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
                <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', color: '#cbd5e1', background: 'rgba(0,0,0,0.75)', padding: '3px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                  1920 × 1080 • 30fps CFR
                </div>

                <div style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '10px', color: '#10b981', background: 'rgba(0,0,0,0.75)', padding: '3px 8px', borderRadius: '4px' }}>
                  {scenes[selectedScene].tag}
                </div>

                {/* Subtitle Caption Overlay */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '20px',
                    right: '20px',
                    textAlign: 'center',
                    padding: '10px 14px',
                    background: 'rgba(0, 0, 0, 0.82)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#facc15' }}>
                    {scenes[selectedScene].caption}
                  </span>
                </div>
              </div>

              {/* Scrubber Bar & Controls */}
              <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>
                <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                  00:{(selectedScene + 1) * 18}
                </span>
                <div style={{ flex: 1, height: '4px', background: '#1c2233', borderRadius: '2px', position: 'relative' }}>
                  <div style={{ width: `${playbackProgress}%`, height: '100%', background: '#4f46e5', borderRadius: '2px', transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>01:24</span>
              </div>
            </div>

            {/* Right Pane: Automation & Controls */}
            <div style={{ padding: '14px', background: '#0f121a', borderLeft: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Studio Controls
              </div>

              <div style={{ padding: '10px', background: '#141824', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Neural Voiceover</div>
                <select
                  value={activeVoice}
                  onChange={(e) => setActiveVoice(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0a0d14',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    padding: '4px 6px',
                    fontSize: '11px',
                  }}
                >
                  <option>Adam (Neural 48kHz)</option>
                  <option>Rachel (Conversational)</option>
                  <option>Nova (Deep Documentary)</option>
                  <option>Marcus (Fast Paced Tech)</option>
                </select>
              </div>

              <div style={{ padding: '10px', background: '#141824', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Target Channel</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginTop: '2px' }}>Tech Pulse Daily</div>
                <div style={{ fontSize: '10px', color: '#10b981', marginTop: '4px' }}>✓ Google OAuth 2.0 Connected</div>
              </div>

              <div style={{ padding: '10px', background: '#141824', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Release Schedule</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginTop: '2px' }}>Aug 31 at 8:00 PM UTC</div>
                <div style={{ fontSize: '10px', color: '#6366f1', marginTop: '4px' }}>Status: YouTube Autopilot Queued</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          4. INTERACTIVE LIVE TOPIC-TO-VIDEO SIMULATOR
      ─────────────────────────────────────────────────────────── */}
      <section id="simulator" style={{ maxWidth: '1180px', margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ maxWidth: '640px', marginBottom: '36px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Interactive Demo
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
            See how AutoVideo structures your video in seconds.
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px' }}>
            Click any niche prompt below to see the live AI multi-scene breakdown and suggested metadata.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {simulatedTopics.map((t, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveTopicIndex(idx)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                background: activeTopicIndex === idx ? '#4f46e5' : 'rgba(255, 255, 255, 0.05)',
                color: activeTopicIndex === idx ? '#fff' : '#94a3b8',
                border: `1px solid ${activeTopicIndex === idx ? '#4f46e5' : 'rgba(255, 255, 255, 0.1)'}`,
                transition: 'all 0.15s ease',
              }}
            >
              {t.niche}
            </button>
          ))}
        </div>

        <div style={{ background: '#0f121a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Selected Topic</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                "{simulatedTopics[activeTopicIndex].topic}"
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#1c2233', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                {simulatedTopics[activeTopicIndex].estDuration}
              </span>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#1c2233', color: '#94a3b8' }}>
                Cost: {simulatedTopics[activeTopicIndex].credits}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {simulatedTopics[activeTopicIndex].scenes.map((sceneText, sIdx) => (
              <div key={sIdx} style={{ padding: '14px', background: '#141824', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 700, marginBottom: '4px' }}>Scene Beat 0{sIdx + 1}</div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>{sceneText}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '12px 16px', background: '#08090d', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>High-CTR YouTube Title: </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                {simulatedTopics[activeTopicIndex].suggestedTitle}
              </span>
            </div>
            <Link href="/signup" style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5', textDecoration: 'none' }}>
              Create This Video Free ➔
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          5. ROI & SAVINGS CALCULATOR
      ─────────────────────────────────────────────────────────── */}
      <section id="calculator" style={{ maxWidth: '1180px', margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ background: '#0d0f17', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '36px 32px' }}>
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 32px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              ROI Calculator
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em' }}>
              Calculate your monthly production savings.
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
              See how much you save compared to hiring video editors and subscribing to 6 fragmented SaaS tools.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginBottom: '36px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>
              How many videos do you publish per month?
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[4, 8, 16, 24, 30, 60].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setVideosPerMonth(count)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: videosPerMonth === count ? '#4f46e5' : '#141824',
                    color: videosPerMonth === count ? '#fff' : '#94a3b8',
                    border: `1px solid ${videosPerMonth === count ? '#4f46e5' : 'rgba(255, 255, 255, 0.1)'}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {count} Videos {count === 30 ? '(Daily)' : ''}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <div style={{ padding: '20px', background: '#121520', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '12px', color: '#f43f5e', fontWeight: 600 }}>Traditional Freelancers + Tool Sprawl</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', margin: '8px 0 4px' }}>
                ${traditionalCost.toLocaleString()}
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>/mo</span>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                $125/video editing fees + ElevenLabs, Midjourney, Canva, Buffer subscriptions.
              </p>
            </div>

            <div style={{ padding: '20px', background: '#121520', borderRadius: '8px', border: '1px solid rgba(79, 70, 229, 0.4)' }}>
              <div style={{ fontSize: '12px', color: '#4f46e5', fontWeight: 600 }}>AutoVideo.ai All-In-One Studio</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', margin: '8px 0 4px' }}>
                ${autoVideoCost}
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>/mo</span>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                Unlimited rendering, neural voices, 1080p FFmpeg export, and YouTube scheduling included.
              </p>
            </div>

            <div style={{ padding: '20px', background: '#121520', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
              <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>Net Monthly Savings</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', margin: '8px 0 4px' }}>
                +${netSavings.toLocaleString()}
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 400 }}>/mo</span>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                Plus approximately <strong>{hoursSaved} hours</strong> of manual editing time saved every month!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          6. CAPABILITIES & EDITORIAL SECTIONS
      ─────────────────────────────────────────────────────────── */}
      <section id="capabilities" style={{ maxWidth: '1180px', margin: '0 auto', padding: '48px 24px 96px', display: 'flex', flexDirection: 'column', gap: '96px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '48px', alignItems: 'center' }} className="studio-responsive-grid">
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '48px', alignItems: 'center' }} className="studio-responsive-grid">
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
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '48px', alignItems: 'center' }} className="studio-responsive-grid">
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
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

          <div style={{ background: '#0f121a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>Release Calendar</span>
              <span style={{ fontSize: '11px', color: '#4f46e5' }}>30-Day Autopilot</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '10px 12px', background: '#141824', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#fff' }}>Mon: Quantum Computing Explained</span>
                <span style={{ fontSize: '10px', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>Published</span>
              </div>
              <div style={{ padding: '10px 12px', background: '#141824', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#fff' }}>Wed: Neuromorphic AI Breakthroughs</span>
                <span style={{ fontSize: '10px', color: '#4f46e5', background: 'rgba(79, 70, 229, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>Scheduled (8 PM)</span>
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
                border: `1px solid ${p.popular ? 'rgba(79, 70, 229, 0.6)' : 'rgba(255, 255, 255, 0.08)'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{p.name}</h3>
                  {p.popular && (
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#4f46e5', background: 'rgba(79, 70, 229, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                      POPULAR
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', margin: '12px 0 2px', letterSpacing: '-0.02em' }}>
                  {p.price}<span style={{ fontSize: '13px', color: '#64748b', fontWeight: 400 }}>/mo</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#4f46e5', marginBottom: '8px' }}>{p.vids}</div>
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
                <span style={{ fontSize: '16px', color: '#4f46e5', marginLeft: '12px' }}>
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
