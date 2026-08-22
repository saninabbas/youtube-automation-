'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/content" className="navbar-brand">
          <span className="brand-dot" />
          <span>AutoVideo</span>
        </Link>
        <div className="navbar-links">
          <Link
            href="/channels"
            className={`nav-link ${pathname.startsWith('/channels') ? 'active' : ''}`}
          >
            Channels
          </Link>
          <Link
            href="/content"
            className={`nav-link ${pathname === '/content' || (pathname.startsWith('/content/') && pathname !== '/content/new') ? 'active' : ''}`}
          >
            Videos
          </Link>
          <Link
            href="/calendar"
            className={`nav-link ${pathname.startsWith('/calendar') ? 'active' : ''}`}
          >
            Calendar
          </Link>
          <Link
            href="/settings/publishing"
            className={`nav-link ${pathname.startsWith('/settings') ? 'active' : ''}`}
          >
            Settings
          </Link>
          <Link href="/content/new" className="btn btn-primary btn-sm" style={{ marginLeft: '8px' }}>
            + Create Video
          </Link>
        </div>
      </div>
    </nav>
  );
}
