'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedScene, setSelectedScene] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackProgress, setPlaybackProgress] = useState<number>(24);
  const [activeVoice, setActiveVoice] = useState<string>('Christopher (Neural)');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Topic Simulator state
  const [activeTopicIndex, setActiveTopicIndex] = useState<number>(0);

  // Savings Calculator state
  const [videosPerMonth, setVideosPerMonth] = useState<number>(24);

  const workflowSteps = [
    {
      num: '01',
      title: 'Prompt Input',
      desc: 'Enter any topic, headline, or idea. The AI engine structures it into retention-focused narrative beats.',
      tag: 'LLM SCRIPT ENGINE',
    },
    {
      num: '02',
      title: 'Select Aesthetics',
      desc: 'Pick your visual style from Cinematic 35mm, Documentary Minimalist, Cyberpunk, or Nature Vitality.',
      tag: '1080P B-ROLL FEED',
    },
    {
      num: '03',
      title: 'Neural Voice',
      desc: 'Select from 40+ high-fidelity neural voices with customizable speech pacing and studio dynamics.',
      tag: '48KHZ STEREO AAC',
    },
    {
      num: '04',
      title: 'Direct Auto-Publish',
      desc: 'Connect your YouTube channel via Google OAuth 2.0 and let autopilot release scheduled videos.',
      tag: 'YOUTUBE DATA API V3',
    },
  ];

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
      tag: 'B-Roll: Brain Synapse Simulation',
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
      tag: 'B-Roll: High-CTR Endscreen Cards',
    },
  ];

  const simulatedTopics = [
    {
      topic: 'The 2026 Neuromorphic AI Chip Revolution',
      niche: 'AI & Tech',
      scenes: [
        '01. Hook: Silicon computing hitting the physical memory wall (00:00 - 00:18)',
        '02. Core: How synaptic architecture mimics biological neurons (00:18 - 00:42)',
        '03. Proof: 100x energy efficiency in autonomous robotics benchmarks (00:42 - 01:05)',
        '04. CTA: Which tech giant will dominate the architectural transition? (01:05 - 01:25)',
      ],
      suggestedTitle: 'Why Neuromorphic AI Chips Will Replace GPUs by 2027',
      estDuration: '01:25 • 1080P CFR',
      credits: '58 Credits',
    },
    {
      topic: 'How Quantitative Hedge Funds Exploit Market Microstructure',
      niche: 'Finance & Systems',
      scenes: [
        '01. Hook: The 1-nanosecond gap between profit and liquidation (00:00 - 00:16)',
        '02. Core: Limit order book dynamics and latency arbitrage mechanisms (00:16 - 00:45)',
        '03. Proof: Predictive fill rates in dark pools using machine learning (00:45 - 01:10)',
        '04. CTA: Subscribe for institutional quantitative trading breakdowns (01:10 - 01:30)',
      ],
      suggestedTitle: 'Inside High-Frequency Trading: How Algorithms Trade in Nanoseconds',
      estDuration: '01:30 • 1080P CFR',
      credits: '62 Credits',
    },
    {
      topic: 'What Actually Happens Inside an Event Horizon',
      niche: 'Space & Physics',
      scenes: [
        '01. Hook: Gravitational time dilation freezes falling matter at the boundary (00:00 - 00:22)',
        '02. Core: Tidal forces and mathematical spaghettification (00:22 - 00:50)',
        '03. Proof: Hawking radiation and the black hole information paradox (00:50 - 01:15)',
        '04. CTA: Comment below: Does physical information truly escape? (01:15 - 01:35)',
      ],
      suggestedTitle: 'What You Would Actually Experience Falling Into a Black Hole',
      estDuration: '01:35 • 1080P CFR',
      credits: '65 Credits',
    },
    {
      topic: '5 Psychological Habits of Elite Software Engineers',
      niche: 'Engineering & Career',
      scenes: [
        '01. Hook: The top 1% of engineers write fewer lines of code, not more (00:00 - 00:18)',
        '02. Core: Deep work scheduling and asynchronous communication protocols (00:18 - 00:44)',
        '03. Proof: The compound leverage of idempotent automation (00:44 - 01:08)',
        '04. CTA: Download our free system architecture cheat sheet below (01:08 - 01:28)',
      ],
      suggestedTitle: 'How 10x Engineers Think: 5 Rules for Extreme Leverage',
      estDuration: '01:28 • 1080P CFR',
      credits: '60 Credits',
    },
  ];

  const faqs = [
    {
      q: 'How does the YouTube auto-publishing integration work?',
      a: 'You connect your YouTube channel once using official Google OAuth 2.0. In your Content Calendar, you set scheduled release times. AutoVideo generates, renders in 1080p, and uploads directly to your channel with custom titles, tags, and thumbnails.',
    },
    {
      q: 'Do I need my own video editing software or external API keys?',
      a: 'No external software is required. AutoVideo includes a native 1080p FFmpeg compositor, neural voiceovers, dynamic subtitle burning, and stock B-roll matching out-of-the-box.',
    },
    {
      q: 'What resolution and video format are rendered?',
      a: 'All videos are rendered in broadcast-quality 1080p Full HD (1920x1080) at a constant 30 fps (CFR) using H.264 video and 48kHz AAC stereo audio formatted for instant YouTube streaming.',
    },
    {
      q: 'Can I edit the script and preview scenes before publishing?',
      a: 'Yes. The Video Studio lets you edit any sentence, swap B-roll clips, change narration voice, or use the built-in AI Copilot to rewrite scene hooks with one click.',
    },
    {
      q: 'What happens if a YouTube upload fails due to network or quota issues?',
      a: 'The background scheduler features automated retry recovery and error logging. You can also click Retry in your Calendar or Studio dashboard at any time to re-trigger upload.',
    },
    {
      q: 'How do credits work and can I upgrade anytime?',
      a: 'Every new account receives 500 free credits. Generating a complete 1080p video costs ~60 credits. Paid subscription plans include monthly credit allotments, and you can purchase top-ups anytime.',
    },
  ];

  // Calculate Savings
  const traditionalCost = videosPerMonth * 125 + 180;
  const autoVideoCost = videosPerMonth <= 8 ? 19 : videosPerMonth <= 24 ? 49 : 99;
  const netSavings = traditionalCost - autoVideoCost;
  const hoursSaved = Math.round(videosPerMonth * 4.5);

  return (
    <div style={{ background: '#09090b', color: '#f4f4f5', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>
      {/* ───────────────────────────────────────────────────────────
          1. NAVIGATION BAR
      ─────────────────────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(9, 9, 11, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0 24px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#09090b',
                fontWeight: 700,
                fontSize: '12px',
                fontFamily: 'monospace',
              }}
            >
              AV
            </div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#f4f4f5', letterSpacing: '-0.02em' }}>
              AutoVideo
            </span>
            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#71717a', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '1px 4px', borderRadius: '3px' }}>
              v2.4
            </span>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }} className="hidden-mobile">
            <a href="#workflow" style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 500, textDecoration: 'none', transition: 'color 0.15s' }}>
              Workflow
            </a>
            <a href="#simulator" style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 500, textDecoration: 'none', transition: 'color 0.15s' }}>
              Simulator
            </a>
            <a href="#capabilities" style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 500, textDecoration: 'none', transition: 'color 0.15s' }}>
              Features
            </a>
            <a href="#calculator" style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 500, textDecoration: 'none', transition: 'color 0.15s' }}>
              ROI
            </a>
            <a href="#pricing" style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 500, textDecoration: 'none', transition: 'color 0.15s' }}>
              Pricing
            </a>
            <a href="#faq" style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 500, textDecoration: 'none', transition: 'color 0.15s' }}>
              FAQ
            </a>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            href="/login"
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#a1a1aa',
              padding: '5px 10px',
              textDecoration: 'none',
            }}
            className="hidden-mobile"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#09090b',
              background: '#ffffff',
              padding: '6px 14px',
              borderRadius: '6px',
              textDecoration: 'none',
              border: '1px solid #ffffff',
              transition: 'background 0.15s',
            }}
          >
            Start Free ➔
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '4px 8px', display: 'none' }}
            id="mobileMenuToggle"
            aria-label="Toggle menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="landing-mobile-drawer">
            <a href="#workflow" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Workflow</a>
            <a href="#simulator" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Simulator</a>
            <a href="#capabilities" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Features</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>FAQ</a>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary btn-sm" style={{ flex: 1, textAlign: 'center' }}>Sign In</Link>
              <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center' }}>Start Free</Link>
            </div>
          </div>
        )}
      </header>

      {/* ───────────────────────────────────────────────────────────
          2. HERO SECTION
      ─────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '56px 20px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '4px', marginBottom: '18px' }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#a1a1aa', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
            AUTONOMOUS VIDEO PIPELINE • YOUTUBE DIRECT
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.4rem)', fontWeight: 700, color: '#f4f4f5', letterSpacing: '-0.03em', lineHeight: 1.15, maxWidth: '820px', margin: '0 auto 16px' }}>
          Turn an idea into a finished YouTube video.
        </h1>

        <p style={{ fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)', color: '#a1a1aa', maxWidth: '580px', lineHeight: 1.6, margin: '0 auto 24px' }}>
          Generate retention-focused scripts, voiceovers, and dynamic visuals in seconds.
        </p>

        {/* Primary Call to Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '22px' }}>
          <Link
            href="/signup"
            style={{
              padding: '10px 22px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#09090b',
              background: '#ffffff',
              borderRadius: '6px',
              textDecoration: 'none',
              border: '1px solid #ffffff',
              transition: 'background 0.15s',
            }}
          >
            Start Creating Free ➔
          </Link>
          <a
            href="#simulator"
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#d4d4d8',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              textDecoration: 'none',
              fontFamily: 'monospace',
            }}
          >
            Live Simulator ↓
          </a>
        </div>

        {/* Monospace Trust Proof */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '11px', fontFamily: 'monospace', color: '#71717a' }}>
          <span>✓ 500 FREE CREDITS</span>
          <span>•</span>
          <span>✓ 1080P 30FPS CFR</span>
          <span>•</span>
          <span>✓ YOUTUBE DATA API V3</span>
        </div>

        {/* ───────────────────────────────────────────────────────────
            3. INTERACTIVE 3-PANE STUDIO WORKSPACE
        ─────────────────────────────────────────────────────────── */}
        <div
          style={{
            width: '100%',
            maxWidth: '1040px',
            marginTop: '36px',
            background: '#121215',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            overflow: 'hidden',
            textAlign: 'left',
          }}
        >
          {/* Workspace Chrome */}
          <div style={{ padding: '10px 16px', background: '#09090b', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27272a' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27272a' }} />
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27272a' }} />
              </div>
              <span style={{ fontSize: '11px', fontWeight: 500, color: '#a1a1aa', fontFamily: 'monospace' }}>
                studio / neuromorphic-ai-revolution.mp4
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '1px 6px', borderRadius: '3px', border: '1px solid rgba(16, 185, 129, 0.25)', fontFamily: 'monospace', fontWeight: 600 }}>
                ● 1080P CFR READY
              </span>
              <span style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace' }}>01:24</span>
            </div>
          </div>

          {/* 3-Pane Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr 240px', minHeight: '360px' }} className="studio-responsive-grid">
            {/* Left: Storyboard */}
            <div style={{ padding: '12px', background: '#121215', borderRight: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: '2px' }}>
                STORYBOARD ({scenes.length} SCENES)
              </div>

              {scenes.map((s, idx) => (
                <div
                  key={s.id}
                  onClick={() => { setSelectedScene(idx); setPlaybackProgress((idx + 1) * 24); }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '4px',
                    background: selectedScene === idx ? '#18181b' : 'transparent',
                    border: `1px solid ${selectedScene === idx ? '#ffffff' : 'rgba(255, 255, 255, 0.05)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: selectedScene === idx ? '#ffffff' : '#a1a1aa' }}>
                      {s.title}
                    </div>
                    <span style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', color: '#71717a', fontFamily: 'monospace' }}>
                      {s.duration}
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#52525b', marginTop: '1px', fontFamily: 'monospace' }}>
                    {s.time}
                  </div>
                </div>
              ))}
            </div>

            {/* Center: Video Player */}
            <div style={{ padding: '16px', background: '#09090b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16 / 9',
                  background: '#121215',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '9px', color: '#a1a1aa', background: 'rgba(0,0,0,0.85)', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace' }}>
                  1920 × 1080 • 30FPS
                </div>

                <div style={{ position: 'absolute', top: '8px', left: '8px', fontSize: '9px', color: '#10b981', background: 'rgba(0,0,0,0.85)', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace' }}>
                  {scenes[selectedScene].tag}
                </div>

                {/* Subtitle Caption */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '14px',
                    left: '14px',
                    right: '14px',
                    textAlign: 'center',
                    padding: '8px 12px',
                    background: 'rgba(9, 9, 11, 0.9)',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#f4f4f5' }}>
                    {scenes[selectedScene].caption}
                  </span>
                </div>
              </div>

              {/* Scrubber Bar */}
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{
                    background: '#18181b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f4f4f5',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                  }}
                >
                  {isPlaying ? 'PAUSE' : 'PLAY'}
                </button>
                <span style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace' }}>
                  00:{(selectedScene + 1) * 18}
                </span>
                <div style={{ flex: 1, height: '3px', background: '#27272a', borderRadius: '2px', position: 'relative' }}>
                  <div style={{ width: `${playbackProgress}%`, height: '100%', background: '#ffffff', borderRadius: '2px', transition: 'width 0.2s' }} />
                </div>
                <span style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace' }}>01:24</span>
              </div>
            </div>

            {/* Right: Telemetry & Controls */}
            <div style={{ padding: '12px', background: '#121215', borderLeft: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                PIPELINE CONTROLS
              </div>

              <div style={{ padding: '8px 10px', background: '#09090b', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace' }}>VOICEOVER</div>
                <select
                  value={activeVoice}
                  onChange={(e) => setActiveVoice(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    color: '#f4f4f5',
                    border: 'none',
                    padding: '2px 0',
                    fontSize: '11px',
                    fontWeight: 500,
                    outline: 'none',
                  }}
                >
                  <option value="Christopher (Neural)">Christopher (Neural 48kHz)</option>
                  <option value="Jenny (Neural)">Jenny (Clear Female)</option>
                  <option value="Guy (Neural)">Guy (Deep Voice)</option>
                  <option value="Sonia (Neural)">Sonia (British Studio)</option>
                </select>
              </div>

              <div style={{ padding: '8px 10px', background: '#09090b', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace' }}>YOUTUBE BRIDGE</div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#f4f4f5', marginTop: '2px' }}>Tech Pulse Daily</div>
                <div style={{ fontSize: '10px', color: '#10b981', marginTop: '2px', fontFamily: 'monospace' }}>● OAUTH 2.0 CONNECTED</div>
              </div>

              <div style={{ padding: '8px 10px', background: '#09090b', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace' }}>SCHEDULE RELEASE</div>
                <div style={{ fontSize: '11px', fontWeight: 500, color: '#f4f4f5', marginTop: '2px' }}>Aug 31 @ 20:00 UTC</div>
                <div style={{ fontSize: '10px', color: '#a1a1aa', marginTop: '2px', fontFamily: 'monospace' }}>AUTOPILOT QUEUED</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          3. WORKFLOW STEPS SECTION (4-Step Linear Pipeline)
      ─────────────────────────────────────────────────────────── */}
      <section id="workflow" style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '580px', margin: '0 auto 32px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'monospace', marginBottom: '6px' }}>
            LINEAR PIPELINE
          </div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700, color: '#f4f4f5', letterSpacing: '-0.02em', margin: 0 }}>
            How It Works
          </h2>
          <p style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '6px' }}>
            From a single prompt to a scheduled 1080p YouTube release in four automated steps.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          {workflowSteps.map((step) => (
            <div
              key={step.num}
              className="card"
              style={{
                padding: '20px',
                background: '#121215',
                borderColor: 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', fontFamily: 'monospace' }}>
                  {step.num}
                </span>
                <span style={{ fontSize: '9px', fontFamily: 'monospace', padding: '1px 5px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#71717a' }}>
                  {step.tag}
                </span>
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f4f4f5', margin: 0 }}>
                {step.num}. {step.title}
              </h3>
              <p style={{ fontSize: '12px', color: '#71717a', lineHeight: 1.5, margin: 0 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          4. LIVE TOPIC SIMULATOR
      ─────────────────────────────────────────────────────────── */}
      <section id="simulator" style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 20px' }}>
        <div style={{ maxWidth: '600px', marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'monospace', marginBottom: '4px' }}>
            INTERACTIVE BENCHMARK
          </div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700, color: '#f4f4f5', letterSpacing: '-0.02em', margin: 0 }}>
            Simulate Video Scene Breakdown
          </h2>
          <p style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '6px' }}>
            Click any niche domain to inspect real-time AI scene structuring and metadata generation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {simulatedTopics.map((t, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveTopicIndex(idx)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: activeTopicIndex === idx ? 600 : 500,
                cursor: 'pointer',
                background: activeTopicIndex === idx ? '#ffffff' : '#18181b',
                color: activeTopicIndex === idx ? '#09090b' : '#a1a1aa',
                border: activeTopicIndex === idx ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.08)',
                transition: 'all 0.12s ease',
              }}
            >
              {t.niche}
            </button>
          ))}
        </div>

        <div style={{ background: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '14px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', fontFamily: 'monospace' }}>INPUT TOPIC</div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', margin: '2px 0 0 0' }}>
                "{simulatedTopics[activeTopicIndex].topic}"
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: '#18181b', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#10b981', fontFamily: 'monospace' }}>
                {simulatedTopics[activeTopicIndex].estDuration}
              </span>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: '#18181b', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#a1a1aa', fontFamily: 'monospace' }}>
                {simulatedTopics[activeTopicIndex].credits}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '16px' }}>
            {simulatedTopics[activeTopicIndex].scenes.map((sceneText, sIdx) => (
              <div key={sIdx} style={{ padding: '12px', background: '#09090b', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '10px', color: '#a1a1aa', fontFamily: 'monospace', fontWeight: 600, marginBottom: '4px' }}>
                  SCENE 0{sIdx + 1} BEAT
                </div>
                <div style={{ fontSize: '11px', color: '#d4d4d8', lineHeight: 1.5 }}>
                  {sceneText}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '10px 14px', background: '#09090b', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace' }}>SUGGESTED TITLE: </span>
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#f4f4f5' }}>
                {simulatedTopics[activeTopicIndex].suggestedTitle}
              </span>
            </div>
            <Link href="/signup" style={{ fontSize: '11px', fontWeight: 600, color: '#ffffff', textDecoration: 'none', fontFamily: 'monospace' }}>
              Create This Video Free ➔
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          5. ROI & SAVINGS CALCULATOR
      ─────────────────────────────────────────────────────────── */}
      <section id="calculator" style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 20px' }}>
        <div style={{ background: '#121215', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '28px' }}>
          <div style={{ textAlign: 'center', maxWidth: '540px', margin: '0 auto 24px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'monospace', marginBottom: '4px' }}>
              ROI CALCULATOR
            </div>
            <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)', fontWeight: 700, color: '#f4f4f5', letterSpacing: '-0.02em', margin: 0 }}>
              Monthly Production Savings
            </h2>
            <p style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '4px' }}>
              Compare autonomous pipeline costs against traditional freelancer video editing rates.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#a1a1aa', fontFamily: 'monospace' }}>
              VIDEOS PUBLISHED PER MONTH
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[4, 8, 16, 24, 30, 60].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setVideosPerMonth(count)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: videosPerMonth === count ? '#ffffff' : '#18181b',
                    color: videosPerMonth === count ? '#09090b' : '#a1a1aa',
                    border: videosPerMonth === count ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.08)',
                    transition: 'all 0.12s ease',
                  }}
                >
                  {count} {count === 30 ? '(Daily)' : 'Vids'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '16px', background: '#09090b', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '10px', color: '#ef4444', fontFamily: 'monospace', textTransform: 'uppercase' }}>FREELANCERS + TOOL STACK</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#f4f4f5', margin: '6px 0 2px', fontFamily: 'monospace' }}>
                ${traditionalCost.toLocaleString()}
                <span style={{ fontSize: '11px', color: '#71717a', fontWeight: 400 }}>/mo</span>
              </div>
              <p style={{ fontSize: '11px', color: '#71717a', lineHeight: 1.4, margin: 0 }}>
                $125/video editing fees + voiceover, stock B-roll, and scheduling tool subscriptions.
              </p>
            </div>

            <div style={{ padding: '16px', background: '#09090b', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <div style={{ fontSize: '10px', color: '#f4f4f5', fontFamily: 'monospace', textTransform: 'uppercase' }}>AUTOVIDEO.AI PIPELINE</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#f4f4f5', margin: '6px 0 2px', fontFamily: 'monospace' }}>
                ${autoVideoCost}
                <span style={{ fontSize: '11px', color: '#71717a', fontWeight: 400 }}>/mo</span>
              </div>
              <p style={{ fontSize: '11px', color: '#71717a', lineHeight: 1.4, margin: 0 }}>
                1080p FFmpeg compositor, neural voices, and direct YouTube auto-publishing included.
              </p>
            </div>

            <div style={{ padding: '16px', background: '#09090b', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ fontSize: '10px', color: '#10b981', fontFamily: 'monospace', textTransform: 'uppercase' }}>NET MONTHLY SAVINGS</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#10b981', margin: '6px 0 2px', fontFamily: 'monospace' }}>
                +${netSavings.toLocaleString()}
                <span style={{ fontSize: '11px', color: '#71717a', fontWeight: 400 }}>/mo</span>
              </div>
              <p style={{ fontSize: '11px', color: '#71717a', lineHeight: 1.4, margin: 0 }}>
                Plus approximately <strong>{hoursSaved} hours</strong> of manual editing saved each month.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          6. CORE CAPABILITIES (Feature Bento Cards)
      ─────────────────────────────────────────────────────────── */}
      <section id="capabilities" style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '580px', margin: '0 auto 32px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'monospace', marginBottom: '6px' }}>
            PRODUCTION CAPABILITIES
          </div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700, color: '#f4f4f5', letterSpacing: '-0.02em', margin: 0 }}>
            Built for Serious YouTube Channels
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '24px', background: '#121215', borderColor: 'rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '10px', color: '#a1a1aa', fontFamily: 'monospace' }}>01 • SCRIPT & HOOKS</div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', margin: 0 }}>
              Retention-Engineered Scriptwriting
            </h3>
            <p style={{ fontSize: '12px', color: '#71717a', lineHeight: 1.5, margin: 0 }}>
              AutoVideo divides video topics into concise narrative beats with pacing notes, visual suggestions, and high-retention hook phrasing.
            </p>
            <div style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'monospace', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              ✓ 40+ Neural Voices • Hook Copilot
            </div>
          </div>

          <div className="card" style={{ padding: '24px', background: '#121215', borderColor: 'rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '10px', color: '#a1a1aa', fontFamily: 'monospace' }}>02 • COMPOSITION</div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', margin: 0 }}>
              1080p FFmpeg Server Compositor
            </h3>
            <p style={{ fontSize: '12px', color: '#71717a', lineHeight: 1.5, margin: 0 }}>
              Server-side rendering matches B-roll video footage, mixes speech audio with background tracks, and burns synchronized captions at 30fps CFR.
            </p>
            <div style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'monospace', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              ✓ 1080p H.264 FastStart • SRT Sync
            </div>
          </div>

          <div className="card" style={{ padding: '24px', background: '#121215', borderColor: 'rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '10px', color: '#a1a1aa', fontFamily: 'monospace' }}>03 • DISTRIBUTION</div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', margin: 0 }}>
              Autonomous 30-Day Autopilot
            </h3>
            <p style={{ fontSize: '12px', color: '#71717a', lineHeight: 1.5, margin: 0 }}>
              Connect your YouTube channel once using official Google OAuth 2.0. AutoVideo uploads videos and manages publication according to your release calendar.
            </p>
            <div style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'monospace', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              ✓ YouTube Data API v3 • Retry Recovery
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          7. PRICING (3-Column Clean Grid)
      ─────────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'monospace', marginBottom: '6px' }}>
            SUBSCRIPTION PLANS
          </div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700, color: '#f4f4f5', letterSpacing: '-0.02em', margin: 0 }}>
            Transparent Pricing
          </h2>
          <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '6px auto 18px', maxWidth: '480px' }}>
            Every plan includes 1080p video rendering, neural voiceovers, and YouTube auto-publishing.
          </p>

          {/* Billing Switcher */}
          <div style={{ display: 'inline-flex', alignItems: 'center', background: '#121215', padding: '3px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '4px 12px',
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 600,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: billingCycle === 'monthly' ? '#27272a' : 'transparent',
                color: billingCycle === 'monthly' ? '#f4f4f5' : '#71717a',
              }}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              style={{
                padding: '4px 12px',
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 600,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: billingCycle === 'annual' ? '#27272a' : 'transparent',
                color: billingCycle === 'annual' ? '#f4f4f5' : '#71717a',
              }}
            >
              Annual (Save 20%)
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {[
            {
              name: 'Starter',
              price: billingCycle === 'annual' ? '$15' : '$19',
              vids: '~8 Full Videos/mo',
              credits: '500 Credits/mo',
              desc: 'For creators establishing their first automated YouTube channel.',
              popular: false,
            },
            {
              name: 'Pro Creator',
              price: billingCycle === 'annual' ? '$39' : '$49',
              vids: '~24 Full Videos/mo',
              credits: '1,500 Credits/mo',
              desc: 'For active channels maintaining a consistent schedule.',
              popular: true,
            },
            {
              name: 'Scale',
              price: billingCycle === 'annual' ? '$79' : '$99',
              vids: '~60 Full Videos/mo',
              credits: '4,000 Credits/mo',
              desc: 'For multi-channel operators scaling daily content output.',
              popular: false,
            },
          ].map((p) => (
            <div
              key={p.name}
              className="card"
              style={{
                padding: '24px',
                borderRadius: '8px',
                background: '#121215',
                borderColor: p.popular ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', margin: 0 }}>{p.name}</h3>
                  {p.popular && (
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#09090b', background: '#ffffff', padding: '1px 6px', borderRadius: '3px', fontFamily: 'monospace' }}>
                      POPULAR
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '26px', fontWeight: 700, color: '#f4f4f5', margin: '10px 0 2px', fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
                  {p.price}<span style={{ fontSize: '12px', color: '#71717a', fontWeight: 400 }}>/mo</span>
                </div>

                <div style={{ fontSize: '11px', fontWeight: 600, color: '#a1a1aa', fontFamily: 'monospace', marginBottom: '8px' }}>
                  {p.vids}
                </div>

                <p style={{ fontSize: '12px', color: '#71717a', lineHeight: 1.5, marginBottom: '16px' }}>
                  {p.desc}
                </p>

                <div style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '10px' }}>
                  Includes: {p.credits} • 1080p Export • YouTube Autopilot
                </div>
              </div>

              <Link
                href="/signup"
                className={p.popular ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                style={{
                  marginTop: '18px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  height: '32px',
                }}
              >
                Get Started ➔
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          8. FREQUENTLY ASKED QUESTIONS
      ─────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ maxWidth: '760px', margin: '0 auto', padding: '36px 20px 64px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'monospace', marginBottom: '4px' }}>
            DOCUMENTATION
          </div>
          <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)', fontWeight: 700, color: '#f4f4f5', letterSpacing: '-0.02em', margin: 0 }}>
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
                  padding: '14px 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'transparent',
                  border: 'none',
                  color: '#f4f4f5',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span>{f.q}</span>
                <span style={{ fontSize: '14px', color: '#71717a', fontFamily: 'monospace', marginLeft: '10px' }}>
                  {openFaq === i ? '−' : '+'}
                </span>
              </button>
              {openFaq === i && (
                <div style={{ paddingBottom: '14px', fontSize: '12px', color: '#a1a1aa', lineHeight: 1.6 }}>
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          9. CLOSING CALL TO ACTION
      ─────────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 20px 60px' }}>
        <div
          style={{
            padding: '36px 24px',
            background: '#121215',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 700, color: '#f4f4f5', letterSpacing: '-0.02em', margin: 0 }}>
            Ready to automate your next video?
          </h2>
          <p style={{ fontSize: '13px', color: '#a1a1aa', maxWidth: '460px', lineHeight: 1.5, margin: 0 }}>
            Start creating with AutoVideo. 500 free credits included with no credit card required.
          </p>
          <Link
            href="/signup"
            style={{
              marginTop: '6px',
              padding: '10px 22px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#09090b',
              background: '#ffffff',
              borderRadius: '6px',
              textDecoration: 'none',
              border: '1px solid #ffffff',
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
          padding: '24px 20px',
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '11px',
          fontFamily: 'monospace',
          color: '#71717a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, color: '#f4f4f5' }}>AutoVideo.ai</span>
          <span>© 2026 AutoVideo SaaS. All rights reserved.</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/login" style={{ color: '#a1a1aa', textDecoration: 'none' }}>Sign In</Link>
          <Link href="/signup" style={{ color: '#a1a1aa', textDecoration: 'none' }}>Register</Link>
        </div>
      </footer>
    </div>
  );
}
