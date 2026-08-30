'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Channel {
  id: string;
  name: string;
  niche: string;
  language: string;
  voice: string;
  voice_speed: string;
  target_duration_minutes: number;
  visual_style: string;
  subtitle_style: string;
  intro_style: string;
  outro_cta: string;
  publishing_platform: string;
  content_rules: string;
  publishing_days?: string;
  publishing_time?: string;
  timezone?: string;
  default_visibility?: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
  auto_publish?: number;
  video_count?: number;
  created_at: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [niche, setNiche] = useState('');
  const [language, setLanguage] = useState('en');
  const [voice, setVoice] = useState('en-US-ChristopherNeural');
  const [voiceSpeed, setVoiceSpeed] = useState('1.0x');
  const [targetDuration, setTargetDuration] = useState(5);
  const [visualStyle, setVisualStyle] = useState('Cinematic High-Contrast');
  const [subtitleStyle, setSubtitleStyle] = useState('Modern Clean White');
  const [introStyle, setIntroStyle] = useState('High-Impact Dramatic Question');
  const [outroCta, setOutroCta] = useState('Subscribe to the channel and leave your thoughts below');
  const [publishingPlatform, setPublishingPlatform] = useState('YouTube');
  const [contentRules, setContentRules] = useState('Engaging, clear, professional delivery');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Wednesday', 'Friday']);
  const [publishingTime, setPublishingTime] = useState('14:00');
  const [timezone, setTimezone] = useState('UTC');
  const [defaultVisibility, setDefaultVisibility] = useState<'PRIVATE' | 'UNLISTED' | 'PUBLIC'>('PRIVATE');
  const [autoPublish, setAutoPublish] = useState(false);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/channels');
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch channels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const openCreateModal = () => {
    setEditingChannel(null);
    setName('');
    setNiche('');
    setLanguage('en');
    setVoice('en-US-ChristopherNeural');
    setVoiceSpeed('1.0x');
    setTargetDuration(5);
    setVisualStyle('Cinematic High-Contrast');
    setSubtitleStyle('Modern Clean White');
    setIntroStyle('High-Impact Dramatic Question');
    setOutroCta('Subscribe to the channel and leave your thoughts below');
    setPublishingPlatform('YouTube');
    setContentRules('Engaging, clear, professional delivery');
    setSelectedDays(['Monday', 'Wednesday', 'Friday']);
    setPublishingTime('14:00');
    setTimezone('UTC');
    setDefaultVisibility('PRIVATE');
    setAutoPublish(false);
    setShowModal(true);
  };

  const openEditModal = (ch: Channel) => {
    setEditingChannel(ch);
    setName(ch.name);
    setNiche(ch.niche);
    setLanguage(ch.language);
    setVoice(ch.voice);
    setVoiceSpeed(ch.voice_speed || '1.0x');
    setTargetDuration(ch.target_duration_minutes || 5);
    setVisualStyle(ch.visual_style || 'Cinematic High-Contrast');
    setSubtitleStyle(ch.subtitle_style || 'Modern Clean White');
    setIntroStyle(ch.intro_style || 'High-Impact Dramatic Question');
    setOutroCta(ch.outro_cta || 'Subscribe to the channel');
    setPublishingPlatform(ch.publishing_platform || 'YouTube');
    setContentRules(ch.content_rules || 'Engaging, clear, professional delivery');

    try {
      setSelectedDays(ch.publishing_days ? JSON.parse(ch.publishing_days) : ['Monday', 'Wednesday', 'Friday']);
    } catch {
      setSelectedDays(['Monday', 'Wednesday', 'Friday']);
    }

    setPublishingTime(ch.publishing_time || '14:00');
    setTimezone(ch.timezone || 'UTC');
    setDefaultVisibility(ch.default_visibility || 'PRIVATE');
    setAutoPublish(!!ch.auto_publish);
    setShowModal(true);
  };

  const handleSaveChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !niche.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        niche: niche.trim(),
        language,
        voice,
        voice_speed: voiceSpeed,
        target_duration_minutes: targetDuration,
        visual_style: visualStyle,
        subtitle_style: subtitleStyle,
        intro_style: introStyle,
        outro_cta: outroCta,
        publishing_platform: publishingPlatform,
        content_rules: contentRules,
        publishing_days: JSON.stringify(selectedDays),
        publishing_time: publishingTime,
        timezone,
        default_visibility: defaultVisibility,
        auto_publish: autoPublish ? 1 : 0,
      };

      const url = editingChannel ? `/api/channels/${editingChannel.id}` : '/api/channels';
      const method = editingChannel ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save channel');

      setShowModal(false);
      await fetchChannels();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChannel = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete channel "${name}"? All associated videos will be retained.`)) return;
    try {
      const res = await fetch(`/api/channels/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchChannels();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="content-container" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
            Channel Management
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Configure niche personas, voiceover profiles, and automated publishing calendars for each channel.
          </p>
        </div>

        <button onClick={openCreateModal} className="btn btn-primary btn-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>New Channel</span>
        </button>
      </div>

      {/* YouTube Connection Banner */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'linear-gradient(135deg, rgba(255, 0, 0, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)',
          border: '1px solid rgba(255, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#ff0000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#000" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>YouTube OAuth 2.0 Integration</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Connect your Google YouTube channel for 1-click video publishing and 30-day autopilot scheduling.</div>
          </div>
        </div>
        <Link href="/settings/publishing" className="btn btn-secondary btn-sm" style={{ border: '1px solid rgba(255, 0, 0, 0.3)', color: '#fff' }}>
          <span>Connect YouTube Channel ➔</span>
        </Link>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading channels...</div>
      ) : channels.length === 0 ? (
        <div
          style={{
            padding: '64px',
            textAlign: 'center',
            background: 'var(--bg-secondary)',
            border: '1px dashed var(--border-medium)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📺</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>No channels created yet</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Set up your first channel profile to define your visual aesthetic and voiceover persona.
          </p>
          <button onClick={openCreateModal} className="btn btn-primary btn-sm">
            + Create Your First Channel
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '22px' }}>
          {channels.map((ch) => (
            <div key={ch.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--gradient-brand)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: '#fff',
                      fontSize: '14px',
                    }}
                  >
                    {ch.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{ch.name}</h3>
                    <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600 }}>{ch.niche}</span>
                  </div>
                </div>

                <span className="status-pill READY">{ch.publishing_platform}</span>
              </div>

              {/* Specs Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Duration</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{ch.target_duration_minutes} Minutes</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Spoken Voice</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {ch.voice.split('-')[2] || ch.voice}
                  </div>
                </div>
              </div>

              {/* Schedule Info */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>Auto-Publish: <strong style={{ color: ch.auto_publish ? 'var(--status-live)' : 'var(--text-muted)' }}>{ch.auto_publish ? 'Enabled' : 'Disabled'}</strong></span>
                <span>{ch.video_count || 0} Videos</span>
              </div>

              {/* Card Footer Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openEditModal(ch)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
                    Edit
                  </button>
                  <button onClick={() => handleDeleteChannel(ch.id, ch.name)} className="btn btn-ghost btn-sm" style={{ color: 'var(--status-error)', padding: '4px 8px' }}>
                    Delete
                  </button>
                </div>

                <Link href={`/content/new?channel_id=${ch.id}`} className="btn btn-primary btn-sm">
                  + Create Video
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            className="card card-glow"
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                {editingChannel ? 'Edit Channel Profile' : 'Create New Channel Profile'}
              </h2>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>

            <form onSubmit={handleSaveChannel} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Channel Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Apex Health & Vitality"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Niche / Topic Domain</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Health & Longevity, AI Tech, Personal Finance"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Default Duration</label>
                  <select
                    className="form-select"
                    value={targetDuration}
                    onChange={(e) => setTargetDuration(Number(e.target.value))}
                  >
                    <option value="1">1 Minute (Shorts)</option>
                    <option value="3">3 Minutes</option>
                    <option value="5">5 Minutes</option>
                    <option value="8">8 Minutes (Masterclass)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Neural Voice</label>
                  <select className="form-select" value={voice} onChange={(e) => setVoice(e.target.value)}>
                    <option value="en-US-ChristopherNeural">Christopher (Male)</option>
                    <option value="en-US-JennyNeural">Jenny (Female)</option>
                    <option value="en-US-GuyNeural">Guy (Deep)</option>
                    <option value="en-GB-SoniaNeural">Sonia (British)</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Visual Style</label>
                <select className="form-select" value={visualStyle} onChange={(e) => setVisualStyle(e.target.value)}>
                  <option value="Cinematic High-Contrast">Cinematic High-Contrast</option>
                  <option value="Documentary Minimalist">Documentary Minimalist</option>
                  <option value="Cyber Cyberpunk Tech">Cyber Cyberpunk Tech</option>
                  <option value="Emerald Nature Vitality">Emerald Nature Vitality</option>
                  <option value="Gold Luxury Business">Gold Luxury Business</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <input
                  type="checkbox"
                  id="chAutoPub"
                  checked={autoPublish}
                  onChange={(e) => setAutoPublish(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
                <label htmlFor="chAutoPub" style={{ fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Enable auto-publishing on schedule
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
                  {submitting ? 'Saving...' : 'Save Channel Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
