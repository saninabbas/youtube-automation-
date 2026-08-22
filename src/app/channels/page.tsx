'use client';

import { useState, useEffect } from 'react';
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
      setError(err.message);
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
    setLanguage(ch.language || 'en');
    setVoice(ch.voice || 'en-US-ChristopherNeural');
    setVoiceSpeed(ch.voice_speed || '1.0x');
    setTargetDuration(ch.target_duration_minutes || 5);
    setVisualStyle(ch.visual_style || 'Cinematic High-Contrast');
    setSubtitleStyle(ch.subtitle_style || 'Modern Clean White');
    setIntroStyle(ch.intro_style || 'High-Impact Dramatic Question');
    setOutroCta(ch.outro_cta || 'Subscribe to the channel and leave your thoughts below');
    setPublishingPlatform(ch.publishing_platform || 'YouTube');
    setContentRules(ch.content_rules || 'Engaging, clear, professional delivery');

    let parsedDays = ['Monday', 'Wednesday', 'Friday'];
    try {
      if (ch.publishing_days) parsedDays = JSON.parse(ch.publishing_days);
    } catch {}
    setSelectedDays(parsedDays);
    setPublishingTime(ch.publishing_time || '14:00');
    setTimezone(ch.timezone || 'UTC');
    setDefaultVisibility(ch.default_visibility || 'PRIVATE');
    setAutoPublish(!!ch.auto_publish);
    setShowModal(true);
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSaveChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !niche.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        name,
        niche,
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

      if (res.ok) {
        setShowModal(false);
        await fetchChannels();
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to save channel');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChannel = async (id: string, channelName: string) => {
    if (!confirm(`Are you sure you want to delete "${channelName}"? All associated videos will be permanently removed.`)) return;

    try {
      const res = await fetch(`/api/channels/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchChannels();
      }
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Channel Profiles</h1>
          <p className="page-subtitle">Manage persistent niche styles, voice parameters, and automated release schedules</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Create Channel
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--error-bg)', color: '#f87171', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading channels...</div>
      ) : channels.length === 0 ? (
        <div className="empty-state card">
          <h3>No Channels Created</h3>
          <p>Create your first channel profile to define custom branding, voice, and publishing cadence.</p>
          <button className="btn btn-primary" onClick={openCreateModal} style={{ marginTop: '16px' }}>
            + Create First Channel
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {channels.map((ch) => {
            let days: string[] = ['Monday', 'Wednesday', 'Friday'];
            try {
              if (ch.publishing_days) days = JSON.parse(ch.publishing_days);
            } catch {}

            return (
              <div key={ch.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 className="card-title" style={{ fontSize: '17px' }}>{ch.name}</h3>
                    <span className="badge badge-tag">{ch.niche}</span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', margin: '14px 0' }}>
                    <div>🎙️ <strong>Voice:</strong> {ch.voice} ({ch.voice_speed || '1.0x'})</div>
                    <div>⏱️ <strong>Target Duration:</strong> {ch.target_duration_minutes} minutes</div>
                    <div>🎨 <strong>Visual Style:</strong> {ch.visual_style || 'Cinematic'}</div>
                    <div>📝 <strong>Subtitle Style:</strong> {ch.subtitle_style || 'Modern Clean White'}</div>
                    <div>📅 <strong>Schedule:</strong> {days.join(', ')} @ {ch.publishing_time || '14:00'} ({ch.timezone || 'UTC'})</div>
                    <div>📡 <strong>Platform / Vis:</strong> {ch.publishing_platform || 'YouTube'} ({ch.default_visibility || 'PRIVATE'})</div>
                    <div>⚡ <strong>Auto-Publish:</strong> <span style={{ color: ch.auto_publish ? '#34d399' : 'var(--text-muted)' }}>{ch.auto_publish ? 'ENABLED' : 'DISABLED'}</span></div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '10px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ch.video_count || 0} Videos</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(ch)} style={{ fontSize: '12px', padding: '4px 10px' }}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteChannel(ch.id, ch.name)} style={{ fontSize: '12px', padding: '4px 8px' }}>
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Creating / Editing Channel */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingChannel ? 'Edit Channel Profile' : 'Create Channel Profile'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveChannel}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Channel Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Healthy Years"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Niche Category *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Health & Longevity, Tech, Finance"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Default Voice</label>
                  <select className="form-select" value={voice} onChange={(e) => setVoice(e.target.value)}>
                    <option value="en-US-ChristopherNeural">en-US-ChristopherNeural (Authoritative Male)</option>
                    <option value="en-US-JennyNeural">en-US-JennyNeural (Engaging Female)</option>
                    <option value="en-US-GuyNeural">en-US-GuyNeural (Direct Executive Male)</option>
                    <option value="en-US-AriaNeural">en-US-AriaNeural (Expressive Female)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Voice Speed Multiplier</label>
                  <select className="form-select" value={voiceSpeed} onChange={(e) => setVoiceSpeed(e.target.value)}>
                    <option value="0.95x">0.95x (Deliberate / Documented)</option>
                    <option value="1.0x">1.0x (Natural Pace)</option>
                    <option value="1.05x">1.05x (Brisk / High-Energy)</option>
                    <option value="1.1x">1.1x (Fast-Paced)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Target Duration</label>
                  <select className="form-select" value={targetDuration} onChange={(e) => setTargetDuration(Number(e.target.value))}>
                    <option value={1}>1 Minute (Shorts / Teaser)</option>
                    <option value={3}>3 Minutes (Standard Short Form)</option>
                    <option value={5}>5 Minutes (Standard Video)</option>
                    <option value={8}>8 Minutes (Long-Form Masterclass)</option>
                    <option value={10}>10 Minutes (Comprehensive In-Depth)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Visual Style Theme</label>
                  <select className="form-select" value={visualStyle} onChange={(e) => setVisualStyle(e.target.value)}>
                    <option value="Cinematic High-Contrast">Cinematic High-Contrast</option>
                    <option value="Clean Emerald Wellness">Clean Emerald Wellness</option>
                    <option value="Tech Matrix / Cyber Sleek">Tech Matrix / Cyber Sleek</option>
                    <option value="Executive Gold & Navy">Executive Gold & Navy</option>
                    <option value="Warm Documentary Vintage">Warm Documentary Vintage</option>
                    <option value="Minimalist Modern Studio">Minimalist Modern Studio</option>
                  </select>
                </div>
              </div>

              {/* Automated Release Schedule Section */}
              <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-subtle)', margin: '14px 0' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
                  📅 Automated Release Schedule & Cadence
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label className="form-label" style={{ fontSize: '12px' }}>Publishing Days</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`btn btn-sm ${selectedDays.includes(day) ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '11px' }}>Release Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={publishingTime}
                      onChange={(e) => setPublishingTime(e.target.value)}
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '11px' }}>Default Visibility</label>
                    <select
                      className="form-select"
                      value={defaultVisibility}
                      onChange={(e: any) => setDefaultVisibility(e.target.value)}
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                    >
                      <option value="PRIVATE">PRIVATE</option>
                      <option value="UNLISTED">UNLISTED</option>
                      <option value="PUBLIC">PUBLIC</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '11px' }}>Auto-Publish</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginTop: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={autoPublish}
                        onChange={(e) => setAutoPublish(e.target.checked)}
                      />
                      <span>Enable</span>
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingChannel ? 'Update Channel' : 'Create Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
