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
  const [credits, setCredits] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Create Prompt state
  const [quickTopic, setQuickTopic] = useState('');
  const [quickPreset, setQuickPreset] = useState<'SHORT' | 'STANDARD' | 'DOCUMENTARY'>('STANDARD');
  const [creating, setCreating] = useState(false);

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
          setCredits(meData.credits);
        }
      }

      if (projRes.ok) {
        const pData = await projRes.json();
        setProjects(pData.projects || []);
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

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTopic.trim()) {
      toast.warning('Please enter a video topic prompt');
      return;
    }
    if (creating) return;

    try {
      setCreating(true);
      toast.info('Starting AI video generation pipeline... ⚡');

      let targetChannelId = channels[0]?.id;
      if (!targetChannelId) {
        const cRes = await fetch('/api/channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Studio Persona', niche: 'AI & Tech', target_duration_minutes: 3 }),
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
          preset: quickPreset === 'SHORT' ? 'SHORT' : 'STANDARD',
          target_length_minutes: quickPreset === 'SHORT' ? 1 : quickPreset === 'DOCUMENTARY' ? 8 : 3,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.projectId) {
        toast.success('Video queued successfully! Opening Studio... ✨');
        router.push(`/content/${data.projectId}`);
      } else {
        throw new Error(data.error || 'Failed to initialize project');
      }
    } catch (err: any) {
      toast.error(err.message || 'Video creation failed');
    } finally {
      setCreating(false);
    }
  };

  const completedCount = projects.filter((p) => p.status === 'COMPLETED').length;
  const processingCount = projects.filter((p) => p.status === 'PROCESSING').length;

  if (!currentUser && !loading) {
    return <LandingPage />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ─────────────────────────────────────────────────────────────
          1. CREATOR COMMAND CENTER HERO
      ───────────────────────────────────────────────────────────── */}
      <div
        className="card"
        style={{
          padding: '24px 28px',
          background: 'rgba(24, 24, 27, 0.65)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '4px', marginBottom: '10px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }} />
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#e4e4e7', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'monospace' }}>
                STUDIO ENGINE ONLINE • v2.4.0
              </span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#f4f4f5', letterSpacing: '-0.02em', margin: '0 0 6px 0' }}>
              Welcome back, {currentUser?.name || 'Creator'}
            </h1>
            <p style={{ color: '#71717a', fontSize: '13px', maxWidth: '580px', lineHeight: 1.5, margin: 0 }}>
              Autonomous 1080p video pipeline with multi-scene script decomposition, neural voiceover, and YouTube scheduling.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href="/templates" className="btn btn-secondary btn-sm" style={{ height: '32px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
              </svg>
              <span>Templates</span>
            </Link>
            <Link href="/content/new" className="btn btn-primary btn-sm" style={{ height: '32px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>+ Create Video</span>
            </Link>
          </div>
        </div>

        {/* Quick Generation Bar */}
        <form onSubmit={handleQuickCreate} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              style={{
                width: '100%',
                borderRadius: '6px',
                padding: '10px 14px',
                fontSize: '13px',
                background: '#09090b',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
              placeholder="Enter video topic, e.g. 'The 7 Laws of Neuromorphic AI in 2026'..."
              value={quickTopic}
              onChange={(e) => setQuickTopic(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setQuickPreset('SHORT')}
              style={{
                padding: '0 12px',
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: quickPreset === 'SHORT' ? 600 : 500,
                borderRadius: '6px',
                border: quickPreset === 'SHORT' ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.08)',
                background: quickPreset === 'SHORT' ? '#ffffff' : '#18181b',
                color: quickPreset === 'SHORT' ? '#09090b' : '#a1a1aa',
                cursor: 'pointer',
              }}
            >
              9:16 Shorts (60s)
            </button>
            <button
              type="button"
              onClick={() => setQuickPreset('STANDARD')}
              style={{
                padding: '0 12px',
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: quickPreset === 'STANDARD' ? 600 : 500,
                borderRadius: '6px',
                border: quickPreset === 'STANDARD' ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.08)',
                background: quickPreset === 'STANDARD' ? '#ffffff' : '#18181b',
                color: quickPreset === 'STANDARD' ? '#09090b' : '#a1a1aa',
                cursor: 'pointer',
              }}
            >
              16:9 Standard (3m)
            </button>
            <button
              type="button"
              onClick={() => setQuickPreset('DOCUMENTARY')}
              style={{
                padding: '0 12px',
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: quickPreset === 'DOCUMENTARY' ? 600 : 500,
                borderRadius: '6px',
                border: quickPreset === 'DOCUMENTARY' ? '1px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.08)',
                background: quickPreset === 'DOCUMENTARY' ? '#ffffff' : '#18181b',
                color: quickPreset === 'DOCUMENTARY' ? '#09090b' : '#a1a1aa',
                cursor: 'pointer',
              }}
            >
              Deep-Dive (8m)
            </button>

            <button type="submit" disabled={creating || !quickTopic.trim()} className="btn btn-primary btn-sm" style={{ padding: '0 16px', height: '38px' }}>
              {creating ? 'Queuing...' : 'Generate ➔'}
            </button>
          </div>
        </form>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. METRICS SNAPSHOT GRID
      ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div className="card" style={{ padding: '16px', background: 'rgba(18, 18, 21, 0.8)', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'monospace' }}>
              VIDEOS GENERATED
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#f4f4f5', fontFamily: 'monospace', marginBottom: '2px' }}>
            {projects.length}
          </div>
          <span style={{ fontSize: '11px', color: '#10b981', fontFamily: 'monospace' }}>
            ✓ {completedCount} 1080p Rendered
          </span>
        </div>

        <div className="card" style={{ padding: '16px', background: 'rgba(18, 18, 21, 0.8)', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'monospace' }}>
              CREDITS BALANCE
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#f4f4f5', fontFamily: 'monospace', marginBottom: '4px' }}>
            {credits?.balance ?? 475}
          </div>
          <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, ((credits?.balance ?? 475) / 500) * 100)}%`, height: '100%', background: '#f4f4f5' }} />
          </div>
        </div>

        <div className="card" style={{ padding: '16px', background: 'rgba(18, 18, 21, 0.8)', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'monospace' }}>
              ACTIVE CHANNELS
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#f4f4f5', fontFamily: 'monospace', marginBottom: '2px' }}>
            {channels.length || 1}
          </div>
          <span style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'monospace' }}>YouTube Bridge Ready</span>
        </div>

        <div className="card" style={{ padding: '16px', background: 'rgba(18, 18, 21, 0.8)', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'monospace' }}>
              PIPELINE WORKERS
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#f4f4f5', fontFamily: 'monospace', marginBottom: '2px' }}>
            {processingCount}
          </div>
          <span style={{ fontSize: '11px', color: processingCount > 0 ? '#60a5fa' : '#71717a', fontFamily: 'monospace' }}>
            {processingCount > 0 ? 'Parallel Rendering...' : 'Queue Idle & Ready'}
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. RECENT PROJECTS MEDIA LIBRARY
      ───────────────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', letterSpacing: '-0.01em', margin: 0 }}>
              Recent Video Projects
            </h2>
            <p style={{ fontSize: '12px', color: '#71717a', margin: '2px 0 0 0' }}>
              Click any project to inspect the multi-scene script and preview 1080p output.
            </p>
          </div>
          <Link href="/content" className="btn btn-secondary btn-sm" style={{ fontSize: '11px', height: '26px' }}>
            View All ({projects.length}) ➔
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="card" style={{ height: '200px', background: 'rgba(24, 24, 27, 0.4)', opacity: 0.5 }} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(24, 24, 27, 0.4)', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#a1a1aa' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f4f4f5', marginBottom: '4px' }}>No video projects created</h3>
            <p style={{ color: '#71717a', fontSize: '12px', marginBottom: '16px', maxWidth: '360px', margin: '0 auto 16px' }}>
              Enter a topic above or launch the video wizard to generate your first AI video.
            </p>
            <Link href="/content/new" className="btn btn-primary btn-sm">
              + Create Your First Video
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '14px' }}>
            {projects.slice(0, 6).map((proj) => {
              const isCompleted = proj.status === 'COMPLETED';
              const isProcessing = proj.status === 'PROCESSING' || proj.status === 'PENDING';

              return (
                <div
                  key={proj.id}
                  className="card"
                  onClick={() => router.push(`/content/${proj.id}`)}
                  style={{
                    cursor: 'pointer',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px',
                    background: 'rgba(18, 18, 21, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {/* Thumbnail / Video Box */}
                  <div
                    style={{
                      aspectRatio: '16 / 9',
                      background: '#09090b',
                      borderRadius: '6px',
                      position: 'relative',
                      overflow: 'hidden',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* Status Badge */}
                    <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 2 }}>
                      <span
                        style={{
                          fontSize: '9px',
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '3px',
                          background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : isProcessing ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                          border: isCompleted ? '1px solid rgba(16, 185, 129, 0.3)' : isProcessing ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.15)',
                          color: isCompleted ? '#10b981' : isProcessing ? '#60a5fa' : '#e4e4e7',
                          textTransform: 'uppercase',
                        }}
                      >
                        {isCompleted ? '1080P READY' : isProcessing ? `⚡ ${proj.current_stage || 'RENDERING'}` : 'DRAFT'}
                      </span>
                    </div>

                    {/* Duration Badge */}
                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', zIndex: 2, background: 'rgba(9,9,11,0.85)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 600, color: '#f4f4f5', fontFamily: 'monospace' }}>
                      {proj.target_length_minutes ? `${proj.target_length_minutes}m` : '60s'}
                    </div>

                    {/* Center Icon */}
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f4f4f5' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="6 4 20 12 6 20 6 4" />
                      </svg>
                    </div>
                  </div>

                  {/* Project Info */}
                  <div>
                    <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f5', margin: '0 0 4px 0', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {proj.topic}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'monospace', color: '#71717a' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                        {proj.channel_name || 'YouTube Channel'}
                      </span>
                      <span>{new Date(proj.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
