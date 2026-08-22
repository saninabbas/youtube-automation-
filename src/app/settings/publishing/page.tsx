'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface YouTubeStatus {
  status: 'CONNECTED' | 'NOT_CONNECTED' | 'AUTH_REQUIRED';
  channel?: {
    id: string;
    title: string;
    email?: string;
  };
  message: string;
}

export default function PublishingSettingsPage() {
  const [ytStatus, setYtStatus] = useState<YouTubeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const [statusRes, urlRes] = await Promise.all([
        fetch('/api/auth/youtube/status'),
        fetch('/api/auth/youtube/url'),
      ]);

      if (statusRes.ok) {
        const sData = await statusRes.json();
        setYtStatus(sData);
      }
      if (urlRes.ok) {
        const uData = await urlRes.json();
        setAuthUrl(uData.authUrl);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Check query params for notifications
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('connected') === 'true') {
        setSuccessMsg('YouTube channel connected successfully.');
      }
      if (params.get('error')) {
        setError(decodeURIComponent(params.get('error') || 'Authentication failed'));
      }
    }
  }, []);

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      setError(null);
      const res = await fetch('/api/auth/youtube/disconnect', { method: 'POST' });
      if (res.ok) {
        setSuccessMsg('YouTube account disconnected.');
        await fetchStatus();
      } else {
        const d = await res.json();
        throw new Error(d.error || 'Failed to disconnect');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Publishing & Platform Connections</h1>
          <p className="page-subtitle">Connect and manage direct API publishing credentials</p>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
          ✓ {successMsg}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--error-bg)', color: '#f87171', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* YouTube Connection Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 className="card-title">YouTube Data API v3</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
              Automated video uploading, thumbnail setting, metadata updating, and scheduling
            </p>
          </div>
          <span
            className="badge"
            style={{
              backgroundColor: ytStatus?.status === 'CONNECTED' ? 'rgba(52, 211, 153, 0.15)' : 'var(--bg-secondary)',
              color: ytStatus?.status === 'CONNECTED' ? '#34d399' : 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {loading ? 'CHECKING...' : ytStatus?.status === 'CONNECTED' ? 'CONNECTED' : 'NOT CONNECTED'}
          </span>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '10px 0' }}>Checking connection...</div>
        ) : ytStatus?.status === 'CONNECTED' && ytStatus.channel ? (
          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', marginBottom: '16px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Channel Name: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{ytStatus.channel.title}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Channel ID: </span>
                <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{ytStatus.channel.id}</span>
              </div>
              {ytStatus.channel.email && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Account Email: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{ytStatus.channel.email}</span>
                </div>
              )}
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Permission Scope: </span>
                <span style={{ color: 'var(--text-secondary)' }}>Upload, Thumbnail, Metadata</span>
              </div>
            </div>

            <button
              className="btn btn-danger btn-sm"
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting ? 'Disconnecting...' : 'Disconnect YouTube Account'}
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
              {ytStatus?.message || 'Connect your Google account with YouTube channel access to enable automated publishing.'}
            </p>

            {authUrl ? (
              <a href={authUrl} className="btn btn-primary">
                CONNECT YOUTUBE
              </a>
            ) : (
              <div style={{ background: 'var(--bg-secondary)', padding: '14px 16px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-secondary)' }}>Google OAuth credentials required:</strong> Add <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> to your environment variables to connect.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Future Platforms Placeholder Section */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '12px' }}>Other Publishing Platforms</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
          Additional direct API publishing channels supported by provider abstraction:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {['TikTok', 'Instagram', 'Facebook'].map((plat) => (
            <div key={plat} style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>{plat}</span>
              <span className="badge" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '11px' }}>
                NOT CONNECTED
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
