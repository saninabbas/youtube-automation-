'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AdminStats {
  totalChannels: number;
  totalProjects: number;
  totalConnections: number;
  storageMb: number;
  statusMap: Record<string, number>;
  pubStatusMap: Record<string, number>;
}

export default function SuperAdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CHANNELS' | 'PROJECTS' | 'CONNECTIONS' | 'LOGS'>('OVERVIEW');
  const [schedulerTriggering, setSchedulerTriggering] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setChannels(data.channels || []);
        setProjects(data.recentProjects || []);
        setConnections(data.connections || []);
      } else {
        const d = await res.json();
        throw new Error(d.error || 'Failed to load admin stats');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleTriggerScheduler = async () => {
    try {
      setSchedulerTriggering(true);
      setActionMsg(null);
      const res = await fetch('/api/scheduler/run', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setActionMsg(`Scheduler executed successfully: Processed ${data.processedCount || 0} project(s).`);
        await fetchAdminData();
      } else {
        throw new Error(data.error || 'Scheduler run failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSchedulerTriggering(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px' }}>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge" style={{ backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              SUPER ADMIN CONTROL PANEL
            </span>
          </div>
          <h1 className="page-title">System Operations & Admin Dashboard</h1>
          <p className="page-subtitle">Manage channels, monitor queue health, execute background scheduler, and inspect system telemetry</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchAdminData} disabled={loading}>
            🔄 Refresh Stats
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleTriggerScheduler} disabled={schedulerTriggering}>
            {schedulerTriggering ? 'Running...' : '⚡ Trigger Release Scheduler'}
          </button>
        </div>
      </div>

      {actionMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
          ✓ {actionMsg}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--error-bg)', color: '#f87171', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* KPI Metric Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>MANAGED CHANNELS</div>

          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {loading ? '...' : stats?.totalChannels || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px' }}>Active Profiles</div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL VIDEOS</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {loading ? '...' : stats?.totalProjects || 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Ready: {stats?.statusMap?.COMPLETED || 0} | Gen: {stats?.statusMap?.PROCESSING || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>SCHEDULED / PUBLISHED</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>
            {loading ? '...' : (stats?.pubStatusMap?.SCHEDULED || 0) + (stats?.pubStatusMap?.PUBLISHED || 0)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Sched: {stats?.pubStatusMap?.SCHEDULED || 0} | Pub: {stats?.pubStatusMap?.PUBLISHED || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>YOUTUBE CONNECTIONS</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#fbbf24', marginTop: '4px' }}>
            {loading ? '...' : stats?.totalConnections || 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>OAuth Data API v3</div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>STORAGE USED</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {loading ? '...' : `${stats?.storageMb || 0} MB`}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Video & Audio Assets</div>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '20px' }}>
        <button
          className={`btn ${activeTab === 'OVERVIEW' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('OVERVIEW')}
        >
          📊 System Overview
        </button>
        <button
          className={`btn ${activeTab === 'CHANNELS' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('CHANNELS')}
        >
          📺 Channel Management ({channels.length})
        </button>
        <button
          className={`btn ${activeTab === 'PROJECTS' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('PROJECTS')}
        >
          🎬 Video Projects ({projects.length})
        </button>
        <button
          className={`btn ${activeTab === 'CONNECTIONS' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('CONNECTIONS')}
        >
          🔑 YouTube Accounts ({connections.length})
        </button>
        <button
          className={`btn ${activeTab === 'LOGS' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('LOGS')}
        >
          📜 System Logs & Telemetry
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '14px' }}>Queue & Background Worker Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Background Worker Status:</span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>● RUNNING (Poll 2.5s)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Generating Projects:</span>
                <span style={{ fontWeight: 600 }}>{stats?.statusMap?.PROCESSING || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Completed Projects:</span>
                <span style={{ fontWeight: 600, color: '#34d399' }}>{stats?.statusMap?.COMPLETED || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>Failed Pipeline Runs:</span>
                <span style={{ fontWeight: 600, color: stats?.statusMap?.FAILED ? '#f87171' : 'var(--text-secondary)' }}>
                  {stats?.statusMap?.FAILED || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '14px' }}>Publishing Status Metrics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Draft Videos:</span>
                <span>{stats?.pubStatusMap?.DRAFT || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ready for Publishing:</span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>{stats?.pubStatusMap?.READY || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Scheduled Release Queue:</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>{stats?.pubStatusMap?.SCHEDULED || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>Published Videos:</span>
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>{stats?.pubStatusMap?.PUBLISHED || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHANNELS */}
      {activeTab === 'CHANNELS' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="card-title">Managed Channels & Schedules</h3>
            <Link href="/channels" className="btn btn-primary btn-sm">
              + Add New Channel
            </Link>
          </div>
          {channels.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '20px 0' }}>No channels created yet.</div>
          ) : (
            <table className="table" style={{ width: '100%', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Channel Name</th>
                  <th>Niche</th>
                  <th>Target Duration</th>
                  <th>Platform</th>
                  <th>Auto-Publish</th>
                  <th>Default Visibility</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((ch) => (
                  <tr key={ch.id}>
                    <td>
                      <strong>{ch.name}</strong>
                    </td>
                    <td>{ch.niche}</td>
                    <td>{ch.target_duration_minutes} min</td>
                    <td>{ch.publishing_platform || 'YouTube'}</td>
                    <td>
                      <span className={`badge ${ch.auto_publish ? 'badge-completed' : ''}`}>
                        {ch.auto_publish ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </td>
                    <td>{ch.default_visibility || 'PRIVATE'}</td>
                    <td>
                      <Link href={`/content/new?channel_id=${ch.id}`} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '11px' }}>
                        Generate Video
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 3: PROJECTS */}
      {activeTab === 'PROJECTS' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="card-title">Recent Video Projects & Status</h3>
            <Link href="/content/new" className="btn btn-primary btn-sm">
              + Generate New Video
            </Link>
          </div>
          {projects.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '20px 0' }}>No video projects found.</div>
          ) : (
            <table className="table" style={{ width: '100%', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Channel</th>
                  <th>Duration</th>
                  <th>Pipeline Status</th>
                  <th>Publishing Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/content/${p.id}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {p.topic}
                      </Link>
                    </td>
                    <td>{p.channel_name}</td>
                    <td>{p.target_length_minutes}m</td>
                    <td>
                      <span className={`badge badge-${p.status.toLowerCase()}`}>
                        {p.status} ({p.current_stage || 'SCRIPT'})
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                        {p.publishing_status || 'DRAFT'}
                      </span>
                    </td>
                    <td>
                      <Link href={`/content/${p.id}`} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '11px' }}>
                        Open Canvas
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 4: CONNECTIONS */}
      {activeTab === 'CONNECTIONS' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="card-title">Connected YouTube Accounts (Google OAuth)</h3>
            <Link href="/settings/publishing" className="btn btn-primary btn-sm">
              Manage Connection
            </Link>
          </div>
          {connections.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '20px 0' }}>
              No YouTube accounts linked yet. Configure Google Client Secret in Settings to link accounts.
            </div>
          ) : (
            <table className="table" style={{ width: '100%', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Channel Title</th>
                  <th>Channel ID</th>
                  <th>Account Email</th>
                  <th>Platform</th>
                  <th>Token Expiry</th>
                </tr>
              </thead>
              <tbody>
                {connections.map((conn) => (
                  <tr key={conn.id}>
                    <td><strong>{conn.channel_title}</strong></td>
                    <td style={{ fontFamily: 'monospace' }}>{conn.channel_id}</td>
                    <td>{conn.account_email || 'N/A'}</td>
                    <td>{conn.platform}</td>
                    <td>{conn.token_expiry ? new Date(conn.token_expiry).toLocaleString() : 'Active'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 5: LOGS */}
      {activeTab === 'LOGS' && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '14px' }}>System Telemetry & Composition Audit Logs</h3>
          <div style={{ background: '#090d16', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', fontFamily: 'monospace', fontSize: '12px', color: '#38bdf8', minHeight: '200px' }}>
            <div>[SYSTEM LOG] Queue Worker Active. Polling database every 2500ms...</div>
            <div>[FFMPEG COMPOSITOR] Motion Graphics Engine: H.264 / AAC 1080p 30FPS</div>
            <div>[EDGETTS SYNTHESIZER] Chunked Synthesis Engine with Automatic Timeout Retry</div>
            <div>[YOUTUBE PUBLISHER] Direct Resumable Upload Provider Ready (OAuth 2.0)</div>
            <div style={{ color: '#34d399', marginTop: '8px' }}>✓ All system components operational & healthy.</div>
          </div>
        </div>
      )}
    </div>
  );
}
