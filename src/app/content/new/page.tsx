'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Channel {
  id: string;
  name: string;
  niche: string;
  language: string;
  voice: string;
}

function NewVideoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedChannelId = searchParams.get('channel_id');

  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [channelId, setChannelId] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [videoLength, setVideoLength] = useState<number>(8);
  const [language, setLanguage] = useState<string>('en');

  useEffect(() => {
    const loadChannels = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/channels');
        if (res.ok) {
          const data = await res.json();
          const list = data.channels || [];
          setChannels(list);
          if (preselectedChannelId && list.some((c: Channel) => c.id === preselectedChannelId)) {
            setChannelId(preselectedChannelId);
          } else if (list.length > 0) {
            setChannelId(list[0].id);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadChannels();
  }, [preselectedChannelId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelId || !topic.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: channelId,
          topic: topic.trim(),
          target_length_minutes: Number(videoLength),
          language,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start video generation');
      }

      const data = await res.json();
      router.push(`/content/${data.projectId}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Video Project</h1>
          <p className="page-subtitle">Configure topic and target duration to begin automated video production</p>
        </div>
        <Link href="/content" className="btn btn-secondary">
          Back to Videos
        </Link>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--error-bg)', color: '#f87171', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', maxWidth: '580px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px 0', color: 'var(--text-secondary)' }}>Loading channel options...</div>
      ) : channels.length === 0 ? (
        <div className="card form-container">
          <h3 className="card-title" style={{ marginBottom: '8px' }}>No Channels Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
            You need at least one channel to generate videos. Please create a channel first.
          </p>
          <Link href="/channels" className="btn btn-primary">
            Go to Channels
          </Link>
        </div>
      ) : (
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Channel</label>
              <select
                className="form-select"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                required
              >
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.niche})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Topic</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 5 Morning Habits That Can Improve Your Health"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
              <p className="form-helper">Enter any topic or concept. The AI engine adapts to your channel niche.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Target Video Length</label>
              <select
                className="form-select"
                value={videoLength}
                onChange={(e) => setVideoLength(Number(e.target.value))}
              >
                <option value={3}>3 Minutes (Short format)</option>
                <option value={5}>5 Minutes (Standard format)</option>
                <option value={8}>8 Minutes (Long-form breakdown)</option>
                <option value={10}>10 Minutes (Comprehensive guide)</option>
              </select>
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

            <div style={{ marginTop: '30px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
                disabled={submitting}
              >
                {submitting ? 'Initiating Pipeline...' : 'GENERATE VIDEO'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function NewVideoPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px 0', color: 'var(--text-secondary)' }}>Loading...</div>}>
      <NewVideoForm />
    </Suspense>
  );
}
