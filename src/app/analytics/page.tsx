'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface DailyOutput {
  day: string;
  date: string;
  count: number;
  height: string;
}

interface ChannelStat {
  id: string;
  name: string;
  niche: string;
  video_count: number;
  auto_publish: number;
  publishing_platform: string;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    publishedProjects: 0,
    failedProjects: 0,
    avgRenderDuration: 0,
    totalMinutesGenerated: 0,
  });
  const [weeklyOutput, setWeeklyOutput] = useState<DailyOutput[]>([]);
  const [channels, setChannels] = useState<ChannelStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTelemetry = async () => {
      try {
        setLoading(true);
        const [projRes, chanRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/channels'),
        ]);

        let projectList: any[] = [];
        if (projRes.ok) {
          const projData = await projRes.json();
          projectList = projData.projects || [];
        }

        if (chanRes.ok) {
          const chanData = await chanRes.json();
          setChannels(chanData.channels || []);
        }

        const completed = projectList.filter((p: any) => p.status === 'COMPLETED');
        const published = projectList.filter((p: any) => p.publishing_status === 'PUBLISHED').length;
        const failed = projectList.filter((p: any) => p.status === 'FAILED').length;
        const totalMins = projectList.reduce((sum: number, p: any) => sum + (p.target_length_minutes || 0), 0);

        // Compute real render duration from timestamps
        let avgSec = 0;
        if (completed.length > 0) {
          let validCount = 0;
          let totalSec = 0;
          for (const p of completed) {
            if (p.created_at && p.updated_at) {
              const start = new Date(p.created_at).getTime();
              const end = new Date(p.updated_at).getTime();
              const diffSec = (end - start) / 1000;
              if (diffSec > 0 && diffSec < 3600) {
                totalSec += diffSec;
                validCount++;
              }
            }
          }
          avgSec = validCount > 0 ? Math.round(totalSec / validCount) : 0;
        }

        setStats({
          totalProjects: projectList.length,
          completedProjects: completed.length,
          publishedProjects: published,
          failedProjects: failed,
          avgRenderDuration: avgSec,
          totalMinutesGenerated: totalMins,
        });

        // Compute 7-day output curve
        const now = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const past7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(now);
          d.setDate(d.getDate() - (6 - i));
          const dateStr = d.toISOString().split('T')[0];
          const dayName = days[d.getDay()];
          const count = projectList.filter((p: any) => {
            const isCompleted = p.status === 'COMPLETED';
            const created = p.created_at ? p.created_at.split('T')[0] : '';
            return isCompleted && created === dateStr;
          }).length;
          return { day: dayName, date: dateStr, count };
        });

        const maxCount = Math.max(...past7Days.map((d) => d.count), 1);
        setWeeklyOutput(
          past7Days.map((d) => ({
            ...d,
            height: d.count > 0 ? `${Math.max(15, Math.round((d.count / maxCount) * 100))}%` : '6px',
          }))
        );
      } catch (err) {
        console.error('Failed to load analytics telemetry:', err);
      } finally {
        setLoading(false);
      }
    };
    loadTelemetry();
  }, []);

  const successRate = stats.totalProjects > 0
    ? Math.round(((stats.totalProjects - stats.failedProjects) / stats.totalProjects) * 100)
    : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-full)', marginBottom: '8px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              LIVE TELEMETRY & STUDIO PERFORMANCE
            </span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Studio Analytics & Throughput
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Real-time telemetry on video synthesis throughput, rendering performance, and YouTube distribution.
          </p>
        </div>

        <Link href="/content/new" className="btn btn-primary btn-sm">
          + Create Video
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'Videos Generated', value: stats.totalProjects, sub: 'Total autonomous jobs', color: 'var(--accent-primary)' },
          { label: 'Published to YouTube', value: stats.publishedProjects, sub: 'Live on channels', color: 'var(--status-ready)' },
          { label: 'Pipeline Success Rate', value: `${successRate}%`, sub: 'Reliability benchmark', color: 'var(--accent-cyan)' },
          { label: 'Avg Generation Time', value: stats.avgRenderDuration > 0 ? `${stats.avgRenderDuration}s` : 'N/A', sub: 'FFmpeg CFR 1080p', color: 'var(--accent-purple)' },
          { label: 'Total Content Produced', value: `${stats.totalMinutesGenerated}m`, sub: 'High-definition video', color: '#fff' },
        ].map((kpi, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '8px' }}>
              {kpi.label}
            </div>
            <div className="tabular-nums" style={{ fontSize: '28px', fontWeight: 800, color: kpi.color, marginBottom: '4px' }}>
              {loading ? '...' : kpi.value}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Visual Telemetry Chart Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Weekly Throughput Telemetry */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                7-Day Production Output
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Daily completed video jobs across all active channels.
              </p>
            </div>
            <span style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: 'var(--status-ready)' }}>
              LIVE DATA
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', padding: '0 10px', borderBottom: '1px solid var(--border-subtle)' }}>
            {weeklyOutput.map((bar, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{bar.count}</div>
                <div
                  style={{
                    width: '28px',
                    height: bar.height,
                    background: bar.count > 0 ? 'var(--gradient-brand)' : 'var(--bg-secondary)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.3s ease',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stage Latency Benchmark */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                Pipeline Stage Latency (Benchmark)
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Target execution profile across the 10 pipeline stages.
              </p>
            </div>
            <span style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '4px', color: 'var(--text-dim)' }}>
              1080p CFR
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { stage: 'Script & Scene Decomposition', time: '4.2s', pct: '25%' },
              { stage: 'Visual B-Roll & Generative Media', time: '6.8s', pct: '45%' },
              { stage: 'Neural Voiceover Synthesis', time: '8.4s', pct: '60%' },
              { stage: 'FFmpeg 1080p Compositor & Captions', time: '14.1s', pct: '95%' },
            ].map((st, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{st.stage}</span>
                  <span className="tabular-nums" style={{ color: '#fff', fontWeight: 600 }}>{st.time}</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: st.pct, height: '100%', background: 'var(--accent-primary)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Connected Channel Activity */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
              Connected Channels & Automation Status
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Active broadcast channels configured for autonomous scheduling and publishing.
            </p>
          </div>
          <Link href="/channels" className="btn btn-secondary btn-xs">
            Manage Channels
          </Link>
        </div>

        {channels.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No channels configured yet. <Link href="/channels" style={{ color: 'var(--accent-primary)' }}>Create your first channel</Link>.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {channels.map((chan) => (
              <div
                key={chan.id}
                style={{
                  padding: '14px 16px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{chan.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {chan.niche} • {chan.publishing_platform}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="tabular-nums" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                    {chan.video_count || 0} videos
                  </div>
                  <div style={{ fontSize: '10px', color: chan.auto_publish ? 'var(--status-ready)' : 'var(--text-dim)', marginTop: '2px' }}>
                    {chan.auto_publish ? 'Auto-Publish Active' : 'Manual Approval'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
