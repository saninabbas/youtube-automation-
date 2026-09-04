'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';

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
  publish_url?: string | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  channel_name: string;
  channel_niche: string;
  created_at: string;
}

function ContentLibraryList() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'GENERATING' | 'READY' | 'PUBLISHED' | 'FAILED'>('ALL');
  const [search, setSearch] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<'newest' | 'duration' | 'title'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch projects');
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

  // Tab Filtering
  const filteredProjects = projects.filter((p) => {
    // Search match
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTopic = p.topic?.toLowerCase().includes(q);
      const matchChannel = p.channel_name?.toLowerCase().includes(q);
      if (!matchTopic && !matchChannel) return false;
    }

    if (activeTab === 'ALL') return true;
    if (activeTab === 'GENERATING') return p.status === 'PROCESSING' || p.status === 'PENDING' || p.publishing_status === 'UPLOADING';
    if (activeTab === 'READY') return p.status === 'COMPLETED' && (!p.publishing_status || p.publishing_status === 'READY' || p.publishing_status === 'DRAFT');
    if (activeTab === 'PUBLISHED') return p.publishing_status === 'PUBLISHED' || p.publishing_status === 'SCHEDULED';
    if (activeTab === 'FAILED') return p.status === 'FAILED' || p.publishing_status === 'FAILED';
    return true;
  });

  // Sorting
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'duration') return b.target_length_minutes - a.target_length_minutes;
    if (sortBy === 'title') return a.topic.localeCompare(b.topic);
    return 0;
  });

  const countGenerating = projects.filter((p) => p.status === 'PROCESSING' || p.status === 'PENDING' || p.publishing_status === 'UPLOADING').length;
  const countReady = projects.filter((p) => p.status === 'COMPLETED' && (!p.publishing_status || p.publishing_status === 'READY' || p.publishing_status === 'DRAFT')).length;
  const countPublished = projects.filter((p) => p.publishing_status === 'PUBLISHED' || p.publishing_status === 'SCHEDULED').length;
  const countFailed = projects.filter((p) => p.status === 'FAILED' || p.publishing_status === 'FAILED').length;

  const handleRetryProject = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/projects/${id}/retry`, { method: 'POST' });
      if (res.ok) {
        await fetchProjects();
      }
    } catch (err) {
      console.error('Failed to retry project:', err);
    }
  };

  return (
    <div className="content-container" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* ───────────────────────────────────────────────────────────
          1. HEADER BAR
      ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
            Video Projects Library
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Manage generated videos, monitor background pipeline jobs, and inspect 1080p production assets.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link href="/calendar" className="btn btn-secondary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Calendar View</span>
          </Link>

          <Link href="/content/new" className="btn btn-primary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>New Video</span>
          </Link>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          2. FILTER TABS & CONTROLS
      ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '12px 18px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
          {[
            { id: 'ALL', label: 'All Projects', count: projects.length },
            { id: 'GENERATING', label: 'Generating', count: countGenerating },
            { id: 'READY', label: 'Ready', count: countReady },
            { id: 'PUBLISHED', label: 'Published', count: countPublished },
            { id: 'FAILED', label: 'Failed', count: countFailed },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`btn btn-sm ${activeTab === t.id ? 'btn-secondary' : 'btn-ghost'}`}
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: activeTab === t.id ? 700 : 500,
                color: activeTab === t.id ? '#fff' : 'var(--text-secondary)',
                background: activeTab === t.id ? 'var(--bg-elevated)' : 'transparent',
                borderColor: activeTab === t.id ? 'var(--border-medium)' : 'transparent',
              }}
            >
              <span>{t.label}</span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  background: activeTab === t.id ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: '#fff',
                  marginLeft: '4px',
                }}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search, Sort, View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Filter topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ padding: '6px 10px 6px 30px', fontSize: '12px', width: '160px', borderRadius: 'var(--radius-md)' }}
            />
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-muted)' }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ padding: '6px 10px', fontSize: '12px', width: 'auto', borderRadius: 'var(--radius-md)' }}
          >
            <option value="newest">Newest First</option>
            <option value="duration">Longest Duration</option>
            <option value="title">Alphabetical</option>
          </select>

          <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '2px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'var(--bg-elevated)' : 'transparent',
                border: 'none',
                color: viewMode === 'grid' ? '#fff' : 'var(--text-muted)',
                padding: '4px 6px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              title="Grid View"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                background: viewMode === 'list' ? 'var(--bg-elevated)' : 'transparent',
                border: 'none',
                color: viewMode === 'list' ? '#fff' : 'var(--text-muted)',
                padding: '4px 6px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              title="List View"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          3. PROJECTS DISPLAY (Grid or List)
      ─────────────────────────────────────────────────────────── */}
      {loading && projects.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading video projects library...
        </div>
      ) : sortedProjects.length === 0 ? (
        <div
          style={{
            padding: '64px',
            textAlign: 'center',
            background: 'var(--bg-secondary)',
            border: '1px dashed var(--border-medium)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎬</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>
            No projects found in this view
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '380px', margin: '0 auto 24px' }}>
            {search ? `No projects match "${search}". Try clearing your filter.` : 'Create a new automated video to populate your production library.'}
          </p>
          <Link href="/content/new" className="btn btn-primary btn-sm">
            + Create New Video
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '22px' }}>
          {sortedProjects.map((p) => (
            <Link
              key={p.id}
              href={`/content/${p.id}`}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                padding: '16px',
                textDecoration: 'none',
              }}
            >
              {/* Thumbnail 16:9 */}
              <div
                style={{
                  aspectRatio: '16 / 9',
                  borderRadius: 'var(--radius-md)',
                  background: '#000',
                  position: 'relative',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at center, rgba(99,102,241,0.18) 0%, rgba(0,0,0,0.85) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.12)',
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>

                {/* Status Badges */}
                <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
                  <span className={`status-pill ${p.status}`}>{p.status}</span>
                  {p.publishing_status && p.publishing_status !== 'DRAFT' && (
                    <span className={`status-pill ${p.publishing_status}`}>{p.publishing_status}</span>
                  )}
                </div>

                {/* Duration */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.8)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {p.target_length_minutes} min
                </div>
              </div>

              {/* Title & Metadata */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {p.topic}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>{p.channel_name || 'Default Channel'}</span>
                  <span>Stage: <strong style={{ color: 'var(--text-secondary)' }}>{p.current_stage}</strong></span>
                </div>
              </div>

              {/* Actions Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-subtle)',
                  marginTop: 'auto',
                }}
              >
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  {new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {p.status === 'FAILED' && (
                    <button
                      onClick={(e) => handleRetryProject(p.id, e)}
                      className="btn btn-danger btn-sm"
                      title="Retry Pipeline"
                    >
                      Retry
                    </button>
                  )}

                  <span className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '11px' }}>
                    Open Studio ➔
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* List View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sortedProjects.map((p) => (
            <Link
              key={p.id}
              href={`/content/${p.id}`}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                textDecoration: 'none',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                <div
                  style={{
                    width: '64px',
                    height: '36px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--accent-primary)' }}>
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>

                <div style={{ minWidth: 0 }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.topic}
                  </h4>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                    <span>{p.channel_name}</span>
                    <span>•</span>
                    <span>{p.target_length_minutes}m</span>
                    <span>•</span>
                    <span>Stage: {p.current_stage}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                <span className={`status-pill ${p.status}`}>{p.status}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {new Date(p.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ContentLibraryPage() {
  return (
    <React.Suspense fallback={<div className="content-container">Loading projects...</div>}>
      <ContentLibraryList />
    </React.Suspense>
  );
}
