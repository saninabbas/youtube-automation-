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

  // Quick Create state
  const [quickTopic, setQuickTopic] = useState('');
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

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTopic.trim()) {
      toast.warning('Please enter a video topic');
      return;
    }
    if (monthlyUsage.remaining <= 0) {
      toast.error(`Monthly plan quota reached (${monthlyUsage.used}/${monthlyUsage.limit} videos).`);
      return;
    }
    if (creating) return;

    try {
      setCreating(true);
      toast.info('Starting AI video creation... ⚡');

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
          target_length_minutes: 1,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create video');
      }

      const data = await res.json();
      toast.success('Video generation queued!');
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

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px', padding: '12px 0' }}>
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & 30-VIDEO QUOTA PROGRESS
      ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#121215',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '24px 28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: '0 0 6px 0' }}>
            Welcome, {currentUser?.name || 'Creator'}
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '14px', margin: 0 }}>
            Enter a topic below to generate your next automated video.
          </p>
        </div>

        {/* Videos This Month Quota Meter */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '12px 18px',
          minWidth: '220px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Videos This Month
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: monthlyUsage.remaining > 0 ? '#10b981' : '#f43f5e' }}>
              {monthlyUsage.used} / {monthlyUsage.limit}
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
            <div style={{
              width: `${Math.min(100, (monthlyUsage.used / Math.max(1, monthlyUsage.limit)) * 100)}%`,
              height: '100%',
              background: monthlyUsage.remaining > 0 ? '#10b981' : '#f43f5e',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ fontSize: '11px', color: '#71717a', textAlign: 'right' }}>
            {monthlyUsage.remaining} videos remaining
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. QUICK CREATE A VIDEO (PRIMARY CTA & INPUT)
      ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#121215',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '14px',
        padding: '24px 28px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>
              Create a Video
            </h2>
            <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '4px 0 0 0' }}>
              Type any topic or headline. AI writes the script, voiceover, and renders the 1080p MP4.
            </p>
          </div>
          <Link href="/content/new" style={{
            background: '#ffffff',
            color: '#09090b',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 700,
            textDecoration: 'none'
          }}>
            Open Full Creator ➔
          </Link>
        </div>

        <form onSubmit={handleQuickCreate} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            style={{
              flex: 1,
              minWidth: '280px',
              padding: '12px 16px',
              fontSize: '14px',
              background: '#09090b',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#fff'
            }}
            placeholder="e.g. '10 foods that support healthy aging' or 'How quantum computers work'..."
            value={quickTopic}
            onChange={(e) => setQuickTopic(e.target.value)}
          />
          <button
            type="submit"
            disabled={creating || !quickTopic.trim()}
            style={{
              padding: '0 24px',
              height: '46px',
              background: '#ffffff',
              color: '#09090b',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: creating ? 'not-allowed' : 'pointer'
            }}
          >
            {creating ? 'Creating Video...' : 'Create Video ➔'}
          </button>
        </form>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. RECENT VIDEOS LIST (THUMBNAIL, TOPIC, STATUS, DOWNLOAD, YOUTUBE)
      ───────────────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', margin: 0 }}>
            Recent Videos
          </h2>
          <Link href="/content" style={{ fontSize: '13px', color: '#10b981', textDecoration: 'none', fontWeight: 600 }}>
            View Video Library ({projects.length}) ➔
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#71717a' }}>Loading videos...</div>
        ) : projects.length === 0 ? (
          <div style={{
            background: '#121215',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '40px 20px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '16px' }}>
              You have not created any videos yet.
            </p>
            <Link href="/content/new" style={{
              background: '#ffffff',
              color: '#09090b',
              padding: '10px 20px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none'
            }}>
              Create Your First Video ➔
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {projects.slice(0, 6).map((p) => {
              const isCompleted = p.status === 'COMPLETED';
              const downloadUrl = `/api/assets/${p.id}/final_output.mp4`;

              return (
                <div
                  key={p.id}
                  style={{
                    background: '#121215',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '240px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '6px',
                      background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      border: isCompleted ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px'
                    }}>
                      {isCompleted ? '🎬' : '⚡'}
                    </div>

                    <div>
                      <Link href={`/content/${p.id}`} style={{ fontSize: '14px', fontWeight: 600, color: '#fff', textDecoration: 'none' }}>
                        {p.topic}
                      </Link>
                      <div style={{ fontSize: '12px', color: '#71717a', marginTop: '2px' }}>
                        {new Date(p.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Status Badge */}
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : p.status === 'FAILED' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                      color: isCompleted ? '#10b981' : p.status === 'FAILED' ? '#f43f5e' : '#38bdf8'
                    }}>
                      {isCompleted ? 'Ready' : p.status === 'FAILED' ? 'Failed' : 'Creating...'}
                    </span>

                    {/* YouTube Status */}
                    <span style={{ fontSize: '12px', color: p.publishing_status === 'PUBLISHED' ? '#10b981' : '#71717a' }}>
                      {p.publishing_status === 'PUBLISHED' ? '✓ On YouTube' : p.scheduled_at ? '🗓️ Scheduled' : 'YouTube Ready'}
                    </span>

                    {/* Download MP4 Button */}
                    {isCompleted && (
                      <a
                        href={downloadUrl}
                        download
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        ⬇️ MP4
                      </a>
                    )}

                    <Link
                      href={`/content/${p.id}`}
                      style={{
                        color: '#a1a1aa',
                        fontSize: '13px',
                        textDecoration: 'none',
                        padding: '6px 8px'
                      }}
                    >
                      View ➔
                    </Link>
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
