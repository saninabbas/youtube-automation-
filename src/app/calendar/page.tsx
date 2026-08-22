'use client';

import { useState, useEffect } from 'react';
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
        setSchedulerMsg(`Scheduler check completed: ${data.processedCount} due video(s) processed.`);
        await fetchData();
      } else {
        setSchedulerMsg(`Scheduler check failed: ${data.error}`);
      }
    } catch (err: any) {
      setSchedulerMsg(`Scheduler check error: ${err.message}`);
    } finally {
      setRunningScheduler(false);
    }
  };

  const getPublishingBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="badge badge-completed"><span className="status-dot completed" />PUBLISHED</span>;
      case 'SCHEDULED':
        return <span className="badge" style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}><span className="status-dot processing" />SCHEDULED</span>;
      case 'UPLOADING':
        return <span className="badge" style={{ backgroundColor: 'rgba(250, 204, 21, 0.15)', color: '#facc15', border: '1px solid rgba(250, 204, 21, 0.3)' }}><span className="status-dot processing" />UPLOADING</span>;
      case 'READY':
        return <span className="badge badge-pending">READY</span>;
      case 'FAILED':
        return <span className="badge badge-failed"><span className="status-dot failed" />FAILED</span>;
      default:
        return <span className="badge" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>DRAFT</span>;
    }
  };

  const scheduledProjects = projects.filter((p) => p.scheduled_at || p.published_at || p.publishing_status === 'SCHEDULED' || p.publishing_status === 'PUBLISHED');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Content Calendar & Release Schedule</h1>
          <p className="page-subtitle">Track scheduled releases, automated channel publishing timelines, and delivery status</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleRunScheduler}
            disabled={runningScheduler}
          >
            {runningScheduler ? 'Checking Due Videos...' : '⚡ Run Scheduler Check'}
          </button>
          <Link href="/content/new" className="btn btn-primary btn-sm">
            + Schedule Video
          </Link>
        </div>
      </div>

      {schedulerMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '6px', marginBottom: '20px', fontSize: '13px' }}>
          ℹ {schedulerMsg}
        </div>
      )}

      {/* Automated Channel Schedules Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 className="card-title">Channel Automated Release Profiles</h3>
          <Link href="/channels" className="btn btn-secondary btn-sm" style={{ fontSize: '12px' }}>
            Configure Schedules ↗
          </Link>
        </div>
        {channels.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No channels created yet.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {channels.map((ch) => {
              let days: string[] = ['Monday', 'Wednesday', 'Friday'];
              try {
                if (ch.publishing_days) days = JSON.parse(ch.publishing_days);
              } catch {}

              return (
                <div key={ch.id} style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '14px' }}>{ch.name}</strong>
                    <span className="badge" style={{ backgroundColor: ch.auto_publish ? 'rgba(52, 211, 153, 0.15)' : 'var(--bg-primary)', color: ch.auto_publish ? '#34d399' : 'var(--text-muted)', fontSize: '11px' }}>
                      {ch.auto_publish ? 'AUTO-PUBLISH ON' : 'MANUAL'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    <div>📅 Days: <span style={{ color: 'var(--text-primary)' }}>{days.join(', ')}</span></div>
                    <div>⏰ Time: <span style={{ color: 'var(--text-primary)' }}>{ch.publishing_time || '14:00'} ({ch.timezone || 'UTC'})</span></div>
                    <div>📡 Platform: <span style={{ color: 'var(--text-primary)' }}>{ch.publishing_platform || 'YouTube'}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scheduled Releases List */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '16px' }}>
          Scheduled & Published Releases ({scheduledProjects.length})
        </h3>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading schedule...</div>
        ) : scheduledProjects.length === 0 ? (
          <div className="empty-state">
            <h3>No Scheduled Videos Yet</h3>
            <p>Schedule a video from the video details page or create an automated project to queue future releases.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Channel</th>
                  <th>Platform</th>
                  <th>Target Release</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scheduledProjects.map((p) => {
                  const targetDate = p.published_at
                    ? new Date(p.published_at).toLocaleString()
                    : p.scheduled_at
                    ? new Date(p.scheduled_at).toLocaleString()
                    : 'Unscheduled';

                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>
                        <Link href={`/content/${p.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                          {p.topic}
                        </Link>
                        {p.publish_video_id && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            ID: <code>{p.publish_video_id}</code>
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-tag">{p.channel_name}</span>
                      </td>
                      <td>{p.platform || 'YouTube'}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {targetDate}
                      </td>
                      <td>{getPublishingBadge(p.publishing_status)}</td>
                      <td>
                        <Link href={`/content/${p.id}`} className="btn btn-secondary btn-sm" style={{ fontSize: '12px' }}>
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
