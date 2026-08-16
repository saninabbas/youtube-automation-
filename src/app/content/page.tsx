'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  topic: string;
  channel_id: string;
  channel_name: string;
  channel_niche: string;
  target_length_minutes: number;
  language: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  current_stage: string;
  created_at: string;
}

export default function ContentPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 4000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="badge badge-completed">
            <span className="status-dot completed" />
            COMPLETED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="badge badge-processing">
            <span className="status-dot processing" />
            PROCESSING
          </span>
        );
      case 'FAILED':
        return (
          <span className="badge badge-failed">
            <span className="status-dot failed" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="badge badge-pending">
            <span className="status-dot pending" />
            PENDING
          </span>
        );
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Videos</h1>
          <p className="page-subtitle">All automated video generation projects across your channels</p>
        </div>
        <Link href="/content/new" className="btn btn-primary">
          + Create Video
        </Link>
      </div>

      {loading && projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Loading video projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="card empty-state">
          <h3 className="empty-state-title">No videos generated yet</h3>
          <p className="empty-state-text">Select a channel and topic to generate your first AI video.</p>
          <Link href="/content/new" className="btn btn-primary">
            Create First Video
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title / Topic</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Target Length</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <Link
                      href={`/content/${project.id}`}
                      style={{ fontWeight: 600, color: 'var(--text-primary)' }}
                    >
                      {project.topic}
                    </Link>
                  </td>
                  <td>
                    <span className="badge badge-tag">{project.channel_name}</span>
                  </td>
                  <td>{getStatusBadge(project.status)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {project.target_length_minutes} min
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    {new Date(project.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
