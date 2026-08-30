'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ScheduledProject {
  id: string;
  topic: string;
  channel_name: string;
  platform: string;
  status: string;
  publishing_status: string;
  scheduled_at: string | null;
  published_at: string | null;
  publish_video_id?: string | null;
  publish_url?: string | null;
  publish_error?: string | null;
  created_at: string;
}

interface ChannelSchedule {
  id: string;
  name: string;
  niche: string;
  publishing_days: string;
  publishing_time: string;
  timezone: string;
  publishing_platform: string;
  auto_publish: number;
}

export default function ContentCalendarPage() {
  const [projects, setProjects] = useState<ScheduledProject[]>([]);
  const [channels, setChannels] = useState<ChannelSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [runningScheduler, setRunningScheduler] = useState(false);
  const [schedulerMsg, setSchedulerMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, chanRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/channels'),
      ]);

      if (projRes.ok) {
        const pData = await projRes.json();
        setProjects(pData.projects || []);
      }
      if (chanRes.ok) {
        const cData = await chanRes.json();
        setChannels(cData.channels || []);
      }
    } catch (err: any) {
      console.error('Error fetching calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunScheduler = async () => {
    try {
      setRunningScheduler(true);
      setSchedulerMsg(null);
      const res = await fetch('/api/scheduler/run', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSchedulerMsg(`Auto-Publisher Sync: ${data.processedCount || 0} queued video(s) evaluated and processed.`);
        await fetchData();
      } else {
        setSchedulerMsg(`Scheduler error: ${data.error}`);
      }
    } catch (err: any) {
      setSchedulerMsg(`Scheduler error: ${err.message}`);
    } finally {
      setRunningScheduler(false);
    }
  };

  const scheduledOrPublished = projects.filter(
    (p) => p.publishing_status === 'SCHEDULED' || p.publishing_status === 'PUBLISHED' || p.publishing_status === 'FAILED' || p.scheduled_at
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-full)', marginBottom: '8px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              30-DAY AUTONOMOUS RELEASES
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Publishing & Release Calendar
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Schedule and automate distribution across connected YouTube channels according to your content plan.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* View Modes */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '3px', border: '1px solid var(--border-subtle)' }}>
            {(['month', 'week', 'list'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className="btn btn-sm"
                style={{
                  textTransform: 'capitalize',
                  background: viewMode === m ? 'var(--bg-elevated)' : 'transparent',
                  color: viewMode === m ? '#fff' : 'var(--text-muted)',
                  fontSize: '12px',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={handleRunScheduler}
            disabled={runningScheduler}
            className="btn btn-primary btn-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            <span>{runningScheduler ? 'Syncing...' : 'Sync Auto-Publisher'}</span>
          </button>
        </div>
      </div>

      {schedulerMsg && (
        <div
          style={{
            padding: '12px 18px',
            background: schedulerMsg.startsWith('Scheduler error') ? 'var(--status-error-bg)' : 'var(--status-ready-bg)',
            border: `1px solid ${schedulerMsg.startsWith('Scheduler error') ? 'var(--status-error-border)' : 'var(--status-ready-border)'}`,
            borderRadius: 'var(--radius-md)',
            color: '#fff',
            fontSize: '13px',
          }}
        >
          {schedulerMsg}
        </div>
      )}

      {/* Main Calendar Matrix or List */}
      {viewMode === 'list' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Scheduled & Published Videos</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{scheduledOrPublished.length} videos</span>
          </div>

          {scheduledOrPublished.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No videos currently scheduled on the calendar. Schedule a video from the Studio or Create flow.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {scheduledOrPublished.map((p) => {
                const isPublished = p.publishing_status === 'PUBLISHED';
                const isScheduled = p.publishing_status === 'SCHEDULED';
                const isFailed = p.publishing_status === 'FAILED';

                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      borderBottom: '1px solid var(--border-subtle)',
                      gap: '16px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <Link href={`/content/${p.id}`} style={{ fontSize: '14px', fontWeight: 700, color: '#fff', textDecoration: 'none' }}>
                        {p.topic}
                      </Link>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                        <span style={{ color: 'var(--accent-cyan)' }}>{p.channel_name}</span>
                        <span>•</span>
                        <span>Target: {p.scheduled_at ? new Date(p.scheduled_at).toLocaleString() : 'Immediate Slot'}</span>
                        {p.publish_video_id && (
                          <>
                            <span>•</span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>ID: {p.publish_video_id}</span>
                          </>
                        )}
                      </div>
                      {p.publish_error && (
                        <div style={{ fontSize: '11px', color: 'var(--status-error)', marginTop: '4px' }}>
                          Error: {p.publish_error}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isPublished && (
                        <span className="badge badge-ready">✅ YouTube Published</span>
                      )}
                      {isScheduled && (
                        <span className="badge badge-proc">🟢 YouTube Scheduled</span>
                      )}
                      {isFailed && (
                        <span className="badge badge-error">🔴 Upload Failed</span>
                      )}

                      {p.publish_url && (
                        <a href={p.publish_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                          Watch on YouTube ➔
                        </a>
                      )}

                      <Link href={`/content/${p.id}`} className="btn btn-secondary btn-sm">
                        Studio ➔
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Month / Week Grid View */
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginBottom: '10px' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0' }}>
                {d}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
            {Array.from({ length: 28 }).map((_, idx) => {
              const dayNum = (idx % 31) + 1;
              const matchingProjs = scheduledOrPublished.filter((_, i) => (i % 28) === idx);
              return (
                <div
                  key={idx}
                  style={{
                    minHeight: '96px',
                    padding: '8px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>{dayNum}</span>

                  {matchingProjs.map((p) => (
                    <Link
                      key={p.id}
                      href={`/content/${p.id}`}
                      style={{
                        padding: '4px 6px',
                        borderRadius: 'var(--radius-sm)',
                        background: p.publishing_status === 'PUBLISHED' ? 'var(--status-ready-bg)' : 'var(--status-proc-bg)',
                        border: `1px solid ${p.publishing_status === 'PUBLISHED' ? 'var(--status-ready-border)' : 'var(--status-proc-border)'}`,
                        fontSize: '10px',
                        color: '#fff',
                        textDecoration: 'none',
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                      }}
                      title={p.topic}
                    >
                      {p.publishing_status === 'PUBLISHED' ? '✅ ' : '🟢 '}
                      {p.topic}
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Channel Publishing Schedule Matrix */}
      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
          Automated Channel Release Schedules
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {channels.map((ch) => {
            let days: string[] = [];
            try {
              days = ch.publishing_days ? JSON.parse(ch.publishing_days) : [];
            } catch {}

            return (
              <div key={ch.id} style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '14px', color: '#fff' }}>{ch.name}</strong>
                  <span className={`badge ${ch.auto_publish ? 'badge-ready' : 'badge-idle'}`}>
                    {ch.auto_publish ? 'Auto-Active' : 'Manual'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Slot: {ch.publishing_time} ({ch.timezone || 'UTC'})
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {days.map((d) => (
                    <span key={d} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', color: 'var(--accent-cyan)' }}>
                      {d.slice(0, 3)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
