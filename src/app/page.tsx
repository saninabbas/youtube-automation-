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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ─────────────────────────────────────────────────────────────
          1. CREATOR COMMAND CENTER HERO
      ───────────────────────────────────────────────────────────── */}
      <div
        className="card card-glow"
        style={{
          padding: '36px 32px',
          background: 'linear-gradient(135deg, rgba(22, 26, 38, 0.9) 0%, rgba(13, 16, 23, 0.95) 100%)',
          border: '1px solid var(--border-medium)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: 'var(--status-proc-bg)', border: '1px solid var(--status-proc-border)', borderRadius: 'var(--radius-full)', marginBottom: '12px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                AI Studio 2026 Active
              </span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', marginBottom: '8px' }}>
              Good morning, {currentUser?.name || 'Creator'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '600px', lineHeight: 1.6 }}>
              Turn your ideas into broadcast-quality 1080p videos with multi-scene AI decomposition, neural voiceover, and automated YouTube publishing.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/templates" className="btn btn-secondary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
              </svg>
              <span>Use Template</span>
            </Link>
            <Link href="/content/new" className="btn btn-primary btn-lg">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>+ Create Video</span>
            </Link>
          </div>
        </div>

        {/* Quick Generation Bar */}
        <form onSubmit={handleQuickCreate} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <input
              type="text"
              className="topbar-search"
              style={{ width: '100%', borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: '14px', background: 'var(--bg-primary)' }}
              placeholder="Enter any topic, e.g. 'The 7 Laws of Quantum Computing in 2026'..."
              value={quickTopic}
              onChange={(e) => setQuickTopic(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setQuickPreset('SHORT')}
              className={`btn btn-sm ${quickPreset === 'SHORT' ? 'btn-primary' : 'btn-secondary'}`}
            >
              📱 9:16 Short (60s)
            </button>
            <button
              type="button"
              onClick={() => setQuickPreset('STANDARD')}
              className={`btn btn-sm ${quickPreset === 'STANDARD' ? 'btn-primary' : 'btn-secondary'}`}
            >
              🎬 16:9 Standard (3m)
            </button>
            <button
              type="button"
              onClick={() => setQuickPreset('DOCUMENTARY')}
              className={`btn btn-sm ${quickPreset === 'DOCUMENTARY' ? 'btn-primary' : 'btn-secondary'}`}
            >
              🎙️ Deep-Dive (8m)
            </button>

            <button type="submit" disabled={creating || !quickTopic.trim()} className="btn btn-primary">
              {creating ? 'Initializing...' : '⚡ Generate'}
            </button>
          </div>
        </form>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. METRICS SNAPSHOT GRID
      ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Videos Generated
            </span>
            <span style={{ color: 'var(--accent-primary)' }}>🎬</span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '26px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            {projects.length}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--status-ready)', fontWeight: 600 }}>
            ✓ {completedCount} 1080p Rendered
          </span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Credits Balance
            </span>
            <span style={{ color: 'var(--accent-emerald)' }}>⚡</span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '26px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            {credits?.balance ?? 475}
          </div>
          <div style={{ width: '100%', height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden', marginTop: '6px' }}>
            <div style={{ width: `${Math.min(100, ((credits?.balance ?? 475) / 500) * 100)}%`, height: '100%', background: 'var(--accent-emerald)' }} />
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Channels
            </span>
            <span style={{ color: 'var(--accent-cyan)' }}>📡</span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '26px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            {channels.length || 1}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>YouTube Auto-Publish Ready</span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Pipeline Jobs
            </span>
            <span style={{ color: 'var(--accent-purple)' }}>⚙️</span>
          </div>
          <div className="tabular-nums" style={{ fontSize: '26px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            {processingCount}
          </div>
          <span style={{ fontSize: '12px', color: processingCount > 0 ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
            {processingCount > 0 ? 'Parallel Worker Rendering...' : 'Queue Idle & Ready'}
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. RECENT PROJECTS MEDIA LIBRARY
      ───────────────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Recent Video Projects</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Click any project to open the 3-Pane Video Studio & Copilot.</p>
          </div>
          <Link href="/content" className="btn btn-ghost btn-sm">
            View All ({projects.length}) ➔
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="card" style={{ height: '220px', background: 'var(--bg-secondary)', opacity: 0.6 }} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-muted)', fontSize: '24px' }}>
              🎬
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>No video projects yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px', maxWidth: '400px', margin: '0 auto 20px' }}>
              Enter a topic above or launch the 5-step video wizard to generate your first AI video.
            </p>
            <Link href="/content/new" className="btn btn-primary">
              + Create Your First Video
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {projects.slice(0, 6).map((proj) => {
              const isCompleted = proj.status === 'COMPLETED';
              const isProcessing = proj.status === 'PROCESSING';

              return (
                <div
                  key={proj.id}
                  className="card"
                  onClick={() => router.push(`/content/${proj.id}`)}
                  style={{
                    cursor: 'pointer',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Thumbnail / Video Box */}
                  <div
                    style={{
                      aspectRatio: '16 / 9',
                      background: '#000',
                      borderRadius: 'var(--radius-md)',
                      position: 'relative',
                      overflow: 'hidden',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.8) 100%)' }} />

                    {/* Status Badge */}
                    <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2 }}>
                      <span className={`badge ${isCompleted ? 'badge-ready' : isProcessing ? 'badge-proc' : 'badge-warn'}`}>
                        {isCompleted ? '✓ 1080p Ready' : isProcessing ? `⚡ ${proj.current_stage || 'Rendering'}` : 'Draft'}
                      </span>
                    </div>

                    {/* Duration Badge */}
                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 2, background: 'rgba(0,0,0,0.8)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, color: '#fff' }}>
                      {proj.target_length_minutes ? `${proj.target_length_minutes}m` : '60s'}
                    </div>

                    {/* Center Icon */}
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <polygon points="5 3 19 12 5 21 5 3" />
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  </div>

                  {/* Project Info */}
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '6px', lineHeight: 1.4 }}>
                      {proj.topic}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>{proj.channel_name || 'YouTube Channel'}</span>
                      <span className="tabular-nums">{new Date(proj.created_at).toLocaleDateString()}</span>
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
