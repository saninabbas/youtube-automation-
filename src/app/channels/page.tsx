'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Channel {
  id: string;
  name: string;
  niche: string;
  language: string;
  voice: string;
  video_count?: number;
  created_at: string;
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [niche, setNiche] = useState('');
  const [language, setLanguage] = useState('en');
  const [voice, setVoice] = useState('en-US-ChristopherNeural');

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/channels');
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !niche.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, niche, language, voice }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create channel');
      }

      setName('');
      setNiche('');
      setShowModal(false);
      await fetchChannels();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Channels</h1>
          <p className="page-subtitle">Manage your independent content channels and niches</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Create Channel
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--error-bg)', color: '#f87171', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Loading channels...
        </div>
      ) : channels.length === 0 ? (
        <div className="card empty-state">
          <h3 className="empty-state-title">No channels yet</h3>
          <p className="empty-state-text">Create your first channel to start automating multi-channel video generation.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Create First Channel
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {channels.map((channel) => (
            <div key={channel.id} className="card">
              <div className="card-header">
                <h3 className="card-title">{channel.name}</h3>
                <span className="badge badge-tag">{channel.niche}</span>
              </div>
              <div className="card-meta">
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Language: </span>
                  <strong>{channel.language.toUpperCase()}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Videos: </span>
                  <strong>{channel.video_count || 0}</strong>
                </div>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                <Link
                  href={`/content/new?channel_id=${channel.id}`}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                >
                  Generate Video
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Channel</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateChannel}>
              <div className="form-group">
                <label className="form-label">Channel Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Healthy Years, Tech Explained"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Niche</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Health, Technology, Finance, History"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Language</label>
                <select
                  className="form-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English (en)</option>
                  <option value="es">Spanish (es)</option>
                  <option value="fr">French (fr)</option>
                  <option value="de">German (de)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Voice</label>
                <select
                  className="form-select"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                >
                  <option value="en-US-ChristopherNeural">Default Voice (Christopher - Deep & Calm)</option>
                  <option value="en-US-JennyNeural">Jenny (Warm & Professional)</option>
                  <option value="en-US-GuyNeural">Guy (Documentary / Casual)</option>
                  <option value="en-GB-SoniaNeural">Sonia (British English)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
