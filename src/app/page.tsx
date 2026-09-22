'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LandingPage } from '@/components/LandingPage';
import { useToast } from '@/components/Toast';

export default function HomePage() {
  const router = useRouter();
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [monthlyUsage, setMonthlyUsage] = useState({ used: 0, limit: 30, remaining: 30 });
  const [loading, setLoading] = useState(true);

  // New Automation Form State (AUTOSHORT)
  const [quickTopic, setQuickTopic] = useState('');
  const [voiceModel, setVoiceModel] = useState('Adam (Deep, Narrator)');
  const [backgroundFootage, setBackgroundFootage] = useState('Minecraft Parkour');
  const [duration, setDuration] = useState<number>(45);
  const [autoCaptions, setAutoCaptions] = useState(true);
  const [autoUpload, setAutoUpload] = useState(false);
  const [creating, setCreating] = useState(false);

  const viralIdeas = [
    'Top 5 mysterious places in the world no one can explain',
    'Dark psychological facts about human attraction',
    'What happens to your body when you drink black coffee every day',
    '3 ancient lost cities discovered deep beneath the ocean',
    'Sigma male habits that command instant respect in any room',
    'Mind-blowing artificial intelligence breakthroughs coming in 2026',
    '5 shocking paradoxes that will break your brain',
    'Why the world is running out of sand and what happens next',
  ];

  const trendingTags = [
    { tag: '#AIRevolution', views: '2.1M views/hr', topic: 'The unstoppable rise of autonomous AI in 2026' },
    { tag: '#CodingLife', views: '850K views/hr', topic: '5 coding habits that separate senior devs from juniors' },
    { tag: '#FactsDaily', views: '1.4M views/hr', topic: '3 bizarre facts about history they never taught you in school' },
    { tag: '#Motivation', views: '3.2M views/hr', topic: 'The brutal truth about discipline vs motivation' },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [meRes, projRes, chanRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/projects'),
        fetch('/api/channels'),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.authenticated) {
          setCurrentUser(meData.user);
        }
      }

      if (projRes.ok) {
        const pData = await projRes.json();
        setProjects(pData.projects || []);
        if (pData.monthlyUsage) {
          setMonthlyUsage(pData.monthlyUsage);
        }
      }

      if (chanRes.ok) {
        const cData = await chanRes.json();
        setChannels(cData.channels || []);
      }
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRandomTopic = () => {
    const random = viralIdeas[Math.floor(Math.random() * viralIdeas.length)];
    setQuickTopic(random);
    toast.info('Viral prompt loaded ✨');
  };

  const handleResetConfig = () => {
    setQuickTopic('');
    setVoiceModel('Adam (Deep, Narrator)');
    setBackgroundFootage('Minecraft Parkour');
    setDuration(45);
    setAutoCaptions(true);
    setAutoUpload(false);
    toast.info('Configuration reset to defaults.');
  };

  const handleGenerateShort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTopic.trim()) {
      toast.warning('Please enter a video topic or script');
      return;
    }
    if (creating) return;

    try {
      setCreating(true);
      toast.info('Queueing AI video generation... ⚡');

      let targetChannelId = channels[0]?.id;
      if (!targetChannelId) {
        const cRes = await fetch('/api/channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Studio Persona', niche: 'General', target_duration_minutes: 1 }),
        });
        if (cRes.ok) {
          const cData = await cRes.json();
          targetChannelId = cData.channel?.id;
        }
      }

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: targetChannelId || 'default_channel',
          topic: quickTopic.trim(),
          target_length_minutes: Math.max(1, Math.round(duration / 60)),
          voice: voiceModel,
          visual_style: backgroundFootage,
          auto_captions: autoCaptions,
          auto_upload: autoUpload,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create video');
      }

      const data = await res.json();
      toast.success('Short generated and queued successfully!');
      router.push(`/content/${data.projectId}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  // If user is not authenticated, show public marketing landing page
  if (!loading && !currentUser) {
    return <LandingPage />;
  }

  // Active in-progress rendering project (if any)
  const activeRendering = projects.find(
    (p) => p.status === 'processing' || p.status === 'rendering' || p.status === 'generating'
  );

  // Completed recent projects
  const completedProjects = projects.filter((p) => p.status === 'completed');

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', padding: '8px 0 40px' }}>
      
      {/* ─────────────────────────────────────────────────────────────
          1. METRICS / STATS CARDS ROW (4 CARDS)
      ───────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '18px'
      }}>
        {/* Stat 1: Total Views */}
        <div className="autoshort-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="autoshort-stat-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <span className="autoshort-badge-green">+12%</span>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              1.2M
            </div>
            <div style={{ fontSize: '13px', color: '#71717a', marginTop: '6px', fontWeight: 500 }}>
              Total Views
            </div>
          </div>
        </div>

        {/* Stat 2: Subscribers */}
        <div className="autoshort-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="autoshort-stat-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span className="autoshort-badge-green">+4%</span>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              24.5k
            </div>
            <div style={{ fontSize: '13px', color: '#71717a', marginTop: '6px', fontWeight: 500 }}>
              Subscribers
            </div>
          </div>
        </div>

        {/* Stat 3: Saved Time */}
        <div className="autoshort-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="autoshort-stat-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              1h 42m
            </div>
            <div style={{ fontSize: '13px', color: '#71717a', marginTop: '6px', fontWeight: 500 }}>
              Saved Time
            </div>
          </div>
        </div>

        {/* Stat 4: Credits Left */}
        <div className="autoshort-stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="autoshort-stat-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {currentUser?.credits ?? 840}
            </div>
            <div style={{ fontSize: '13px', color: '#71717a', marginTop: '6px', fontWeight: 500 }}>
              Credits Left
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          FEATURED: PERSONAL AI CREATOR
      ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.08) 50%, rgba(17, 17, 24, 0.95) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '16px',
        padding: '28px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px -8px rgba(99, 102, 241, 0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{
                background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 9px',
                borderRadius: '6px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                Personal AI Creator
              </span>
              <span style={{ fontSize: '13px', color: '#a1a1aa' }}>
                Turn your photo and voice into YouTube videos.
              </span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
              Create YouTube videos using your own face and voice.
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: '6px 0 0', maxWidth: '780px' }}>
              Upload your photo and voice sample to generate realistic presenter-style YouTube videos with automatic scriptwriting, scene composition, and intelligent B-roll.
            </p>
          </div>

          <Link
            href="/dashboard/personal-ai"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#ffffff',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              transition: 'transform 0.15s ease',
            }}
          >
            <span>Open Studio</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Action Buttons Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <Link
            href="/dashboard/personal-ai?tab=create"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
              transition: 'background 0.2s ease',
            }}
          >
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <span>Create Video</span>
          </Link>

          <Link
            href="/dashboard/personal-ai?tab=projects"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
              transition: 'background 0.2s ease',
            }}
          >
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <span>My Projects</span>
          </Link>

          <Link
            href="/dashboard/personal-ai?tab=avatar"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
              transition: 'background 0.2s ease',
            }}
          >
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(236, 72, 153, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f472b6' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="7" r="4" />
                <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2" />
              </svg>
            </div>
            <span>My Avatar</span>
          </Link>

          <Link
            href="/dashboard/personal-ai?tab=voice"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              color: '#ffffff',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '13px',
              transition: 'background 0.2s ease',
            }}
          >
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
            <span>My Voice</span>
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA (TWO-COLUMN LAYOUT)
      ───────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.85fr) minmax(0, 1fr)',
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* ── LEFT COLUMN: NEW AUTOMATION & TRENDING HASHTAGS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* New Automation Card */}
          <div className="autoshort-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em', margin: 0 }}>
                New Automation
              </h2>
              <button
                type="button"
                onClick={handleResetConfig}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#71717a',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'color 0.15s ease',
                  padding: '4px 6px'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
              >
                Reset Config
              </button>
            </div>

            <form onSubmit={handleGenerateShort} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Field 1: Video Topic or Script */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>
                  Video Topic or Script
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="autoshort-input"
                    style={{ paddingRight: '46px' }}
                    placeholder="e.g. Top 5 mysterious places in the world..."
                    value={quickTopic}
                    onChange={(e) => setQuickTopic(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleRandomTopic}
                    title="Generate viral random topic"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#71717a',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                      borderRadius: '6px',
                      transition: 'color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#c084fc')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#71717a')}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Row with 2 Dropdowns: AI Voice Model & Background Footage */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {/* Voice Model */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>
                    AI Voice Model
                  </label>
                  <select
                    className="autoshort-select"
                    value={voiceModel}
                    onChange={(e) => setVoiceModel(e.target.value)}
                  >
                    <option value="Adam (Deep, Narrator)">Adam (Deep, Narrator)</option>
                    <option value="Rachel (Energetic, Viral)">Rachel (Energetic, Viral)</option>
                    <option value="Antony (Documentary)">Antony (Documentary)</option>
                    <option value="Bella (Warm, Friendly)">Bella (Warm, Friendly)</option>
                    <option value="Josh (Dramatic Storyteller)">Josh (Dramatic Storyteller)</option>
                  </select>
                </div>

                {/* Background Footage */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>
                    Background Footage
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      className="autoshort-select"
                      value={backgroundFootage}
                      onChange={(e) => setBackgroundFootage(e.target.value)}
                    >
                      <option value="Minecraft Parkour">Minecraft Parkour</option>
                      <option value="Subway Surfers Gameplay">Subway Surfers</option>
                      <option value="Satisfying Kinetic / Slime">Satisfying Slime</option>
                      <option value="GTA 5 Mega Ramp Stunts">GTA 5 Mega Ramp</option>
                      <option value="Cinematic 4K Deep Space">Deep Space 4K</option>
                      <option value="Relaxing Nature Drone">Nature Cinematic</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Duration Limit Slider */}
              <div style={{ marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa' }}>
                    Duration Limit
                  </label>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#ffffff',
                    background: '#18181b',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {duration}s
                  </span>
                </div>
                
                <input
                  type="range"
                  min={15}
                  max={60}
                  step={1}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="autoshort-slider"
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: '#52525b', fontWeight: 600 }}>
                  <span style={{ color: duration === 15 ? '#fff' : '#52525b' }}>15s</span>
                  <span style={{ color: duration === 30 ? '#fff' : '#52525b' }}>30s</span>
                  <span style={{ color: duration === 45 ? '#fff' : '#52525b' }}>45s</span>
                  <span style={{ color: duration === 60 ? '#fff' : '#52525b' }}>60s</span>
                </div>
              </div>

              {/* Toggles Row: Auto Captions & Auto Upload */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
                paddingTop: '6px'
              }}>
                {/* Toggle 1: Auto Captions */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Auto Captions</div>
                    <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>Karaoke style animation</div>
                  </div>
                  <label className="autoshort-switch">
                    <input
                      type="checkbox"
                      checked={autoCaptions}
                      onChange={(e) => setAutoCaptions(e.target.checked)}
                    />
                    <span className="autoshort-switch-slider"></span>
                  </label>
                </div>

                {/* Toggle 2: Auto Upload */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '10px'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Auto Upload</div>
                    <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>Post to linked channel</div>
                  </div>
                  <label className="autoshort-switch">
                    <input
                      type="checkbox"
                      checked={autoUpload}
                      onChange={(e) => setAutoUpload(e.target.checked)}
                    />
                    <span className="autoshort-switch-slider"></span>
                  </label>
                </div>
              </div>

              {/* Primary Action Button: Generate Short */}
              <button
                type="submit"
                disabled={creating || !quickTopic.trim()}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '14px 20px',
                  background: '#ffffff',
                  color: '#09090b',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: creating || !quickTopic.trim() ? 'not-allowed' : 'pointer',
                  opacity: creating || !quickTopic.trim() ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 4px 14px rgba(255, 255, 255, 0.15)'
                }}
              >
                {creating ? (
                  <>
                    <div className="autoshort-spinner" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000', width: '16px', height: '16px' }} />
                    <span>Generating Short...</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>Generate Short</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Trending Hashtags Section */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '14px' }}>
              Trending Hashtags
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px'
            }}>
              {trendingTags.map((t, idx) => (
                <div
                  key={idx}
                  className="autoshort-tag-card"
                  onClick={() => {
                    setQuickTopic(t.topic);
                    toast.info(`Loaded topic from ${t.tag}`);
                  }}
                  title="Click to generate video about this trending topic"
                >
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#818cf8', letterSpacing: '-0.01em' }}>
                    {t.tag}
                  </span>
                  <span style={{ fontSize: '11px', color: '#71717a', fontWeight: 500 }}>
                    {t.views}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: ACTIVE QUEUE & RECENT UPLOADS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Active Queue Card */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '14px' }}>
              Active Queue
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Active Processing Item */}
              <div style={{
                background: '#111215',
                border: '1px solid rgba(139, 92, 246, 0.25)',
                borderRadius: '12px',
                padding: '16px 18px',
                boxShadow: '0 0 16px rgba(139, 92, 246, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: 'rgba(99, 102, 241, 0.12)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#a855f7',
                      flexShrink: 0
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                        <line x1="7" y1="2" x2="7" y2="22" />
                        <line x1="17" y1="2" x2="17" y2="22" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <line x1="2" y1="7" x2="7" y2="7" />
                        <line x1="2" y1="17" x2="7" y2="17" />
                        <line x1="17" y1="17" x2="22" y2="17" />
                        <line x1="17" y1="7" x2="22" y2="7" />
                      </svg>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {activeRendering?.topic || 'History of Rome'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                        {activeRendering?.stage ? `Processing: ${activeRendering.stage}...` : 'Generating Voiceover...'}
                      </div>
                    </div>
                  </div>

                  <div className="autoshort-spinner" />
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#71717a', fontWeight: 600, marginBottom: '6px' }}>
                    <span>Progress</span>
                    <span>{activeRendering?.progress ? `${activeRendering.progress}%` : '42%'}</span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      className="autoshort-progress-glow"
                      style={{ width: activeRendering?.progress ? `${activeRendering.progress}%` : '42%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Queued Item */}
              <div style={{
                background: '#0d0e12',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#71717a',
                    flexShrink: 0
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Tech News Daily
                    </div>
                    <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>
                      Scheduled: 14:00
                    </div>
                  </div>
                </div>

                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#71717a',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  Queued
                </span>
              </div>
            </div>
          </div>

          {/* Recent Uploads Section */}
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#52525b',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '14px'
            }}>
              RECENT UPLOADS
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Item 1 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: '#0d0e12',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {completedProjects[0]?.topic || 'Space Facts #42'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>
                      Posted 2h ago
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#d1d5db' }}>
                    12.4k
                  </span>
                  <span style={{ fontSize: '11px', color: '#71717a' }}>Views</span>
                  <Link
                    href={completedProjects[0] ? `/content/${completedProjects[0].id}` : '/content'}
                    style={{ color: '#71717a', display: 'flex', alignItems: 'center', marginLeft: '2px' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Item 2 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: '#0d0e12',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {completedProjects[1]?.topic || 'Sigma Rule #99'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>
                      Posted 5h ago
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#d1d5db' }}>
                    8.1k
                  </span>
                  <span style={{ fontSize: '11px', color: '#71717a' }}>Views</span>
                  <Link
                    href={completedProjects[1] ? `/content/${completedProjects[1].id}` : '/content'}
                    style={{ color: '#71717a', display: 'flex', alignItems: 'center', marginLeft: '2px' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </Link>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Right Brand Watermark Badge (Mockup match) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: '16px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '11px',
              color: '#52525b',
              fontWeight: 600
            }}>
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                background: '#27272a',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                fontWeight: 800
              }}>
                A
              </span>
              <span>Made in Aura</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
