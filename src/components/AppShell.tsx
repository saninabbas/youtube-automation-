'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Check if current route is an unauthenticated auth page, dedicated admin portal, or public landing page
  const isStandalonePage = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/onboarding', '/admin'].some(
    (p) => pathname === p || pathname?.startsWith(p + '/')
  ) || (pathname === '/' && !currentUser);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setShowUserMenu(false);
    setShowNotifications(false);
  }, [pathname]);

  // Fetch current user & credits
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
            setCredits(data.credits);
          }
        }
      } catch {}
    };
    fetchUser();
  }, [pathname]);

  if (isStandalonePage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navSections = [
    {
      title: 'Workspace',
      items: [
        {
          label: 'Dashboard',
          href: '/',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          ),
        },
        {
          label: 'Create Video',
          href: '/content/new',
          badge: '⚡ AI',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          ),
        },
        {
          label: 'Projects',
          href: '/content',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          ),
        },
        {
          label: 'Templates',
          href: '/templates',
          badge: '9 Ready',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          ),
        },
        {
          label: 'Channels',
          href: '/channels',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Insights',
      items: [
        {
          label: 'Analytics',
          href: '/analytics',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          ),
        },
        {
          label: 'Calendar',
          href: '/calendar',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          label: 'Billing & Credits',
          href: '/billing',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          ),
        },
        {
          label: 'Settings',
          href: '/settings',
          icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 35,
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          SIDEBAR NAVIGATION
      ───────────────────────────────────────────────────────────── */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link href="/" className="sidebar-brand">
            <div className="brand-icon-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  AutoVideo<span style={{ color: 'var(--accent-primary)' }}>.ai</span>
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>STUDIO 2026</span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn btn-ghost btn-icon"
            style={{ width: '28px', height: '28px', color: 'var(--text-muted)' }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {collapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
            </svg>
          </button>
        </div>

        <div className="sidebar-nav">
          {navSections.map((sec, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {!collapsed && <div className="nav-section-title">{sec.title}</div>}
              {sec.items.map((item, itemIdx) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && item.badge && <span className="nav-item-badge">{item.badge}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-profile-pill" onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="avatar-circle">
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'C'}
            </div>
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser?.name || 'Creator Workspace'}
                </span>
                <span className="tabular-nums" style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                  ⚡ {credits?.balance ?? 500} Credits
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          MAIN WRAPPER & TOPBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="main-wrapper">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setMobileOpen(true)}
              className="btn btn-ghost btn-icon"
              style={{ display: 'none' }}
              title="Open mobile menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <div className="topbar-search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search projects, channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="search-kbd">⌘K</span>
            </div>
          </div>

          <div className="topbar-actions">
            <Link href="/billing" className="credits-pill" title="Available video creation credits">
              <span style={{ color: 'var(--accent-emerald)' }}>⚡</span>
              <span className="tabular-nums">{credits?.balance ?? 500}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Credits</span>
            </Link>

            <Link href="/content/new" className="btn btn-primary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Create Video</span>
            </Link>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="btn btn-ghost btn-icon"
                style={{ position: 'relative', color: 'var(--text-secondary)' }}
                title="Notifications"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: 'var(--accent-primary)',
                    boxShadow: '0 0 6px var(--accent-primary)',
                  }}
                />
              </button>

              {showNotifications && (
                <div
                  className="card"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    width: '320px',
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                    zIndex: 50,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Notifications</span>
                    <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>Mark all read</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ padding: '8px 10px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
                      <p style={{ fontWeight: 600, color: '#fff', marginBottom: '2px' }}>Video Engine Online</p>
                      <p style={{ color: 'var(--text-secondary)' }}>1080p CFR Compositor & Google Neural TTS active.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <div className="avatar-circle">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'C'}
                </div>
              </button>

              {showUserMenu && (
                <div
                  className="card"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    width: '220px',
                    padding: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                    zIndex: 50,
                  }}
                >
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '6px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{currentUser?.name || 'Creator'}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{currentUser?.email || 'creator@autovideo.ai'}</p>
                  </div>
                  <Link href="/settings/account" className="nav-item" style={{ padding: '8px 10px' }}>
                    Account Settings
                  </Link>
                  <Link href="/billing" className="nav-item" style={{ padding: '8px 10px' }}>
                    Subscription & Plans
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="nav-item"
                    style={{ width: '100%', padding: '8px 10px', color: 'var(--status-error)', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content-container">{children}</main>
      </div>
    </div>
  );
}
