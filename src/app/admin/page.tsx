'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MinimalAdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [schedulerRunning, setSchedulerRunning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setChannels(data.channels || []);
        setProjects(data.recentProjects || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerScheduler = async () => {
    try {
      setSchedulerRunning(true);
      setMsg(null);
      const res = await fetch('/api/scheduler/run', { method: 'POST' });
      const data = await res.json();
      setMsg(`Scheduler run complete: ${data.processedCount || 0} project(s) checked.`);
      await loadData();
    } catch {
      setMsg('Scheduler run failed.');
    } finally {
      setSchedulerRunning(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>

            ● SYSTEM ONLINE
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
            Admin Console
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadData} disabled={loading}>
            🔄 Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={triggerScheduler} disabled={schedulerRunning}>
            {schedulerRunning ? 'Running...' : '⚡ Run Release Scheduler'}
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '10px 14px', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '6px', marginBottom: '20px', fontSize: '13px' }}>
          ✓ {msg}
        </div>
      )}

      {/* 3 Clean Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE CHANNELS</div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>
            {loading ? '...' : stats?.totalChannels || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL VIDEOS</div>
          <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '4px' }}>
            {loading ? '...' : stats?.totalProjects || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>SCHEDULED QUEUE</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
            {loading ? '...' : stats?.pubStatusMap?.SCHEDULED || 0}
          </div>
        </div>
      </div>

      {/* Table 1: Channels */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 className="card-title">Managed Channels</h3>
          <Link href="/channels" className="btn btn-secondary btn-sm">
            Manage Channels ➔
          </Link>
        </div>

        {channels.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No channels created yet.</div>
        ) : (
          <table className="table" style={{ width: '100%', fontSize: '13px' }}>
            <thead>
              <tr>
                <th>Channel Name</th>
                <th>Niche</th>
                <th>Target Length</th>
                <th>Auto-Publish</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.niche}</td>
                  <td>{c.target_duration_minutes} min</td>
                  <td>
                    <span className={`badge ${c.auto_publish ? 'badge-completed' : ''}`}>
                      {c.auto_publish ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Table 2: Recent Videos */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 className="card-title">Recent Video Projects</h3>
          <Link href="/content/new" className="btn btn-primary btn-sm">
            + Create Video
          </Link>
        </div>

        {projects.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No video projects created yet.</div>
        ) : (
          <table className="table" style={{ width: '100%', fontSize: '13px' }}>
            <thead>
              <tr>
                <th>Topic</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.slice(0, 10).map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.topic}</strong></td>
                  <td>{p.channel_name}</td>
                  <td>
                    <span className={`badge badge-${p.status.toLowerCase()}`}>
                      {p.status} ({p.current_stage || 'SCRIPT'})
                    </span>
                  </td>
                  <td>
                    <Link href={`/content/${p.id}`} className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '11px' }}>
                      Open ➔
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
