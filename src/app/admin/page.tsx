'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SuperAdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Admin State
  const [activeTab, setActiveTab] = useState<'overview' | 'keys' | 'diagnostics' | 'channels'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Keys State
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Diagnostics State
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth');
      const data = await res.json();
      setAuthenticated(data.authenticated === true);
      if (data.authenticated) {
        loadAdminData();
      }
    } catch {
      setAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoggingIn(true);
      setLoginError(null);

      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed');
      }

      setAuthenticated(true);
      setPassword('');
      loadAdminData();
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      setAuthenticated(false);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, keysRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/keys'),
      ]);

      if (statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData);
      }

      if (keysRes.ok) {
        const kData = await keysRes.json();
        const map: Record<string, string> = {};
        if (kData.credentials) {
          if (Array.isArray(kData.credentials)) {
            kData.credentials.forEach((c: any) => {
              map[c.provider] = c.is_configured || c.configured ? '••••••••••••••••••••' : '';
            });
          } else if (typeof kData.credentials === 'object') {
            Object.entries(kData.credentials).forEach(([provider, val]: [string, any]) => {
              map[provider] = val.configured ? '••••••••••••••••••••' : '';
            });
          }
        }
        setCredentials(map);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunDiagnostics = async () => {
    try {
      setRunningDiagnostics(true);
      const res = await fetch('/api/admin/diagnostics');
      if (res.ok) {
        const data = await res.json();
        setDiagnosticsData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunningDiagnostics(false);
    }
  };

  const handleSaveKey = async (provider: string, key: string) => {
    try {
      setSavingKey(provider);
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key }),
      });
      if (res.ok) {
        setMsg(`API Key for ${provider} updated.`);
        setCredentials((prev) => ({ ...prev, [provider]: key ? '••••••••••••••••••••' : '' }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingKey(null);
    }
  };

  if (authenticated === false) {
    return (
      <div className="content-container" style={{ maxWidth: '440px', padding: '80px 20px' }}>
        <div className="card card-glow" style={{ padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--gradient-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                color: '#fff',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>Super Admin Console</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Authenticate to inspect system telemetry & key vault</p>
          </div>

          {loginError && (
            <div
              style={{
                padding: '10px',
                background: 'var(--status-error-bg)',
                color: 'var(--status-error)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12px',
                marginBottom: '16px',
              }}
            >
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Admin Username</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
            >
              {loggingIn ? 'Authenticating...' : 'Sign In as Admin'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Top Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-live)' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-cyan)', letterSpacing: '0.05em' }}>
                Super Admin Portal (Restricted)
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
              System Diagnostics & Key Controls
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
              ← Return to Studio
            </Link>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ color: 'var(--status-error)' }}>
              Sign Out
            </button>
          </div>
        </div>

      {msg && (
        <div style={{ padding: '12px 18px', background: 'var(--status-live-bg)', color: 'var(--status-live)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
          ✓ {msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        {[
          { id: 'overview', label: 'System Health' },
          { id: 'keys', label: 'API Key Vault' },
          { id: 'diagnostics', label: 'Engine Diagnostics' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`btn btn-sm ${activeTab === t.id ? 'btn-secondary' : 'btn-ghost'}`}
            style={{
              fontWeight: activeTab === t.id ? 700 : 500,
              background: activeTab === t.id ? 'var(--bg-elevated)' : 'transparent',
              color: activeTab === t.id ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Health Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { title: 'Video Engine', status: 'OPERATIONAL', sub: 'H.264 / AAC 1080p' },
              { title: 'FFmpeg Compositor', status: 'OPERATIONAL', sub: '30fps CFR Ultrafast' },
              { title: 'SQLite Database', status: 'OPERATIONAL', sub: 'WAL Mode Active' },
              { title: 'Neural TTS Synthesizer', status: 'OPERATIONAL', sub: 'Google / SAPI Stream' },
              { title: 'Stock Video Crawler', status: 'OPERATIONAL', sub: 'Coverr / Pexels / Pixabay' },
              { title: 'YouTube OAuth API', status: 'READY', sub: 'Resumable Chunked Upload' },
            ].map((srv, i) => (
              <div key={i} className="card" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{srv.title}</span>
                  <span className="status-pill OK">{srv.status}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{srv.sub}</div>
              </div>
            ))}
          </div>

          {stats && (
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
                Database Record Inventory
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Projects</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>{stats.counts?.projects || 0}</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Channels Configured</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>{stats.counts?.channels || 0}</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Video Jobs Processed</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>{stats.counts?.videoJobs || 0}</div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Video Assets Stored</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-mono)' }}>{stats.counts?.assets || 0}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Diagnostics */}
      {activeTab === 'diagnostics' && (
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Run Engine & FFmpeg Diagnostic Probe</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tests audio synthesis, stock video download, and 1080p FFmpeg pipeline integrity.</p>
            </div>

            <button
              onClick={handleRunDiagnostics}
              disabled={runningDiagnostics}
              className="btn btn-primary btn-sm"
            >
              {runningDiagnostics ? 'Probing Engine...' : 'Run Diagnostics'}
            </button>
          </div>

          {diagnosticsData && (
            <pre
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-void)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--accent-cyan)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                overflowX: 'auto',
                maxHeight: '400px',
              }}
            >
              {JSON.stringify(diagnosticsData, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Key Vault */}
      {activeTab === 'keys' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* AI Providers Section */}
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🧠</span> AI Language & Visual Generation
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { id: 'gemini', name: 'Google Gemini AI', desc: 'Used for JSON script generation, scene planning & visual prompts' },
                { id: 'openai', name: 'OpenAI (GPT-4o / GPT-3.5)', desc: 'Secondary AI engine for creative scripting & Copilot assistance' },
                { id: 'cloudflare_api_token', name: 'Cloudflare Workers AI', desc: 'Flux-1-Schnell AI visual synthesis engine' },
              ].map((p) => {
                const isConfigured = !!credentials[p.id];
                return (
                  <div key={p.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ maxWidth: '440px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '13px', color: '#fff' }}>{p.name}</strong>
                        <span className={`status-pill ${isConfigured ? 'READY' : 'DRAFT'}`}>
                          {isConfigured ? 'Configured' : 'Not Configured'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.desc}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '340px' }}>
                      <input
                        type="password"
                        placeholder="Enter API Key / Token"
                        defaultValue={credentials[p.id] || ''}
                        className="form-input"
                        style={{ flex: 1, minWidth: '180px', fontSize: '12px', padding: '8px 12px' }}
                        onBlur={(e) => {
                          if (e.target.value && !e.target.value.includes('•••')) {
                            handleSaveKey(p.id, e.target.value.trim());
                          }
                        }}
                      />
                      <button
                        disabled={savingKey === p.id}
                        onClick={(e) => {
                          const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                          if (input && input.value && !input.value.includes('•••')) {
                            handleSaveKey(p.id, input.value.trim());
                          }
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0 14px', height: '36px' }}
                      >
                        {savingKey === p.id ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Media & Stock Video Providers Section */}
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎬</span> Stock Video & Motion Media
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { id: 'pexels', name: 'Pexels Video API', desc: 'Curated 1080p stock footage library' },
                { id: 'pixabay', name: 'Pixabay Video API', desc: 'Secondary HD stock footage catalog provider' },
                { id: 'runway', name: 'Runway Gen-3 Alpha', desc: 'Generative AI video motion synthesis engine' },
              ].map((p) => {
                const isConfigured = !!credentials[p.id];
                return (
                  <div key={p.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ maxWidth: '440px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '13px', color: '#fff' }}>{p.name}</strong>
                        <span className={`status-pill ${isConfigured ? 'READY' : 'DRAFT'}`}>
                          {isConfigured ? 'Configured' : 'Not Configured'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.desc}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '340px' }}>
                      <input
                        type="password"
                        placeholder="Enter API Key"
                        defaultValue={credentials[p.id] || ''}
                        className="form-input"
                        style={{ flex: 1, minWidth: '180px', fontSize: '12px', padding: '8px 12px' }}
                        onBlur={(e) => {
                          if (e.target.value && !e.target.value.includes('•••')) {
                            handleSaveKey(p.id, e.target.value.trim());
                          }
                        }}
                      />
                      <button
                        disabled={savingKey === p.id}
                        onClick={(e) => {
                          const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                          if (input && input.value && !input.value.includes('•••')) {
                            handleSaveKey(p.id, input.value.trim());
                          }
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0 14px', height: '36px' }}
                      >
                        {savingKey === p.id ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voice Providers Section */}
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎙️</span> Neural Voice Synthesis
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { id: 'elevenlabs', name: 'ElevenLabs Voice AI', desc: 'Ultra-realistic neural voice synthesis with voice cloning' },
              ].map((p) => {
                const isConfigured = !!credentials[p.id];
                return (
                  <div key={p.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ maxWidth: '440px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '13px', color: '#fff' }}>{p.name}</strong>
                        <span className={`status-pill ${isConfigured ? 'READY' : 'DRAFT'}`}>
                          {isConfigured ? 'Configured' : 'Not Configured'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.desc}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="password"
                        placeholder="Enter API Key"
                        defaultValue={credentials[p.id] || ''}
                        className="form-input"
                        style={{ width: '220px', fontSize: '12px', padding: '6px 10px' }}
                        onBlur={(e) => {
                          if (e.target.value && !e.target.value.includes('•••')) {
                            handleSaveKey(p.id, e.target.value.trim());
                          }
                        }}
                      />
                      <button
                        disabled={savingKey === p.id}
                        onClick={(e) => {
                          const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                          if (input && input.value && !input.value.includes('•••')) {
                            handleSaveKey(p.id, input.value.trim());
                          }
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        {savingKey === p.id ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
