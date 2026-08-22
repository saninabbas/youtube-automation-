'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  topic: string;
  target_length_minutes: number;
  preset?: string;
  language: string;
  platform?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  current_stage: string;
  publishing_status?: string;
  publish_video_id?: string | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  channel_name: string;
  channel_niche: string;
  created_at: string;
}

export default function ContentDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();

    const interval = setInterval(() => {
      const hasActive = projects.some((p) => p.status === 'PENDING' || p.status === 'PROCESSING' || p.publishing_status === 'UPLOADING');
      if (hasActive) {
        fetchProjects();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [projects]);

  // KPI Calculations
  const totalCount = projects.length;
  const generatingCount = projects.filter((p) => p.status === 'PROCESSING' || p.status === 'PENDING').length;
  const readyCount = projects.filter((p) => p.status === 'COMPLETED' && (!p.publishing_status || p.publishing_status === 'READY' || p.publishing_status === 'DRAFT')).length;
  const scheduledCount = projects.filter((p) => p.publishing_status === 'SCHEDULED').length;
  const publishedCount = projects.filter((p) => p.publishing_status === 'PUBLISHED').length;
  const failedCount = projects.filter((p) => p.status === 'FAILED' || p.publishing_status === 'FAILED').length;

  const getStatusBadge = (p: Project) => {
    if (p.publishing_status === 'PUBLISHED') {
      return <span className="badge badge-completed"><span className="status-dot completed" />PUBLISHED</span>;
    }
    if (p.publishing_status === 'SCHEDULED') {
      return <span className="badge" style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}><span className="status-dot processing" />SCHEDULED</span>;
    }
    if (p.publishing_status === 'UPLOADING') {
      return <span className="badge" style={{ backgroundColor: 'rgba(250, 204, 21, 0.15)', color: '#facc15', border: '1px solid rgba(250, 204, 21, 0.3)' }}><span className="status-dot processing" />UPLOADING</span>;
    }

    switch (p.status) {
      case 'COMPLETED':
        return <span className="badge badge-completed"><span className="status-dot completed" />READY</span>;
      case 'PROCESSING':
        return <span className="badge badge-processing"><span className="status-dot processing" />{p.current_stage}</span>;
      case 'FAILED':
        return <span className="badge badge-failed"><span className="status-dot failed" />FAILED</span>;
      default:
        return <span className="badge badge-pending"><span className="status-dot pending" />PENDING</span>;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Video Automation Dashboard</h1>
          <p className="page-subtitle">End-to-end multi-channel video generation, scheduling, and YouTube publishing pipeline</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/calendar" className="btn btn-secondary">
            Calendar
          </Link>
          <Link href="/content/new" className="btn btn-primary">
            + Generate Video
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--error-bg)', color: '#f87171', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* KPI Tiles Bar */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-value">{totalCount}</div>
          <div className="kpi-label">Total Videos</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: generatingCount > 0 ? '#38bdf8' : 'inherit' }}>
            {generatingCount}
          </div>
          <div className="kpi-label">Generating</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: readyCount > 0 ? '#34d399' : 'inherit' }}>
            {readyCount}
          </div>
          <div className="kpi-label">Ready</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: scheduledCount > 0 ? '#38bdf8' : 'inherit' }}>
            {scheduledCount}
          </div>
          <div className="kpi-label">Scheduled</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: publishedCount > 0 ? '#34d399' : 'inherit' }}>
            {publishedCount}
          </div>
          <div className="kpi-label">Published</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value" style={{ color: failedCount > 0 ? '#f87171' : 'inherit' }}>
            {failedCount}
          </div>
          <div className="kpi-label">Failed</div>
        </div>
      </div>

      {/* Video Content Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="card-title">Production Queue & Projects</h3>
          <button className="btn btn-secondary btn-sm" onClick={fetchProjects}>
            Refresh
          </button>
        </div>

        {loading && projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading videos...</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <h3>No Videos Generated Yet</h3>
            <p>Select a channel and topic to begin automated end-to-end video synthesis.</p>
            <Link href="/content/new" className="btn btn-primary" style={{ marginTop: '16px' }}>
              + Generate First Video
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Topic & Project</th>
                  <th>Channel</th>
                  <th>Preset</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>
                      <Link href={`/content/${p.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                        {p.topic}
                      </Link>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {p.target_length_minutes}m target • {p.platform || 'YouTube'}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-tag">{p.channel_name}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.preset || 'STANDARD'}</span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td>{getStatusBadge(p)}</td>
                    <td>
                      <Link href={`/content/${p.id}`} className="btn btn-secondary btn-sm" style={{ fontSize: '12px' }}>
                        View Pipeline
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
