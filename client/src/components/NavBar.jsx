import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiBell, FiSearch, FiMenu, FiX, FiChevronDown, FiLogOut, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import clsx from 'clsx';

/**
 * NavBar
 *
 * - Responsive and accessible top navigation.
 * - Includes: brand, search (desktop), notification button with dropdown preview,
 *   profile dropdown (with avatar / name / actions), and a mobile menu.
 * - Keyboard accessible: Escape closes open menus, clicking outside closes menus.
 * - Polls notifications in background and shows unread badge.
 */

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [q, setQ] = useState('');
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  // dropdown states
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const mobileRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!user) {
        if (mounted) {
          setNotifications([]);
          setUnread(0);
        }
        return;
      }
      setLoadingNotifs(true);
      try {
        const res = await api.get('/api/notifications?limit=20');
        const list = res.data || [];
        if (!mounted) return;
        setNotifications(list);
        setUnread((list || []).filter(n => !n.read).length);
      } catch (e) {
        // silent fail
      } finally {
        if (mounted) setLoadingNotifs(false);
      }
    }

    load();
    const t = setInterval(load, 20000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [user]);

  // click outside handlers to close dropdowns
  useEffect(() => {
    function onDoc(e) {
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (profileOpen && profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (mobileOpen && mobileRef.current && !mobileRef.current.contains(e.target)) {
        // allow clicking the menu button to toggle, but close when clicking elsewhere
        if (!e.target.closest('[data-mobile-toggle]')) setMobileOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        setProfileOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [notifOpen, profileOpen, mobileOpen]);

  function onSearch(e) {
    e.preventDefault();
    if (!q) return navigate('/');
    navigate(`/?q=${encodeURIComponent(q)}`);
  }

  async function markRead(id) {
    try {
      // optimistic update
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
      await api.post(`/api/notifications/${id}/read`);
    } catch {
      // revert on error by refetching
      try {
        const res = await api.get('/api/notifications?limit=20');
        const list = res.data || [];
        setNotifications(list);
        setUnread((list || []).filter(n => !n.read).length);
      } catch {}
    }
  }

  async function markAllRead() {
    const ids = (notifications || []).filter(n => !n.read).map(n => n._id);
    if (!ids.length) return;
    // optimistic
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
    try {
      await Promise.all(ids.map(id => api.post(`/api/notifications/${id}/read`)));
    } catch {
      // best-effort: reload notifications if failure
      try {
        const res = await api.get('/api/notifications?limit=20');
        const list = res.data || [];
        setNotifications(list);
        setUnread((list || []).filter(n => !n.read).length);
      } catch {}
    }
  }

  return (
    <header className="bg-white border-b sticky top-0 z-40">
      <div className="app-container flex items-center gap-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">JM</div>
            <div className="hidden sm:block">
              <div className="text-lg font-semibold leading-tight">JobMug</div>
              <div className="text-xs text-neutral-500">Find better matches</div>
            </div>
          </Link>
        </div>

        {/* Desktop search */}
        <form onSubmit={onSearch} className="flex-1 hidden md:block">
          <div className="relative">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search jobs, skills, companies..."
              className="form-field pl-10 pr-4"
              aria-label="Search jobs"
            />
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          </div>
        </form>

        <div className="flex items-center gap-2 ml-auto">
          {/* Mobile menu toggle */}
          <button
            data-mobile-toggle
            onClick={() => setMobileOpen(s => !s)}
            className="md:hidden p-2 rounded-md hover:bg-neutral-100"
            aria-expanded={mobileOpen}
            aria-label="Open menu"
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>

          {/* Desktop controls */}
          <div className="hidden md:flex items-center gap-2">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(s => !s); setProfileOpen(false); }}
                aria-haspopup="true"
                aria-expanded={notifOpen}
                aria-controls="notif-dropdown"
                className="relative p-2 rounded-md hover:bg-neutral-100"
                title="Notifications"
              >
                <FiBell size={20} className="text-neutral-600" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs rounded-full bg-red-600 text-white">
                    {unread}
                  </span>
                )}
              </button>

              {/* Notifications dropdown */}
              {notifOpen && (
                <div
                  id="notif-dropdown"
                  role="menu"
                  aria-label="Notifications"
                  className="absolute right-0 mt-2 w-80 max-w-sm bg-white border rounded-lg shadow-md overflow-hidden z-50"
                >
                  <div className="p-3 border-b flex items-center justify-between">
                    <div className="text-sm font-medium">Notifications</div>
                    <div className="flex items-center gap-2">
                      <button onClick={markAllRead} className="text-xs text-neutral-500 hover:underline">Mark all read</button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-auto">
                    {loadingNotifs ? (
                      <div className="p-3 text-sm text-neutral-500">Loading…</div>
                    ) : !notifications.length ? (
                      <div className="p-3 text-sm text-neutral-600">No notifications</div>
                    ) : (
                      notifications.slice(0, 12).map(n => (
                        <button
                          key={n._id}
                          onClick={() => {
                            if (n.link) {
                              setNotifOpen(false);
                              // internal links route in-app, external open new tab
                              if (n.link.startsWith('/')) navigate(n.link);
                              else window.open(n.link, '_blank', 'noopener,noreferrer');
                            } else {
                              markRead(n._id);
                            }
                          }}
                          className={clsx(
                            'w-full text-left px-3 py-2 hover:bg-neutral-50 flex items-start gap-3',
                            n.read ? 'opacity-80' : 'bg-white'
                          )}
                          role="menuitem"
                        >
                          <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-semibold">
                            {n.title ? n.title.slice(0,1).toUpperCase() : 'N'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-neutral-900">{n.title}</div>
                            <div className="text-xs text-neutral-600 truncate">{n.body}</div>
                            <div className="text-xs text-neutral-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="p-3 border-t text-xs text-neutral-500">
                    <Link to="/notifications" onClick={() => setNotifOpen(false)} className="hover:underline">View all notifications</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setProfileOpen(s => !s); setNotifOpen(false); }}
                aria-haspopup="true"
                aria-expanded={profileOpen}
                aria-controls="profile-dropdown"
                className="inline-flex items-center gap-2 p-2 rounded-md hover:bg-neutral-100"
                title="Account"
              >
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-sm text-neutral-700">
                  {user?.name ? user.name.slice(0,1).toUpperCase() : <FiUser />}
                </div>
                <div className="hidden sm:block text-sm text-neutral-700">{user?.name}</div>
                <FiChevronDown className="text-neutral-400" />
              </button>

              {profileOpen && (
                <div
                  id="profile-dropdown"
                  role="menu"
                  aria-label="Account menu"
                  className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-md overflow-hidden z-50"
                >
                  <div className="px-3 py-3 border-b">
                    <div className="text-sm font-medium">{user?.name}</div>
                    <div className="text-xs text-neutral-500">{user?.email}</div>
                  </div>
                  <div className="py-2">
                    <Link to="/profile" onClick={() => setProfileOpen(false)} className="block px-3 py-2 text-sm hover:bg-neutral-50">Profile</Link>
                    {user?.role === 'recruiter' && <Link to="/dashboard" onClick={() => setProfileOpen(false)} className="block px-3 py-2 text-sm hover:bg-neutral-50">Dashboard</Link>}
                    <Link to="/notifications" onClick={() => { setProfileOpen(false); setNotifOpen(false); }} className="block px-3 py-2 text-sm hover:bg-neutral-50">Notifications</Link>
                  </div>
                  <div className="px-3 py-2 border-t">
                    <button
                      onClick={() => { logout(); setProfileOpen(false); navigate('/'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm hover:bg-neutral-50"
                    >
                      <FiLogOut /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Auth CTA (mobile fallback visible on md:hidden is handled in mobile menu) */}
          {!user && (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login" className="btn btn-ghost text-sm">Login</Link>
              <Link to="/register" className="btn btn-primary text-sm">Sign up</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div id="mobile-menu" ref={mobileRef} className="md:hidden border-t bg-white">
          <div className="app-container py-3 flex flex-col gap-2">
            {/* Search */}
            <form onSubmit={onSearch}>
              <div className="relative">
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Search jobs..."
                  className="form-field pl-10 pr-4"
                  aria-label="Search jobs"
                />
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              </div>
            </form>

            <nav className="flex flex-col gap-2 mt-2">
              <Link to="/" onClick={() => setMobileOpen(false)} className="text-neutral-700">Jobs</Link>
              {user && user.role === 'recruiter' && <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="text-neutral-700">Dashboard</Link>}

              {user ? (
                <>
                  <button onClick={() => { setNotifOpen(s => !s); setMobileOpen(false); navigate('/notifications'); }} className="text-left text-neutral-700">Notifications {unread > 0 && <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs rounded-full bg-red-600 text-white">{unread}</span>}</button>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="text-neutral-700">Profile</Link>
                  <button onClick={() => { logout(); setMobileOpen(false); navigate('/'); }} className="text-left text-neutral-700">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="text-neutral-700">Login</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="text-neutral-700">Sign up</Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}